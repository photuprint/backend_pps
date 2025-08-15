import React, { useEffect, useState } from "react";

const SubCategoryManager = () => {
  const [subCatName, setSubCatName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [subCatImage, setSubCatImage] = useState(null);
  const [isActive, setIsActive] = useState(true);
  const [editingIndex, setEditingIndex] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";

  // Fetch active categories for dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/categories`);
        const data = await res.json();
        setCategories(data.filter(cat => cat.active)); // Only active categories
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, [API_BASE_URL]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setSubCatImage(file);
  };

  // Add or Update Subcategory
  const handleAddOrUpdate = () => {
    if (!subCatName.trim() || !categoryId) {
      alert("Subcategory name and category are required");
      return;
    }

    // Unique check: no duplicate name in same category
    const duplicate = subCategories.some(
      (sub, idx) =>
        sub.name.toLowerCase() === subCatName.trim().toLowerCase() &&
        sub.categoryId === categoryId &&
        idx !== editingIndex
    );
    if (duplicate) {
      alert("Subcategory name already exists in this category");
      return;
    }

    if (editingIndex !== null) {
      const updated = [...subCategories];
      updated[editingIndex] = {
        ...updated[editingIndex],
        name: subCatName.trim(),
        categoryId,
        image: subCatImage || updated[editingIndex].image,
        active: isActive,
      };
      setSubCategories(updated);
      setEditingIndex(null);
    } else {
      setSubCategories([
        ...subCategories,
        {
          id: `subcat-${Date.now()}`,
          name: subCatName.trim(),
          categoryId,
          image: subCatImage || null,
          active: isActive,
        },
      ]);
    }

    // Reset
    setSubCatName("");
    setCategoryId("");
    setSubCatImage(null);
    setIsActive(true);
    document.getElementById("subCatImage").value = "";
  };

  const handleEdit = (index) => {
    const sub = subCategories[index];
    setSubCatName(sub.name);
    setCategoryId(sub.categoryId);
    setSubCatImage(sub.image);
    setIsActive(sub.active);
    setEditingIndex(index);
  };

  const handleDelete = (index) => {
    setSubCategories(subCategories.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setSubCatName("");
      setCategoryId("");
      setSubCatImage(null);
      setIsActive(true);
      setEditingIndex(null);
    }
  };

  const handleSaveToBackend = async () => {
    try {
      const formData = new FormData();
      subCategories.forEach((sub, i) => {
        formData.append(`subCategories[${i}][id]`, sub.id);
        formData.append(`subCategories[${i}][name]`, sub.name);
        formData.append(`subCategories[${i}][categoryId]`, sub.categoryId);
        formData.append(`subCategories[${i}][active]`, sub.active);
        if (sub.image instanceof File) {
          formData.append(`subCategories[${i}][image]`, sub.image);
        }
      });

      const res = await fetch(`${API_BASE_URL}/api/subcategories`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to save subcategories");
      alert("Subcategories saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Error saving subcategories");
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-md max-w-2xl bg-white">
      <h2 className="text-lg font-bold mb-4">Manage Subcategories</h2>

      {/* Form */}
      <div className="flex flex-col gap-2 mb-4">
        <input
          type="text"
          placeholder="Subcategory Name"
          value={subCatName}
          onChange={(e) => setSubCatName(e.target.value)}
          className="border p-2 rounded"
        />

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Select Category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <input
          id="subCatImage"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="border p-2 rounded"
        />

        {subCatImage && (
          <img
            src={subCatImage instanceof File ? URL.createObjectURL(subCatImage) : subCatImage}
            alt="Preview"
            className="w-24 h-24 object-cover border rounded"
          />
        )}

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Active
        </label>

        <button
          onClick={handleAddOrUpdate}
          className={`${
            editingIndex !== null ? "bg-yellow-500 hover:bg-yellow-600" : "bg-blue-500 hover:bg-blue-600"
          } text-white px-4 py-2 rounded`}
        >
          {editingIndex !== null ? "Update" : "Add"}
        </button>
      </div>

      {/* Table */}
      {subCategories.length > 0 && (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Category</th>
              <th className="p-2 border">Image</th>
              <th className="p-2 border">Active</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subCategories.map((sub, index) => (
              <tr key={sub.id} className="text-center">
                <td className="p-2 border">{sub.id}</td>
                <td className="p-2 border">{sub.name}</td>
                <td className="p-2 border">
                  {categories.find(cat => cat.id === sub.categoryId)?.name || "N/A"}
                </td>
                <td className="p-2 border">
                  {sub.image ? (
                    <img
                      src={sub.image instanceof File ? URL.createObjectURL(sub.image) : sub.image}
                      alt={sub.name}
                      className="w-12 h-12 object-cover mx-auto"
                    />
                  ) : (
                    <span className="text-gray-400 italic">No image</span>
                  )}
                </td>
                <td className="p-2 border">{sub.active ? "Yes" : "No"}</td>
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

      {subCategories.length > 0 && (
        <button
          onClick={handleSaveToBackend}
          className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Save Subcategories
        </button>
      )}
    </div>
  );
};

export default SubCategoryManager;
