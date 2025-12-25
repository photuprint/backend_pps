import Brand from '../models/brand.model.js';

// Get all brands
export const getBrands = async (req, res) => {
  try {
    const { showInactive, includeDeleted = 'true' } = req.query;
    let query = {};
    
    // Always include deleted brands by default, but allow filtering
    if (includeDeleted === 'false') {
      query.deleted = false;
    }
    
    // If showInactive is not explicitly set to 'true', only show active brands
    if (showInactive !== 'true') {
      query.isActive = true;
    }
    
    const brands = await Brand.find(query).sort({ createdAt: -1 });
    res.json(brands);
  } catch (error) {
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
    res.status(500).json({ msg: 'Failed to fetch brand' });
  }
};

// Create new brand
export const createBrand = async (req, res) => {
  try {
    const { name, gstNo, companyName, address, isActive } = req.body;
    
    // Check if brand with same name already exists
    const existingBrand = await Brand.findOne({ name: name });
    
    if (existingBrand) {
      return res.status(400).json({ 
        msg: 'Brand name already exists'
      });
    }

    // Check if GST number already exists (only if GST is provided)
    if (gstNo && gstNo.trim()) {
      const existingGSTBrand = await Brand.findOne({ gstNo: gstNo.trim() });
      
      if (existingGSTBrand) {
        return res.status(400).json({ 
          msg: 'GST number already exists'
        });
      }
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
      try {
        // Upload to Cloudinary
        const cloudinary = (await import('../utils/cloudinary.js')).default;
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'photuprint/brands',
        });
        logo = result.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload failed:', uploadError);
        // Fallback to local storage
        logo = `/uploads/${req.file.filename}`;
      }
    }

    const brand = new Brand({
      brandId,
      name,
      logo,
      gstNo,
      companyName,
      address,
      isActive: isActive === 'true' || isActive === true
    });

    const savedBrand = await brand.save();
    res.status(201).json(savedBrand);
  } catch (error) {
    res.status(500).json({ msg: 'Failed to create brand' });
  }
};

// Update brand
export const updateBrand = async (req, res) => {
  try {
    const { name, gstNo, companyName, address, isActive } = req.body;
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

    // Check if GST number already exists (only if GST is provided and different from current)
    if (gstNo && gstNo.trim() && gstNo.trim() !== brand.gstNo) {
      const existingGSTBrand = await Brand.findOne({
        $and: [
          { _id: { $ne: req.params.id } },
          { gstNo: gstNo.trim() }
        ]
      });
      
      if (existingGSTBrand) {
        return res.status(400).json({ 
          msg: 'GST number already exists'
        });
      }
    }

    // Handle logo upload if present
    if (req.file) {
      try {
        // Upload to Cloudinary
        const cloudinary = (await import('../utils/cloudinary.js')).default;
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'photuprint/brands',
        });
        brand.logo = result.secure_url;
      } catch (uploadError) {
        // Fallback to local storage
        brand.logo = `/uploads/${req.file.filename}`;
      }
    }

    // Update fields (brandId cannot be changed as it's auto-generated)
    brand.name = name || brand.name;
    brand.gstNo = gstNo || brand.gstNo;
    brand.companyName = companyName || brand.companyName;
    brand.address = address || brand.address;
    
    // Update isActive field if provided
    if (isActive !== undefined) {
      // Handle both boolean and string values from FormData
      if (typeof isActive === 'boolean') {
        brand.isActive = isActive;
      } else if (typeof isActive === 'string') {
        brand.isActive = isActive === 'true';
      }
    }

    // Handle deleted field update (for reverting deleted brands)
    if (req.body.deleted !== undefined) {
      brand.deleted = req.body.deleted;
    }

    const updatedBrand = await brand.save();
    
    res.json(updatedBrand);
  } catch (error) {
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

    // Soft delete: mark as inactive and set deleted flag
    brand.isActive = false;
    brand.deleted = true;
    await brand.save();
    
    res.json({ msg: 'Brand deleted successfully' });
  } catch (error) {
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
    res.status(500).json({ msg: 'Failed to delete brand' });
  }
}; 