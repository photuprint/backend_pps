import Subcategory from '../models/subcategory.model.js';
import Category from '../models/category.model.js';

// Generate next subcategory ID
const generateNextSubcategoryId = async () => {
  try {
    // Find the highest existing subcategory ID number
    const lastSubcategory = await Subcategory.findOne(
      { subcategoryId: { $regex: /^PPSSUBCATNM\d+$/ } },
      {},
      { sort: { subcategoryId: -1 } }
    );
    
    if (!lastSubcategory || !lastSubcategory.subcategoryId) {
      return 'PPSSUBCATNM1001';
    }
    
    // Extract the number from the last ID
    const match = lastSubcategory.subcategoryId.match(/PPSSUBCATNM(\d+)/);
    if (match) {
      const lastNumber = parseInt(match[1]);
      return `PPSSUBCATNM${lastNumber + 1}`;
    }
    
    return 'PPSSUBCATNM1001';
  } catch (error) {
    console.error('Error generating subcategory ID:', error);
    return 'PPSSUBCATNM1001';
  }
};

// Get all subcategories
export const getSubCategories = async (req, res) => {
  try {
    const { categoryId, search, isActive, showInactive, includeDeleted } = req.query;
    let query = {};
    
    if (categoryId) {
      query.categoryId = categoryId;
    }
    
    // Handle status filtering
    if (showInactive === 'true' && includeDeleted === 'true') {
      // Show all subcategories including deleted ones
      // No additional filtering needed
    } else if (showInactive === 'true') {
      // Show active and inactive but not deleted
      query.deleted = { $ne: true };
    } else if (isActive !== undefined) {
      // Show only active subcategories
      query.isActive = isActive === 'true';
      query.deleted = { $ne: true };
    } else {
      // Default: show only active subcategories
      query.isActive = true;
      query.deleted = { $ne: true };
    }
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    const subcategories = await Subcategory.find(query)
      .sort({ createdAt: -1 });
    res.json(subcategories);
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({ msg: 'Failed to fetch subcategories' });
  }
};

// Get single subcategory by ID
export const getSubCategoryById = async (req, res) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id);
    if (!subcategory) {
      return res.status(404).json({ msg: 'Subcategory not found' });
    }
    res.json(subcategory);
  } catch (error) {
    console.error('Error fetching subcategory:', error);
    res.status(500).json({ msg: 'Failed to fetch subcategory' });
  }
};

// Create new subcategory
export const createSubCategory = async (req, res) => {
  try {
    console.log('Creating subcategory with data:', req.body);
    console.log('File data:', req.file);
    
    const { name, categoryId, description, isActive = true } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ msg: 'Subcategory name is required' });
    }
    
    if (!categoryId) {
      return res.status(400).json({ msg: 'Category ID is required' });
    }

    // Fetch category information to store directly
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(400).json({ msg: 'Category not found' });
    }

    // Check if subcategory with same name in the same category already exists
    const existingSubcategory = await Subcategory.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      categoryId: categoryId
    });
    
    if (existingSubcategory) {
      return res.status(400).json({ msg: 'Subcategory name already exists in this category' });
    }

    // Generate slug from name
    const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');

    // Handle image upload
    let imageUrl = null;
    if (req.file) {
      try {
        const cloudinary = (await import('../utils/cloudinary.js')).default;
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'photuprint/subcategories',
        });
        imageUrl = result.secure_url;
        console.log('Image uploaded to Cloudinary:', imageUrl);
      } catch (uploadError) {
        console.error('Cloudinary upload failed:', uploadError);
        imageUrl = `/uploads/${req.file.filename}`; // Fallback
      }
    }

    // Generate unique subcategory ID
    const subcategoryId = await generateNextSubcategoryId();
    
    const subcategory = new Subcategory({
      subcategoryId,
      name: name.trim(),
      slug,
      categoryId,
      categoryName: category.name, // Store category name directly
      categorySlug: category.slug, // Store category slug
      description: description?.trim() || null,
      image: imageUrl,
      isActive
    });

    const savedSubcategory = await subcategory.save();
    console.log('Subcategory saved successfully:', savedSubcategory);
    
    res.status(201).json(savedSubcategory);
  } catch (error) {
    console.error('Error creating subcategory:', error);
    res.status(500).json({ msg: 'Failed to create subcategory' });
  }
};

