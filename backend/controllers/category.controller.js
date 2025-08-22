import Category from '../models/category.model.js';

// Get all categories
export const getCategories = async (req, res) => {
  try {
    const { search, isActive } = req.query;
    let query = {};
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    const categories = await Category.find(query).sort({ createdAt: -1 });
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
    const { name, description, isActive = true } = req.body;
    
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

    // Generate slug from name
    const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');

    const category = new Category({
      name: name.trim(),
      slug,
      description: description?.trim() || null,
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
    const { name, description, isActive } = req.body;
    
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

    category.isActive = false;
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
