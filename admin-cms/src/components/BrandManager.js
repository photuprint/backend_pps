import React, { useState, useEffect } from "react";

const BrandManager = () => {
  const [brands, setBrands] = useState([]);
  const [formData, setFormData] = useState({
    brandId: "",
    name: "",
    logo: "",
    gstNo: "",
    companyName: "",
    address: ""
  });
  const [editingIndex, setEditingIndex] = useState(null);

  // Fetch brands from backend
  useEffect(() => {
    fetch("/api/brands")
      .then((res) => res.json())
      .then((data) => setBrands(data))
      .catch((err) => console.error("Error fetching brands:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "logo") {
      setFormData({ ...formData, logo: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleAddOrUpdate = async () => {
    if (!formData.name.trim()) {
      alert("Brand Name is required");
      return;
    }

    const form = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) form.append(key, value);
    });

    try {
      let res;
      if (editingIndex !== null) {
        // Update brand
        res = await fetch(`/api/brands/${brands[editingIndex]._id}`, {
          method: "PUT",
          body: form
        });
      } else {
        // Add brand
        res = await fetch("/api/brands", {
          method: "POST",
          body: form
        });
      }

      if (!res.ok) throw new Error("Failed to save brand");

      const updatedBrand = await res.json();

      if (editingIndex !== null) {
        const updatedList = [...brands];
        updatedList[editingIndex] = updatedBrand;
        setBrands(updatedList);
        setEditingIndex(null);
      } else {
        setBrands([...brands, updatedBrand]);
      }

      setFormData({
        brandId: "",
        name: "",
        logo: "",
        gstNo: "",
        companyName: "",
        address: ""
      });
    } catch (error) {
      console.error(error);
      alert("Error saving brand");
    }
  };

  const handleEdit = (index) => {
    const brand = brands[index];
    setFormData({
      brandId: brand.brandId,
      name: brand.name,
      logo: "",
      gstNo: brand.gstNo,
      companyName: brand.companyName,
      address: brand.address
    });
    setEditingIndex(index);
  };

  const handleDelete = async (index) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this brand?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/brands/${brands[index]._id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete brand");

      setBrands(brands.filter((_, i) => i !== index));
    } catch (error) {
      console.error(error);
      alert("Error deleting brand");
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">
        {editingIndex !== null ? "Edit Brand" : "Add Brand"}
      </h2>

      {/* Brand Form */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <input
          type="text"
          name="brandId"
          placeholder="Brand ID"
          value={formData.brandId}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="name"
          placeholder="Brand Name"
          value={formData.name}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          type="file"
          name="logo"
          accept="image/*"
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="gstNo"
          placeholder="GST Number"
          value={formData.gstNo}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="companyName"
          placeholder="Company Name"
          value={formData.companyName}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <textarea
          name="address"
          placeholder="Company Address"
          value={formData.address}
          onChange={handleChange}
          className="border p-2 rounded col-span-2"
        />
      </div>

      <button
        onClick={handleAddOrUpdate}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        {editingIndex !== null ? "Update Brand" : "Add Brand"}
      </button>

      {/* Brand List */}
      {brands.length > 0 && (
        <table className="w-full border mt-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Logo</th>
              <th className="p-2 border">Brand ID</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">GST No</th>
              <th className="p-2 border">Company Name</th>
              <th className="p-2 border">Address</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {brands.map((brand, index) => (
              <tr key={brand._id} className="text-center">
                <td className="p-2 border">
                  {brand.logo ? (
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="w-10 h-10 object-cover mx-auto"
                    />
                  ) : (
                    "-"
                  )}
                </td>
                <td className="p-2 border">{brand.brandId || "-"}</td>
                <td className="p-2 border">{brand.name}</td>
                <td className="p-2 border">{brand.gstNo || "-"}</td>
                <td className="p-2 border">{brand.companyName || "-"}</td>
                <td className="p-2 border">{brand.address || "-"}</td>
                <td className="p-2 border">
                  <button
                    onClick={() => handleEdit(index)}
                    className="text-blue-500 hover:underline mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(index)}
                    className="text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BrandManager;
