import Size from '../models/size.model.js';

// Get all sizes
export const getSizes = async (req, res) => {
  try {
    const { search, isActive, includeDeleted = 'true' } = req.query;
    let query = {};
    
    // Always include deleted sizes by default, but allow filtering
    if (includeDeleted === 'false') {
      query.deleted = false;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { initial: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
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
    const { name, initial, dimensions, description } = req.body;
    let { isActive = true } = req.body;
    
    console.log('Create size request body:', { name, initial, dimensions, description, isActive });
    
    // Convert string "true"/"false" to boolean (for FormData)
    if (typeof isActive === 'string') {
      isActive = isActive === 'true';
    }
    
    if (!name || !name.trim()) {
      return res.status(400).json({ msg: 'Size name is required' });
    }

    // Check for duplicate names (case-insensitive)
    const existingSize = await Size.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      deleted: false
    });
    
    if (existingSize) {
      return res.status(400).json({ msg: 'Size name already exists' });
    }

    // Handle image upload
    let imageUrl = null;
    if (req.file) {
      try {
        // Upload to Cloudinary
        const cloudinary = (await import('../utils/cloudinary.js')).default;
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'photuprint/sizes',
        });
        imageUrl = result.secure_url;
        console.log('Image uploaded to Cloudinary:', imageUrl);
      } catch (uploadError) {
        console.error('Cloudinary upload failed:', uploadError);
        // Fallback to local storage
        imageUrl = `/uploads/${req.file.filename}`;
      }
    }

    const sizeData = {
      name: name.trim(),
      initial: (initial && initial.trim()) ? initial.trim() : null,
      dimensions: (dimensions && dimensions.trim()) ? dimensions.trim() : null,
      description: (description && description.trim()) ? description.trim() : null,
      image: imageUrl,
      isActive
    };
    
    console.log('Creating size with data:', sizeData);

    const size = new Size(sizeData);
    const savedSize = await size.save();
    console.log('Size created successfully:', savedSize);
    res.status(201).json(savedSize);
  } catch (error) {
    console.error('Error creating size:', error);
    if (error.code === 11000) {
      res.status(400).json({ msg: 'Size name already exists' });
    } else {
      res.status(500).json({ msg: 'Failed to create size' });
    }
  }
};

// Update size
export const updateSize = async (req, res) => {
  try {
    const { name, initial, dimensions, description } = req.body;
    let { isActive, deleted } = req.body;
    
    console.log('Update size request body:', { name, initial, dimensions, description, isActive, deleted });
    
    // Convert string "true"/"false" to boolean (for FormData)
    if (typeof isActive === 'string') {
      isActive = isActive === 'true';
    }
    if (typeof deleted === 'string') {
      deleted = deleted === 'true';
    }
    
    const size = await Size.findById(req.params.id);
    if (!size) {
      return res.status(404).json({ msg: 'Size not found' });
    }
    
    console.log('Current size data:', { name: size.name, initial: size.initial, dimensions: size.dimensions });

    // Check for duplicate names (case-insensitive) if name is being changed
    if (name && name.trim() !== size.name) {
      const existingSize = await Size.findOne({ 
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: req.params.id },
        deleted: false
      });
      
      if (existingSize) {
        return res.status(400).json({ msg: 'Size name already exists' });
      }
    }

    // Update fields - always update if provided
    if (name !== undefined && name !== null) {
      size.name = name.trim();
    }
    
    // Always update initial if it's in the request (including empty strings)
    // FormData sends empty strings as '', JSON might send null or undefined
    // Check if 'initial' key exists in req.body (even if value is empty string)
    if ('initial' in req.body) {
      // Handle both string and other types
      if (typeof initial === 'string') {
        const trimmed = initial.trim();
        size.initial = trimmed ? trimmed : null;
      } else if (initial === null) {
        size.initial = null;
      } else if (initial === undefined) {
        // If explicitly undefined, set to null
        size.initial = null;
      } else {
        // Convert to string if it's not already
        size.initial = String(initial).trim() || null;
      }
      console.log('Updating initial field:', { received: initial, type: typeof initial, setting: size.initial, hasKey: 'initial' in req.body });
    } else {
      console.log('Initial field not in request body, keeping existing value:', size.initial);
    }
    
    if (dimensions !== undefined) {
      size.dimensions = (dimensions && dimensions.trim()) ? dimensions.trim() : null;
    }
    
    if (description !== undefined) {
      size.description = (description && description.trim()) ? description.trim() : null;
    }
    
    if (isActive !== undefined) {
      size.isActive = isActive;
    }

    // Handle deleted field update (for reverting deleted sizes)
    if (req.body.deleted !== undefined) {
      size.deleted = deleted;
    }

    // Handle image upload
    if (req.file) {
      try {
        // Upload to Cloudinary
        const cloudinary = (await import('../utils/cloudinary.js')).default;
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'photuprint/sizes',
        });
        size.image = result.secure_url;
        console.log('Image updated in Cloudinary:', size.image);
      } catch (uploadError) {
        console.error('Cloudinary upload failed:', uploadError);
        // Fallback to local storage
        size.image = `/uploads/${req.file.filename}`;
      }
    }
    
    console.log('Size data before save:', { name: size.name, initial: size.initial, dimensions: size.dimensions });
    const updatedSize = await size.save();
    console.log('Size updated successfully:', updatedSize);
    res.json(updatedSize);
  } catch (error) {
    console.error('Error updating size:', error);
    if (error.code === 11000) {
      res.status(400).json({ msg: 'Size name already exists' });
    } else {
      res.status(500).json({ msg: 'Failed to update size' });
    }
  }
};

// Delete size (soft delete)
export const deleteSize = async (req, res) => {
  try {
    const size = await Size.findById(req.params.id);
    if (!size) {
      return res.status(404).json({ msg: 'Size not found' });
    }

    // Soft delete: mark as inactive and set deleted flag
    size.isActive = false;
    size.deleted = true;
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
