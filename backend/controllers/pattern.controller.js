import Pattern from '../models/pattern.model.js';

// Get all patterns
export const getPatterns = async (req, res) => {
  try {
    const { search, isActive, includeDeleted = 'true' } = req.query;
    let query = {};
    
    // Always include deleted patterns by default, but allow filtering
    if (includeDeleted === 'false') {
      query.deleted = false;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const patterns = await Pattern.find(query).sort({ createdAt: -1 });
    res.json(patterns);
  } catch (error) {
    console.error('Error fetching patterns:', error);
    res.status(500).json({ msg: 'Failed to fetch patterns' });
  }
};

// Get single pattern by ID
export const getPatternById = async (req, res) => {
  try {
    const pattern = await Pattern.findById(req.params.id);
    if (!pattern) {
      return res.status(404).json({ msg: 'Pattern not found' });
    }
    res.json(pattern);
  } catch (error) {
    console.error('Error fetching pattern:', error);
    res.status(500).json({ msg: 'Failed to fetch pattern' });
  }
};

// Create new pattern
export const createPattern = async (req, res) => {
  try {
    const { name, description } = req.body;
    let { isActive = true } = req.body;
    
    // Convert string "true"/"false" to boolean (for FormData)
    if (typeof isActive === 'string') {
      isActive = isActive === 'true';
    }
    
    if (!name || !name.trim()) {
      return res.status(400).json({ msg: 'Pattern name is required' });
    }

    // Check for duplicate names (case-insensitive)
    const existingPattern = await Pattern.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      deleted: false
    });
    
    if (existingPattern) {
      return res.status(400).json({ msg: 'Pattern name already exists' });
    }

    // Handle image upload
    let imageUrl = null;
    if (req.file) {
      try {
        // Upload to Cloudinary
        const cloudinary = (await import('../utils/cloudinary.js')).default;
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'photuprint/patterns',
        });
        imageUrl = result.secure_url;
        console.log('Image uploaded to Cloudinary:', imageUrl);
      } catch (uploadError) {
        console.error('Cloudinary upload failed:', uploadError);
        // Fallback to local storage
        imageUrl = `/uploads/${req.file.filename}`;
      }
    }

    const pattern = new Pattern({
      name: name.trim(),
      description: description?.trim() || null,
      image: imageUrl,
      isActive
    });

    const savedPattern = await pattern.save();
    res.status(201).json(savedPattern);
  } catch (error) {
    console.error('Error creating pattern:', error);
    if (error.code === 11000) {
      res.status(400).json({ msg: 'Pattern name already exists' });
    } else {
      res.status(500).json({ msg: 'Failed to create pattern' });
    }
  }
};

// Update pattern
export const updatePattern = async (req, res) => {
  try {
    const { name, description } = req.body;
    let { isActive, deleted } = req.body;
    
    // Convert string "true"/"false" to boolean (for FormData)
    if (typeof isActive === 'string') {
      isActive = isActive === 'true';
    }
    if (typeof deleted === 'string') {
      deleted = deleted === 'true';
    }
    
    const pattern = await Pattern.findById(req.params.id);
    if (!pattern) {
      return res.status(404).json({ msg: 'Pattern not found' });
    }

    // Check for duplicate names (case-insensitive) if name is being changed
    if (name && name.trim() !== pattern.name) {
      const existingPattern = await Pattern.findOne({ 
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: req.params.id },
        deleted: false
      });
      
      if (existingPattern) {
        return res.status(400).json({ msg: 'Pattern name already exists' });
      }
    }

    // Update fields
    if (name && name.trim() !== pattern.name) {
      pattern.name = name.trim();
    }
    
    if (description !== undefined) {
      pattern.description = description?.trim() || null;
    }
    
    if (isActive !== undefined) {
      pattern.isActive = isActive;
    }

    // Handle deleted field update (for reverting deleted patterns)
    if (req.body.deleted !== undefined) {
      pattern.deleted = deleted;
    }

    // Handle image upload
    if (req.file) {
      try {
        // Upload to Cloudinary
        const cloudinary = (await import('../utils/cloudinary.js')).default;
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'photuprint/patterns',
        });
        pattern.image = result.secure_url;
        console.log('Image updated in Cloudinary:', pattern.image);
      } catch (uploadError) {
        console.error('Cloudinary upload failed:', uploadError);
        // Fallback to local storage
        pattern.image = `/uploads/${req.file.filename}`;
      }
    }

    const updatedPattern = await pattern.save();
    res.json(updatedPattern);
  } catch (error) {
    console.error('Error updating pattern:', error);
    if (error.code === 11000) {
      res.status(400).json({ msg: 'Pattern name already exists' });
    } else {
      res.status(500).json({ msg: 'Failed to update pattern' });
    }
  }
};

// Delete pattern (soft delete)
export const deletePattern = async (req, res) => {
  try {
    const pattern = await Pattern.findById(req.params.id);
    if (!pattern) {
      return res.status(404).json({ msg: 'Pattern not found' });
    }

    // Soft delete: mark as inactive and set deleted flag
    pattern.isActive = false;
    pattern.deleted = true;
    await pattern.save();
    
    res.json({ msg: 'Pattern deleted successfully' });
  } catch (error) {
    console.error('Error deleting pattern:', error);
    res.status(500).json({ msg: 'Failed to delete pattern' });
  }
};

// Hard delete pattern
export const hardDeletePattern = async (req, res) => {
  try {
    const pattern = await Pattern.findByIdAndDelete(req.params.id);
    if (!pattern) {
      return res.status(404).json({ msg: 'Pattern not found' });
    }
    
    res.json({ msg: 'Pattern permanently deleted' });
  } catch (error) {
    console.error('Error deleting pattern:', error);
    res.status(500).json({ msg: 'Failed to delete pattern' });
  }
};

