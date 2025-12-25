import Material from '../models/material.model.js';

// Get all materials
export const getMaterials = async (req, res) => {
  try {
    const { search, isActive, includeDeleted = 'true', category, type } = req.query;
    let query = {};
    
    // Always include deleted materials by default, but allow filtering
    if (includeDeleted === 'false') {
      query.deleted = false;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (category) {
      query.category = category;
    }
    
    if (type) {
      query.type = type;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const materials = await Material.find(query).sort({ createdAt: -1 });
    res.json(materials);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ msg: 'Failed to fetch materials' });
  }
};

// Get single material by ID
export const getMaterialById = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ msg: 'Material not found' });
    }
    res.json(material);
  } catch (error) {
    console.error('Error fetching material:', error);
    res.status(500).json({ msg: 'Failed to fetch material' });
  }
};

// Create new material
export const createMaterial = async (req, res) => {
  try {
    const { name, type, description, category, properties } = req.body;
    let { isActive = true } = req.body;
    
    // Convert string "true"/"false" to boolean (for FormData)
    if (typeof isActive === 'string') {
      isActive = isActive === 'true';
    }
    
    if (!name || !name.trim()) {
      return res.status(400).json({ msg: 'Material name is required' });
    }

    if (!type || !type.trim()) {
      return res.status(400).json({ msg: 'Material type is required' });
    }

    // Check for duplicate names (case-insensitive)
    const existingMaterial = await Material.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      deleted: false
    });
    
    if (existingMaterial) {
      return res.status(400).json({ msg: 'Material name already exists' });
    }

    // Handle image upload
    let imageUrl = null;
    if (req.file) {
      try {
        // Upload to Cloudinary
        const cloudinary = (await import('../utils/cloudinary.js')).default;
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'photuprint/materials',
        });
        imageUrl = result.secure_url;
        console.log('Image uploaded to Cloudinary:', imageUrl);
      } catch (uploadError) {
        console.error('Cloudinary upload failed:', uploadError);
        // Fallback to local storage
        imageUrl = `/uploads/${req.file.filename}`;
      }
    }

    const material = new Material({
      name: name.trim(),
      type: type.trim(),
      description: description?.trim() || null,
      image: imageUrl,
      category: category?.trim() || null,
      properties: properties ? (typeof properties === 'string' ? JSON.parse(properties) : properties) : [],
      isActive
    });

    const savedMaterial = await material.save();
    res.status(201).json(savedMaterial);
  } catch (error) {
    console.error('Error creating material:', error);
    if (error.code === 11000) {
      res.status(400).json({ msg: 'Material name already exists' });
    } else {
      res.status(500).json({ msg: 'Failed to create material' });
    }
  }
};

// Update material
export const updateMaterial = async (req, res) => {
  try {
    const { name, type, description, category, properties } = req.body;
    let { isActive, deleted } = req.body;
    
    // Convert string "true"/"false" to boolean (for FormData)
    if (typeof isActive === 'string') {
      isActive = isActive === 'true';
    }
    if (typeof deleted === 'string') {
      deleted = deleted === 'true';
    }
    
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ msg: 'Material not found' });
    }

    // Check for duplicate names (case-insensitive) if name is being changed
    if (name && name.trim() !== material.name) {
      const existingMaterial = await Material.findOne({ 
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: req.params.id },
        deleted: false
      });
      
      if (existingMaterial) {
        return res.status(400).json({ msg: 'Material name already exists' });
      }
    }

    // Update fields
    if (name && name.trim() !== material.name) {
      material.name = name.trim();
    }
    
    if (type && type.trim() !== material.type) {
      material.type = type.trim();
    }
    
    if (description !== undefined) {
      material.description = description?.trim() || null;
    }
    
    if (category !== undefined) {
      material.category = category?.trim() || null;
    }
    
    if (properties !== undefined) {
      material.properties = typeof properties === 'string' ? JSON.parse(properties) : properties;
    }
    
    if (isActive !== undefined) {
      material.isActive = isActive;
    }

    // Handle deleted field update (for reverting deleted materials)
    if (req.body.deleted !== undefined) {
      material.deleted = deleted;
    }

    // Handle image upload
    if (req.file) {
      try {
        // Upload to Cloudinary
        const cloudinary = (await import('../utils/cloudinary.js')).default;
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'photuprint/materials',
        });
        material.image = result.secure_url;
        console.log('Image updated in Cloudinary:', material.image);
      } catch (uploadError) {
        console.error('Cloudinary upload failed:', uploadError);
        // Fallback to local storage
        material.image = `/uploads/${req.file.filename}`;
      }
    }

    const updatedMaterial = await material.save();
    res.json(updatedMaterial);
  } catch (error) {
    console.error('Error updating material:', error);
    if (error.code === 11000) {
      res.status(400).json({ msg: 'Material name already exists' });
    } else {
      res.status(500).json({ msg: 'Failed to update material' });
    }
  }
};

// Delete material (soft delete)
export const deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ msg: 'Material not found' });
    }

    // Soft delete: mark as inactive and set deleted flag
    material.isActive = false;
    material.deleted = true;
    await material.save();
    
    res.json({ msg: 'Material deleted successfully' });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({ msg: 'Failed to delete material' });
  }
};

// Hard delete material
export const hardDeleteMaterial = async (req, res) => {
  try {
    const material = await Material.findByIdAndDelete(req.params.id);
    if (!material) {
      return res.status(404).json({ msg: 'Material not found' });
    }
    
    res.json({ msg: 'Material permanently deleted' });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({ msg: 'Failed to delete material' });
  }
}; 