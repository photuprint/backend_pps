import Color from '../models/color.model.js';

// Get all colors
export const getColors = async (req, res) => {
  try {
    const { search, isActive, showDeleted } = req.query;
    let query = {};
    
    // By default, don't show deleted colors unless explicitly requested
    if (showDeleted !== 'true') {
      query.deleted = { $ne: true };
    }
    
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
    const { name, code, isActive } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ msg: 'Color name is required' });
    }

    if (!code || !code.trim()) {
      return res.status(400).json({ msg: 'Color code is required' });
    }

    // Check if color with same name already exists
    const existingColor = await Color.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    
    if (existingColor) {
      return res.status(400).json({ msg: 'Color name already exists' });
    }

    // Handle image upload if present
    let imageUrl = null;
    if (req.file) {
      // For now, use local path. You might want to upload to cloud storage instead
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const color = new Color({
      name: name.trim(),
      code: code.trim(),
      image: imageUrl,
      isActive: isActive === 'true' ? true : (isActive === true ? true : false)
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
    const { name, code, isActive } = req.body;
    
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
      color.image = `/uploads/${req.file.filename}`;
    }

    // Update fields
    if (name && name.trim() !== color.name) {
      color.name = name.trim();
    }
    
    if (code !== undefined) {
      color.code = code.trim();
    }

    if (isActive !== undefined) {
      color.isActive = isActive === 'true' ? true : (isActive === true ? true : false);
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

    // Mark as deleted and inactive
    color.isActive = false;
    color.deleted = true;
    await color.save();
    
    res.json({ msg: 'Color marked as deleted and inactive' });
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
