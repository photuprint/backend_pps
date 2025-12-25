import Category from '../models/category.model.js';

// Get all categories
export const getCategories = async (req, res) => {
  try {
    const { search, isActive, includeDeleted = 'true' } = req.query;
    let query = {};
    
    // Always include deleted categories by default, but allow filtering
    if (includeDeleted === 'false') {
      query.deleted = false;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    const categories = await Category.find(query).sort({ createdAt: -1 });
    
    // Ensure all categories have a categoryId (migration for existing records)
    console.log('Starting category ID migration...');
    for (let category of categories) {
      console.log('Checking category:', category._id, 'categoryId:', category.categoryId);
      if (!category.categoryId) {
        try {
          console.log('Migrating category ID for:', category._id);
          // Find the highest existing category ID number
          const existingCategories = await Category.find({ categoryId: { $exists: true, $ne: null } });
          let counter = 1001;
          
          if (existingCategories.length > 0) {
            const existingIds = existingCategories
              .map(cat => cat.categoryId)
              .filter(id => id && id.startsWith('PPSCATNM'))
              .map(id => {
                const match = id.match(/PPSCATNM(\d+)/);
                return match ? parseInt(match[1]) : 0;
              });
            
            if (existingIds.length > 0) {
              const maxNumber = Math.max(...existingIds);
              counter = maxNumber + 1;
            }
          }
          
          category.categoryId = `PPSCATNM${counter}`;
          console.log('Setting categoryId to:', category.categoryId);
          await category.save();
          console.log('Successfully migrated category ID for:', category._id);
        } catch (migrationError) {
          console.error('Error migrating category ID for category:', category._id, migrationError);
        }
      }
    }
    console.log('Category ID migration completed');
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ msg: 'Failed to fetch categories' });
  }
};

// Get single category by ID
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ msg: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ msg: 'Failed to fetch category' });
  }
};

// Create new category
export const createCategory = async (req, res) => {
  try {
    console.log('Create category request body:', req.body);
    console.log('Uploaded file:', req.file);
    
    const { name, description } = req.body;
    let { isActive = true } = req.body;
    
    // Convert string "true"/"false" to boolean (for FormData)
    if (typeof isActive === 'string') {
      isActive = isActive === 'true';
    }
    
    console.log('Processed isActive value:', isActive, 'Type:', typeof isActive);
    
    if (!name || !name.trim()) {
      return res.status(400).json({ msg: 'Category name is required' });
    }

    // Check if category with same name already exists
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    
    if (existingCategory) {
      return res.status(400).json({ msg: 'Category name already exists' });
    }

    // Auto-generate Category ID with format PPSCATNM1001, PPSCATNM1002, etc.
    let categoryId;
    let counter = 1001;
    
    do {
      categoryId = `PPSCATNM${counter}`;
      const existingCategoryId = await Category.findOne({ categoryId: categoryId });
      if (!existingCategoryId) {
        break;
      }
      counter++;
    } while (true);

    // Generate slug from name
    const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');

    // Handle image upload
    let imageUrl = null;
    if (req.file) {
      try {
        // Upload to Cloudinary
        const cloudinary = (await import('../utils/cloudinary.js')).default;
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'photuprint/categories',
        });
        imageUrl = result.secure_url;
        console.log('Image uploaded to Cloudinary:', imageUrl);
      } catch (uploadError) {
        console.error('Cloudinary upload failed:', uploadError);
        // Fallback to local storage
        imageUrl = `/uploads/${req.file.filename}`;
      }
    }

    const category = new Category({
      categoryId,
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      image: imageUrl,
      isActive
    });

    const savedCategory = await category.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ msg: 'Failed to create category' });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    console.log('Update category request body:', req.body);
    
    const { name, description } = req.body;
    let { isActive } = req.body;
    
    // Convert string "true"/"false" to boolean (for FormData)
    if (typeof isActive === 'string') {
      isActive = isActive === 'true';
    }
    
    console.log('Processed isActive value:', isActive, 'Type:', typeof isActive);
    
    // Check if category exists
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ msg: 'Category not found' });
    }

    // Check for duplicate names (excluding current category)
    if (name && name.trim() !== category.name) {
      const existingCategory = await Category.findOne({ 
        $and: [
          { _id: { $ne: req.params.id } },
          { name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } }
        ]
      });
      
      if (existingCategory) {
        return res.status(400).json({ msg: 'Category name already exists' });
      }
    }

    // Ensure category has a categoryId (for existing categories that don't have one)
    if (!category.categoryId) {
      // Find the highest existing category ID number
      const existingCategories = await Category.find({ categoryId: { $exists: true, $ne: null } });
      let counter = 1001;
      
      if (existingCategories.length > 0) {
        const existingIds = existingCategories
          .map(cat => cat.categoryId)
          .filter(id => id && id.startsWith('PPSCATNM'))
          .map(id => {
            const match = id.match(/PPSCATNM(\d+)/);
            return match ? parseInt(match[1]) : 0;
          });
        
        if (existingIds.length > 0) {
          const maxNumber = Math.max(...existingIds);
          counter = maxNumber + 1;
        }
      }
      
      category.categoryId = `PPSCATNM${counter}`;
    }

    // Update fields
    if (name && name.trim() !== category.name) {
      category.name = name.trim();
      category.slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
    }
    
    if (description !== undefined) {
      category.description = description?.trim() || null;
    }
    
    if (isActive !== undefined) {
      category.isActive = isActive;
    }

    // Handle deleted field update (for reverting deleted categories)
    if (req.body.deleted !== undefined) {
      category.deleted = req.body.deleted;
    }

    // Handle image upload
    if (req.file) {
      try {
        // Upload to Cloudinary
        const cloudinary = (await import('../utils/cloudinary.js')).default;
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'photuprint/categories',
        });
        category.image = result.secure_url;
        console.log('Image updated in Cloudinary:', category.image);
      } catch (uploadError) {
        console.error('Cloudinary upload failed:', uploadError);
        // Fallback to local storage
        category.image = `/uploads/${req.file.filename}`;
      }
    }

    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ msg: 'Failed to update category' });
  }
};

// Delete category (soft delete)
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ msg: 'Category not found' });
    }

    // Soft delete: mark as inactive and set deleted flag
    category.isActive = false;
    category.deleted = true;
    await category.save();
    
    res.json({ msg: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ msg: 'Failed to delete category' });
  }
};

// Hard delete category
export const hardDeleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ msg: 'Category not found' });
    }
    
    res.json({ msg: 'Category permanently deleted' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ msg: 'Failed to delete category' });
  }
};
