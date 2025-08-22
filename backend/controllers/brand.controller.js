import Brand from '../models/brand.model.js';

// Get all brands
export const getBrands = async (req, res) => {
  try {
    const brands = await Brand.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ msg: 'Failed to fetch brands' });
  }
};

// Get single brand by ID
export const getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ msg: 'Brand not found' });
    }
    res.json(brand);
  } catch (error) {
    console.error('Error fetching brand:', error);
    res.status(500).json({ msg: 'Failed to fetch brand' });
  }
};

// Create new brand
export const createBrand = async (req, res) => {
  try {
    const { name, gstNo, companyName, address } = req.body;
    
    // Check if brand with same name already exists
    const existingBrand = await Brand.findOne({ name: name });
    
    if (existingBrand) {
      return res.status(400).json({ 
        msg: 'Brand name already exists'
      });
    }

    // Auto-generate Brand ID with format PPSBDNM1001, PPSBDNM1002, etc.
    let brandId;
    let counter = 1001;
    
    do {
      brandId = `PPSBDNM${counter}`;
      const existingBrandId = await Brand.findOne({ brandId: brandId });
      if (!existingBrandId) {
        break;
      }
      counter++;
    } while (true);

    // Handle logo upload if present
    let logo = null;
    if (req.file) {
      logo = req.file.path; // You might want to upload to cloud storage instead
    }

    const brand = new Brand({
      brandId,
      name,
      logo,
      gstNo,
      companyName,
      address
    });

    const savedBrand = await brand.save();
    res.status(201).json(savedBrand);
  } catch (error) {
    console.error('Error creating brand:', error);
    res.status(500).json({ msg: 'Failed to create brand' });
  }
};

// Update brand
export const updateBrand = async (req, res) => {
  try {
    const { name, gstNo, companyName, address } = req.body;
    
    // Check if brand exists
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ msg: 'Brand not found' });
    }

    // Check for duplicate names (excluding current brand)
    const existingBrand = await Brand.findOne({
      $and: [
        { _id: { $ne: req.params.id } },
        { name: name }
      ]
    });
    
    if (existingBrand) {
      return res.status(400).json({ 
        msg: 'Brand name already exists'
      });
    }

    // Handle logo upload if present
    if (req.file) {
      brand.logo = req.file.path;
    }

    // Update fields (brandId cannot be changed as it's auto-generated)
    brand.name = name || brand.name;
    brand.gstNo = gstNo || brand.gstNo;
    brand.companyName = companyName || brand.companyName;
    brand.address = address || brand.address;

    const updatedBrand = await brand.save();
    res.json(updatedBrand);
  } catch (error) {
    console.error('Error updating brand:', error);
    res.status(500).json({ msg: 'Failed to update brand' });
  }
};

// Delete brand (soft delete)
export const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ msg: 'Brand not found' });
    }

    brand.isActive = false;
    await brand.save();
    
    res.json({ msg: 'Brand deleted successfully' });
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({ msg: 'Failed to delete brand' });
  }
};

// Hard delete brand
export const hardDeleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);
    if (!brand) {
      return res.status(404).json({ msg: 'Brand not found' });
    }
    
    res.json({ msg: 'Brand permanently deleted' });
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({ msg: 'Failed to delete brand' });
  }
}; 