// Update subcategory
export const updateSubCategory = async (req, res) => {
  try {
    console.log('Updating subcategory with data:', req.body);
    console.log('File data:', req.file);
    
    const { name, categoryId, description, isActive } = req.body;
    
    // Check if subcategory exists
    const subcategory = await Subcategory.findById(req.params.id);
    if (!subcategory) {
      return res.status(404).json({ msg: 'Subcategory not found' });
    }

    // Check for duplicate names in the same category (excluding current subcategory)
    if (name && name.trim() !== subcategory.name) {
      const existingSubcategory = await Subcategory.findOne({ 
        $and: [
          { _id: { $ne: req.params.id } },
          { name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } },
          { categoryId: categoryId || subcategory.categoryId }
        ]
      });
      
      if (existingSubcategory) {
        return res.status(400).json({ msg: 'Subcategory name already exists in this category' });
      }
    }

    // Handle image upload
    let imageUrl = subcategory.image; // Keep existing image by default
    if (req.file) {
      try {
        const cloudinary = (await import('../utils/cloudinary.js')).default;
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'photuprint/subcategories',
        });
        imageUrl = result.secure_url;
        console.log('Image uploaded to Cloudinary:', imageUrl);
      } catch (uploadError) {
        console.error('Cloudinary upload failed:', uploadError);
        imageUrl = `/uploads/${req.file.filename}`; // Fallback
      }
    }

    // Update fields
    if (name && name.trim() !== subcategory.name) {
      subcategory.name = name.trim();
      subcategory.slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
    }
    
    // Handle subcategoryId update if provided
    if (req.body.subcategoryId && req.body.subcategoryId !== subcategory.subcategoryId) {
      // Check if the new ID is unique
      const existingWithId = await Subcategory.findOne({ 
        subcategoryId: req.body.subcategoryId,
        _id: { $ne: req.params.id }
      });
      
      if (existingWithId) {
        return res.status(400).json({ msg: 'Subcategory ID already exists' });
      }
      
      subcategory.subcategoryId = req.body.subcategoryId;
    }
    
    if (categoryId) {
      // Fetch updated category information
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(400).json({ msg: 'Category not found' });
      }
      
      subcategory.categoryId = categoryId;
      subcategory.categoryName = category.name; // Update category name
      subcategory.categorySlug = category.slug; // Update category slug
    }
    
    if (description !== undefined) {
      subcategory.description = description?.trim() || null;
    }
    
    if (isActive !== undefined) {
      subcategory.isActive = isActive;
    }
    
    // Update image if new one was uploaded
    if (imageUrl !== subcategory.image) {
      subcategory.image = imageUrl;
    }

    const updatedSubcategory = await subcategory.save();
    console.log('Subcategory updated successfully:', updatedSubcategory);
    
    res.json(updatedSubcategory);
  } catch (error) {
    console.error('Error updating subcategory:', error);
    res.status(500).json({ msg: 'Failed to update subcategory' });
  }
};

// Delete subcategory (soft delete)
export const deleteSubCategory = async (req, res) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id);
    if (!subcategory) {
      return res.status(404).json({ msg: 'Subcategory not found' });
    }

    subcategory.isActive = false;
    subcategory.deleted = true;
    await subcategory.save();
    
    res.json({ msg: 'Subcategory deleted successfully' });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    res.status(500).json({ msg: 'Failed to delete subcategory' });
  }
};

// Hard delete subcategory
export const hardDeleteSubCategory = async (req, res) => {
  try {
    const subcategory = await Subcategory.findByIdAndDelete(req.params.id);
    if (!subcategory) {
      return res.status(404).json({ msg: 'Subcategory not found' });
    }
    
    res.json({ msg: 'Subcategory permanently deleted' });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    res.status(500).json({ msg: 'Failed to delete subcategory' });
  }
};

// Update existing subcategories with auto-generated IDs
export const updateExistingSubcategoryIds = async (req, res) => {
  try {
    // Find subcategories without subcategoryId
    const subcategoriesWithoutId = await Subcategory.find({ 
      $or: [
        { subcategoryId: { $exists: false } },
        { subcategoryId: null },
        { subcategoryId: "" }
      ]
    });
    
    if (subcategoriesWithoutId.length === 0) {
      return res.json({ 
        message: 'All subcategories already have IDs assigned',
        updatedCount: 0 
      });
    }
    
    let updatedCount = 0;
    
    for (const subcategory of subcategoriesWithoutId) {
      try {
        const newId = await generateNextSubcategoryId();
        subcategory.subcategoryId = newId;
        await subcategory.save();
        updatedCount++;
        console.log(`Updated subcategory "${subcategory.name}" with ID: ${newId}`);
      } catch (updateError) {
        console.error(`Failed to update subcategory "${subcategory.name}":`, updateError);
      }
    }
    
    res.json({ 
      message: `Successfully updated ${updatedCount} subcategories with auto-generated IDs`,
      updatedCount 
    });
    
  } catch (error) {
    console.error('Error updating subcategory IDs:', error);
    res.status(500).json({ msg: 'Failed to update subcategory IDs' });
  }
};

// Revert deleted subcategory
export const revertSubCategory = async (req, res) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id);
    if (!subcategory) {
      return res.status(404).json({ msg: 'Subcategory not found' });
    }

    if (!subcategory.deleted) {
      return res.status(400).json({ msg: 'Subcategory is not deleted' });
    }

    subcategory.deleted = false;
    subcategory.isActive = true;
    await subcategory.save();
    
    res.json({ msg: 'Subcategory restored successfully' });
  } catch (error) {
    console.error('Error reverting subcategory:', error);
    res.status(500).json({ msg: 'Failed to revert subcategory' });
  }
}; 