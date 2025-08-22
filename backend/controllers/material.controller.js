import Material from '../models/material.model.js';

// Get all materials
export const getMaterials = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = { isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
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
    const { name, description, category, properties } = req.body;
    
    // Check if material with same name already exists
    const existingMaterial = await Material.findOne({ name: name });
    if (existingMaterial) {
      return res.status(400).json({ msg: 'Material name already exists' });
    }

    // Handle image upload if present
    let image = null;
    if (req.file) {
      image = req.file.path; // You might want to upload to cloud storage instead
    }

    const material = new Material({
      name,
      description,
      image,
      category,
      properties: properties ? JSON.parse(properties) : []
    });

    const savedMaterial = await material.save();
    res.status(201).json(savedMaterial);
  } catch (error) {
    console.error('Error creating material:', error);
    res.status(500).json({ msg: 'Failed to create material' });
  }
};

// Update material
export const updateMaterial = async (req, res) => {
  try {
    const { name, description, category, properties } = req.body;
    
    // Check if material exists
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ msg: 'Material not found' });
    }

    // Check for duplicate names (excluding current material)
    if (name && name !== material.name) {
      const existingMaterial = await Material.findOne({ name: name });
      if (existingMaterial) {
        return res.status(400).json({ msg: 'Material name already exists' });
      }
    }

    // Handle image upload if present
    if (req.file) {
      material.image = req.file.path;
    }

    // Update fields
    material.name = name || material.name;
    material.description = description !== undefined ? description : material.description;
    material.category = category || material.category;
    material.properties = properties ? JSON.parse(properties) : material.properties;

    const updatedMaterial = await material.save();
    res.json(updatedMaterial);
  } catch (error) {
    console.error('Error updating material:', error);
    res.status(500).json({ msg: 'Failed to update material' });
  }
};

// Delete material (soft delete)
export const deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ msg: 'Material not found' });
    }

    material.isActive = false;
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