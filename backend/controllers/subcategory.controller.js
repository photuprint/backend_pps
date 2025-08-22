import Subcategory from '../models/subcategory.model.js';

// Get all subcategories
export const getSubCategories = async (req, res) => {
  try {
    const { categoryId, search, isActive } = req.query;
    let query = {};
    
    if (categoryId) {
      query.categoryId = categoryId;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    const subcategories = await Subcategory.find(query)
      .populate('categoryId', 'name')
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
    const subcategory = await Subcategory.findById(req.params.id)
      .populate('categoryId', 'name');
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
    const { name, categoryId, description, isActive = true } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ msg: 'Subcategory name is required' });
    }
    
    if (!categoryId) {
      return res.status(400).json({ msg: 'Category ID is required' });
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

    const subcategory = new Subcategory({
      name: name.trim(),
      slug,
      categoryId,
      description: description?.trim() || null,
      isActive
    });

    const savedSubcategory = await subcategory.save();
    
    // Populate category before sending response
    const populatedSubcategory = await Subcategory.findById(savedSubcategory._id)
      .populate('categoryId', 'name');
    
    res.status(201).json(populatedSubcategory);
  } catch (error) {
    console.error('Error creating subcategory:', error);
    res.status(500).json({ msg: 'Failed to create subcategory' });
  }
};

// Update subcategory
export const updateSubCategory = async (req, res) => {
  try {
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

    // Update fields
    if (name && name.trim() !== subcategory.name) {
      subcategory.name = name.trim();
      subcategory.slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
    }
    
    if (categoryId) {
      subcategory.categoryId = categoryId;
    }
    
    if (description !== undefined) {
      subcategory.description = description?.trim() || null;
    }
    
    if (isActive !== undefined) {
      subcategory.isActive = isActive;
    }

    const updatedSubcategory = await subcategory.save();
    
    // Populate category before sending response
    const populatedSubcategory = await Subcategory.findById(updatedSubcategory._id)
      .populate('categoryId', 'name');
    
    res.json(populatedSubcategory);
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