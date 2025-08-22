import Size from '../models/size.model.js';

// Get all sizes
export const getSizes = async (req, res) => {
  try {
    const { search, isActive } = req.query;
    let query = {};
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    const sizes = await Size.find(query).sort({ createdAt: -1 });
    res.json(sizes);
  } catch (error) {
    console.error('Error fetching sizes:', error);
    res.status(500).json({ msg: 'Failed to fetch sizes' });
  }
};

// Get single size by ID
export const getSizeById = async (req, res) => {
  try {
    const size = await Size.findById(req.params.id);
    if (!size) {
      return res.status(404).json({ msg: 'Size not found' });
    }
    res.json(size);
  } catch (error) {
    console.error('Error fetching size:', error);
    res.status(500).json({ msg: 'Failed to fetch size' });
  }
};

// Create new size
export const createSize = async (req, res) => {
  try {
    const { name, dimensions } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ msg: 'Size name is required' });
    }

    // Check if size with same name already exists
    const existingSize = await Size.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    
    if (existingSize) {
      return res.status(400).json({ msg: 'Size name already exists' });
    }

    const size = new Size({
      name: name.trim(),
      dimensions: dimensions?.trim() || null
    });

    const savedSize = await size.save();
    res.status(201).json(savedSize);
  } catch (error) {
    console.error('Error creating size:', error);
    res.status(500).json({ msg: 'Failed to create size' });
  }
};

// Update size
export const updateSize = async (req, res) => {
  try {
    const { name, dimensions } = req.body;
    
    // Check if size exists
    const size = await Size.findById(req.params.id);
    if (!size) {
      return res.status(404).json({ msg: 'Size not found' });
    }

    // Check for duplicate names (excluding current size)
    if (name && name.trim() !== size.name) {
      const existingSize = await Size.findOne({ 
        $and: [
          { _id: { $ne: req.params.id } },
          { name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } }
        ]
      });
      
      if (existingSize) {
        return res.status(400).json({ msg: 'Size name already exists' });
      }
    }

    // Update fields
    if (name && name.trim() !== size.name) {
      size.name = name.trim();
    }
    
    if (dimensions !== undefined) {
      size.dimensions = dimensions?.trim() || null;
    }

    const updatedSize = await size.save();
    res.json(updatedSize);
  } catch (error) {
    console.error('Error updating size:', error);
    res.status(500).json({ msg: 'Failed to update size' });
  }
};

// Delete size (soft delete)
export const deleteSize = async (req, res) => {
  try {
    const size = await Size.findById(req.params.id);
    if (!size) {
      return res.status(404).json({ msg: 'Size not found' });
    }

    size.isActive = false;
    await size.save();
    
    res.json({ msg: 'Size deleted successfully' });
  } catch (error) {
    console.error('Error deleting size:', error);
    res.status(500).json({ msg: 'Failed to delete size' });
  }
};

// Hard delete size
export const hardDeleteSize = async (req, res) => {
  try {
    const size = await Size.findByIdAndDelete(req.params.id);
    if (!size) {
      return res.status(404).json({ msg: 'Size not found' });
    }
    
    res.json({ msg: 'Size permanently deleted' });
  } catch (error) {
    console.error('Error deleting size:', error);
    res.status(500).json({ msg: 'Failed to delete size' });
  }
};
