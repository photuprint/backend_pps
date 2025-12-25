import cloudinary from '../utils/cloudinary.js';

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'photuprint',
    });

    res.json({ 
      url: result.secure_url, 
      public_id: result.public_id,
      filename: req.file.filename 
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ msg: err.message || 'Failed to upload image' });
  }
};
