import Length from '../models/length.model.js';

// Get all lengths
export const getLengths = async (req, res) => {
  try {
    const { search, isActive, includeDeleted = 'true' } = req.query;
    let query = {};
    
    // Always include deleted lengths by default, but allow filtering
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
    
    const lengths = await Length.find(query).sort({ createdAt: -1 });
    res.json(lengths);
  } catch (error) {
    console.error('Error fetching lengths:', error);
    res.status(500).json({ msg: 'Failed to fetch lengths' });
  }
};

// Get single length by ID
export const getLengthById = async (req, res) => {
  try {
    const length = await Length.findById(req.params.id);
    if (!length) {
      return res.status(404).json({ msg: 'Length not found' });
    }
    res.json(length);
  } catch (error) {
    console.error('Error fetching length:', error);
    res.status(500).json({ msg: 'Failed to fetch length' });
  }
};

// Create new length
export const createLength = async (req, res) => {
  try {
    const { name, description } = req.body;
    let { isActive = true } = req.body;
    
    // Convert string "true"/"false" to boolean (for FormData)
    if (typeof isActive === 'string') {
      isActive = isActive === 'true';
    }
    
    if (!name || !name.trim()) {
      return res.status(400).json({ msg: 'Length name is required' });
    }

    // Check for duplicate names (case-insensitive)
    const existingLength = await Length.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      deleted: false
    });
    
    if (existingLength) {
      return res.status(400).json({ msg: 'Length name already exists' });
    }

    // Handle image upload
    let imageUrl = null;
    if (req.file) {
      try {
        // Upload to Cloudinary
        const cloudinary = (await import('../utils/cloudinary.js')).default;
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'photuprint/lengths',
        });
        imageUrl = result.secure_url;
        console.log('Image uploaded to Cloudinary:', imageUrl);
      } catch (uploadError) {
        console.error('Cloudinary upload failed:', uploadError);
        // Fallback to local storage
        imageUrl = `/uploads/${req.file.filename}`;
      }
    }

    const length = new Length({
      name: name.trim(),
      description: description?.trim() || null,
      image: imageUrl,
      isActive
    });

    const savedLength = await length.save();
    res.status(201).json(savedLength);
  } catch (error) {
    console.error('Error creating length:', error);
    if (error.code === 11000) {
      res.status(400).json({ msg: 'Length name already exists' });
    } else {
      res.status(500).json({ msg: 'Failed to create length' });
    }
  }
};

// Update length
export const updateLength = async (req, res) => {
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
    
    const length = await Length.findById(req.params.id);
    if (!length) {
      return res.status(404).json({ msg: 'Length not found' });
    }

    // Check for duplicate names (case-insensitive) if name is being changed
    if (name && name.trim() !== length.name) {
      const existingLength = await Length.findOne({ 
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: req.params.id },
        deleted: false
      });
      
      if (existingLength) {
        return res.status(400).json({ msg: 'Length name already exists' });
      }
    }

    // Update fields
    if (name && name.trim() !== length.name) {
      length.name = name.trim();
    }
    
    if (description !== undefined) {
      length.description = description?.trim() || null;
    }
    
    if (isActive !== undefined) {
      length.isActive = isActive;
    }

    // Handle deleted field update (for reverting deleted lengths)
    if (req.body.deleted !== undefined) {
      length.deleted = deleted;
    }

    // Handle image upload
    if (req.file) {
      try {
        // Upload to Cloudinary
        const cloudinary = (await import('../utils/cloudinary.js')).default;
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'photuprint/lengths',
        });
        length.image = result.secure_url;
        console.log('Image updated in Cloudinary:', length.image);
      } catch (uploadError) {
        console.error('Cloudinary upload failed:', uploadError);
        // Fallback to local storage
        length.image = `/uploads/${req.file.filename}`;
      }
    }

    const updatedLength = await length.save();
    res.json(updatedLength);
  } catch (error) {
    console.error('Error updating length:', error);
    if (error.code === 11000) {
      res.status(400).json({ msg: 'Length name already exists' });
    } else {
      res.status(500).json({ msg: 'Failed to update length' });
    }
  }
};

// Delete length (soft delete)
export const deleteLength = async (req, res) => {
  try {
    const length = await Length.findById(req.params.id);
    if (!length) {
      return res.status(404).json({ msg: 'Length not found' });
    }

    // Soft delete: mark as inactive and set deleted flag
    length.isActive = false;
    length.deleted = true;
    await length.save();
    
    res.json({ msg: 'Length deleted successfully' });
  } catch (error) {
    console.error('Error deleting length:', error);
    res.status(500).json({ msg: 'Failed to delete length' });
  }
};

// Hard delete length
export const hardDeleteLength = async (req, res) => {
  try {
    const length = await Length.findByIdAndDelete(req.params.id);
    if (!length) {
      return res.status(404).json({ msg: 'Length not found' });
    }
    
    res.json({ msg: 'Length permanently deleted' });
  } catch (error) {
    console.error('Error deleting length:', error);
    res.status(500).json({ msg: 'Failed to delete length' });
  }
};

