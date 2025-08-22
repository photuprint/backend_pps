import React, { useState, useEffect } from "react";
import api from '../api/axios';

const BrandManager = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    logo: null,
    gstNo: "",
    companyName: "",
    address: ""
  });

  // Fetch brands from backend
  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await api.get('/brands');
      setBrands(response.data);
      setError("");
    } catch (err) {
      console.error("Error fetching brands:", err);
      setError("Failed to fetch brands");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "logo") {
      setFormData({ ...formData, logo: files[0] || null });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      logo: null,
      gstNo: "",
      companyName: "",
      address: ""
    });
    setEditingId(null);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError("Brand Name is required");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      // Prepare data for API (excluding logo for now, we'll handle file upload separately)
      const brandData = {
        name: formData.name.trim(),
        gstNo: formData.gstNo.trim() || null,
        companyName: formData.companyName.trim() || null,
        address: formData.address.trim() || null
      };

      console.log('Sending brand data:', brandData);

      let response;
      if (editingId) {
        // Update brand
        response = await api.put(`/brands/${editingId}`, brandData);
        setSuccess("Brand updated successfully!");
      } else {
        // Create brand
        response = await api.post('/brands', brandData);
        setSuccess("Brand created successfully!");
      }

      // Refresh brands list
      await fetchBrands();
      resetForm();
      
    } catch (err) {
      console.error("Error saving brand:", err);
      console.error("Error response:", err.response);
      console.error("Error data:", err.response?.data);
      console.error("Error status:", err.response?.status);
      setError(err.response?.data?.msg || "Failed to save brand");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (brand) => {
    setFormData({
      name: brand.name || "",
      logo: null,
      gstNo: brand.gstNo || "",
      companyName: brand.companyName || "",
      address: brand.address || ""
    });
    setEditingId(brand._id);
    setError("");
    setSuccess("");
  };

  const handleDelete = async (brandId) => {
    if (!window.confirm("Are you sure you want to delete this brand?")) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/brands/${brandId}`);
      setSuccess("Brand deleted successfully!");
      await fetchBrands();
    } catch (err) {
      console.error("Error deleting brand:", err);
      setError(err.response?.data?.msg || "Failed to delete brand");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    resetForm();
  };

  return (
    <div className="paddingAll20">
      {/* Header */}
      <div className="textCenter paddingAll30 appendBottom40 brandHeader">
        <h1 className="font48 fontBold whiteText appendBottom10">
          {editingId ? "Edit Brand" : "Add New Brand"}
        </h1>
        <p className="font18 fontRegular whiteText">
          Manage your brand information and company details
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="successMessage paddingAll16 appendBottom24">
          <span className="successIcon">✓</span>
          {success}
        </div>
      )}
      
      {error && (
        <div className="errorMessage paddingAll16 appendBottom24">
          <span className="errorIcon">✕</span>
          {error}
        </div>
      )}

      {/* Brand Form */}
      <div className="brandFormContainer paddingAll32 appendBottom40">
        <form onSubmit={handleSubmit} className="brandForm">
          <div className="makeFlex row gap10 appendBottom24">
            <div className="fullWidth">
              <label htmlFor="name" className="formLabel appendBottom8">Brand Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Enter Brand Name"
                value={formData.name}
                onChange={handleChange}
                className="formInput"
                required
              />
              <div className="formInfo appendTop4">
                Brand ID will be auto-generated (e.g., PPSBDNM1001, PPSBDNM1002)
              </div>
            </div>
          </div>

          <div className="makeFlex row gap10 appendBottom24">
            <div className="flexOne">
              <label htmlFor="gstNo" className="formLabel appendBottom8">GST Number</label>
              <input
                type="text"
                id="gstNo"
                name="gstNo"
                placeholder="Enter GST Number"
                value={formData.gstNo}
                onChange={handleChange}
                className="formInput"
              />
            </div>
            
            <div className="flexOne">
              <label htmlFor="companyName" className="formLabel appendBottom8">Company Name</label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                placeholder="Enter Company Name"
                value={formData.companyName}
                onChange={handleChange}
                className="formInput"
              />
            </div>
          </div>

          <div className="makeFlex row gap10 appendBottom24">
            <div className="fullWidth">
              <label htmlFor="logo" className="formLabel appendBottom8">Brand Logo</label>
              <input
                type="file"
                id="logo"
                name="logo"
                accept="image/*"
                onChange={handleChange}
                className="formFileInput"
              />
              <div className="fileInputInfo appendTop4">
                Supported formats: JPG, PNG, GIF (Max size: 5MB)
              </div>
            </div>
          </div>

          <div className="makeFlex row gap10 appendBottom24">
            <div className="fullWidth">
              <label htmlFor="address" className="formLabel appendBottom8">Company Address</label>
              <textarea
                id="address"
                name="address"
                placeholder="Enter Company Address"
                value={formData.address}
                onChange={handleChange}
                className="formTextarea"
                rows="3"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="formActions paddingTop16">
            <button
              type="submit"
              disabled={loading}
              className="btnPrimary"
            >
              {loading ? (
                <span className="loadingSpinner">⏳</span>
              ) : (
                <span>{editingId ? "Update Brand" : "Create Brand"}</span>
              )}
            </button>
            
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className="btnSecondary"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Brands List */}
      <div className="brandsListContainer paddingAll32">
        <div className="listHeader makeFlex spaceBetween alignCenter appendBottom24">
          <h2 className="listTitle font30 fontBold blackText">Brands ({brands.length})</h2>
          {loading && <div className="loadingIndicator grayText">Loading...</div>}
        </div>

        {brands.length === 0 && !loading ? (
          <div className="emptyState textCenter paddingAll60">
            <div className="emptyIcon appendBottom16">🏢</div>
            <h3 className="font22 fontSemiBold grayText appendBottom8">No Brands Found</h3>
            <p className="font16 grayText">Start by adding your first brand above</p>
          </div>
        ) : (
          <div className="brandsGrid">
            {brands.map((brand) => (
              <div key={brand._id} className="brandCard paddingAll24">
                <div className="brandCardHeader makeFlex alignCenter gap10 appendBottom20">
                  <div className="brandLogo">
                    {brand.logo ? (
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="brandLogoImage"
                      />
                    ) : (
                      <div className="brandLogoPlaceholder">
                        {brand.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="brandInfo flexOne">
                    <h3 className="brandName font20 fontBold blackText appendBottom4">{brand.name}</h3>
                    <p className="brandId font14 grayText appendBottom4">ID: {brand.brandId}</p>
                    {brand.companyName && (
                      <p className="companyName font14 darkGrayText">{brand.companyName}</p>
                    )}
                  </div>
                </div>
                
                <div className="brandCardBody appendBottom20">
                  {brand.gstNo && (
                    <div className="brandDetail makeFlex spaceBetween alignCenter paddingTop8 paddingBottom8">
                      <span className="detailLabel font14 fontSemiBold grayText textUppercase">GST:</span>
                      <span className="detailValue font14 darkGrayText">{brand.gstNo}</span>
                    </div>
                  )}
                  {brand.address && (
                    <div className="brandDetail makeFlex spaceBetween alignCenter paddingTop8 paddingBottom8">
                      <span className="detailLabel font14 fontSemiBold grayText textUppercase">Address:</span>
                      <span className="detailValue font14 darkGrayText">{brand.address}</span>
                    </div>
                  )}
                </div>

                <div className="brandCardActions makeFlex gap10">
                  <button
                    onClick={() => handleEdit(brand)}
                    className="btnEdit flexOne"
                    disabled={loading}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(brand._id)}
                    className="btnDelete flexOne"
                    disabled={loading}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandManager;
