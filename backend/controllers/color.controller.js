import Color from '../models/color.model.js';

// Get all colors
export const getColors = async (req, res) => {
  try {
    const { search, isActive } = req.query;
    let query = {};
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    const colors = await Color.find(query).sort({ createdAt: -1 });
    res.json(colors);
  } catch (error) {
    console.error('Error fetching colors:', error);
    res.status(500).json({ msg: 'Failed to fetch colors' });
  }
};

// Get single color by ID
export const getColorById = async (req, res) => {
  try {
    const color = await Color.findById(req.params.id);
    if (!color) {
      return res.status(404).json({ msg: 'Color not found' });
    }
    res.json(color);
  } catch (error) {
    console.error('Error fetching color:', error);
    res.status(500).json({ msg: 'Failed to fetch color' });
  }
};

// Create new color
export const createColor = async (req, res) => {
  try {
    const { name, hexCode } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ msg: 'Color name is required' });
    }

    // Check if color with same name already exists
    const existingColor = await Color.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    
    if (existingColor) {
      return res.status(400).json({ msg: 'Color name already exists' });
    }

    // Handle image upload if present
    let image = null;
    if (req.file) {
      image = req.file.path; // You might want to upload to cloud storage instead
    }

    const color = new Color({
      name: name.trim(),
      hexCode: hexCode?.trim() || null,
      image
    });

    const savedColor = await color.save();
    res.status(201).json(savedColor);
  } catch (error) {
    console.error('Error creating color:', error);
    res.status(500).json({ msg: 'Failed to create color' });
  }
};

// Update color
export const updateColor = async (req, res) => {
  try {
    const { name, hexCode } = req.body;
    
    // Check if color exists
    const color = await Color.findById(req.params.id);
    if (!color) {
      return res.status(404).json({ msg: 'Color not found' });
    }

    // Check for duplicate names (excluding current color)
    if (name && name.trim() !== color.name) {
      const existingColor = await Color.findOne({ 
        $and: [
          { _id: { $ne: req.params.id } },
          { name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } }
        ]
      });
      
      if (existingColor) {
        return res.status(400).json({ msg: 'Color name already exists' });
      }
    }

    // Handle image upload if present
    if (req.file) {
      color.image = req.file.path;
    }

    // Update fields
    if (name && name.trim() !== color.name) {
      color.name = name.trim();
    }
    
    if (hexCode !== undefined) {
      color.hexCode = hexCode?.trim() || null;
    }

    const updatedColor = await color.save();
    res.json(updatedColor);
  } catch (error) {
    console.error('Error updating color:', error);
    res.status(500).json({ msg: 'Failed to update color' });
  }
};

// Delete color (soft delete)
export const deleteColor = async (req, res) => {
  try {
    const color = await Color.findById(req.params.id);
    if (!color) {
      return res.status(404).json({ msg: 'Color not found' });
    }

    color.isActive = false;
    await color.save();
    
    res.json({ msg: 'Color deleted successfully' });
  } catch (error) {
    console.error('Error deleting color:', error);
    res.status(500).json({ msg: 'Failed to delete color' });
  }
};

// Hard delete color
export const hardDeleteColor = async (req, res) => {
  try {
    const color = await Color.findByIdAndDelete(req.params.id);
    if (!color) {
      return res.status(404).json({ msg: 'Color not found' });
    }
    
    res.json({ msg: 'Color permanently deleted' });
  } catch (error) {
    console.error('Error deleting color:', error);
    res.status(500).json({ msg: 'Failed to delete color' });
  }
};
