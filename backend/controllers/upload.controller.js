const cloudinary = require('../utils/cloudinary');

exports.uploadImage = async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'photuprint',
    });
    res.json({ url: result.secure_url, public_id: result.public_id });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
