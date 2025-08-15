import React, { useState } from "react";

const CategoryManager = () => {
  const [categoryName, setCategoryName] = useState("");
  const [categoryImage, setCategoryImage] = useState(null);
  const [isActive, setIsActive] = useState(true);
  const [categories, setCategories] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCategoryImage(file);
    }
  };

  // Validate and Add / Update Category
  const handleAddOrUpdate = () => {
    if (!categoryName.trim()) {
      alert("Category name is required");
      return;
    }

    // Check for unique name (case-insensitive)
    const isDuplicate = categories.some(
      (cat, idx) =>
        cat.name.toLowerCase() === categoryName.trim().toLowerCase() &&
        idx !== editingIndex
    );

    if (isDuplicate) {
      alert("Category name must be unique");
      return;
    }

    if (editingIndex !== null) {
      // Update category
      const updatedCategories = [...categories];
      updatedCategories[editingIndex] = {
        ...updatedCategories[editingIndex],
        name: categoryName.trim(),
        image: categoryImage ? categoryImage : updatedCategories[editingIndex].image,
        active: isActive,
      };
      setCategories(updatedCategories);
      setEditingIndex(null);
    } else {
      // Add new category
      const newCategory = {
        id: `cat-${Date.now()}`, // dynamic id
        name: categoryName.trim(),
        image: categoryImage || null, // optional
        active: isActive,
      };
      setCategories([...categories, newCategory]);
    }

    // Reset form
    setCategoryName("");
    setCategoryImage(null);
    setIsActive(true);
    document.getElementById("categoryImage").value = "";
  };

  // Edit category
  const handleEdit = (index) => {
    setCategoryName(categories[index].name);
    setCategoryImage(categories[index].image);
    setIsActive(categories[index].active);
    setEditingIndex(index);
  };

  // Delete category
  const handleDelete = (index) => {
    setCategories(categories.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setCategoryName("");
      setCategoryImage(null);
      setIsActive(true);
      setEditingIndex(null);
    }
  };

  // Save to backend
  const handleSaveToBackend = async () => {
    try {
      const formData = new FormData();
      categories.forEach((cat, i) => {
        formData.append(`categories[${i}][id]`, cat.id);
        formData.append(`categories[${i}][name]`, cat.name);
        formData.append(`categories[${i}][active]`, cat.active);
        if (cat.image instanceof File) {
          formData.append(`categories[${i}][image]`, cat.image);
        }
      });

      const res = await fetch(`${API_BASE_URL}/api/categories`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to save categories");
      alert("Categories saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Error saving categories");
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-md max-w-2xl bg-white">
      <h2 className="text-lg font-bold mb-4">Manage Categories</h2>

      {/* Form */}
      <div className="flex flex-col gap-2 mb-4">
        <input
          type="text"
          placeholder="Category Name"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          id="categoryImage"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="border p-2 rounded"
        />

        {/* Preview Image */}
        {categoryImage && (
          <img
            src={categoryImage instanceof File ? URL.createObjectURL(categoryImage) : categoryImage}
            alt="Preview"
            className="w-24 h-24 object-cover border rounded"
          />
        )}

        {/* Active Checkbox */}
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

      {/* Table (Show only Active categories) */}
      {categories.filter((cat) => cat.active).length > 0 && (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Image</th>
              <th className="p-2 border">Active</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories
              .filter((cat) => cat.active)
              .map((cat, index) => (
                <tr key={cat.id} className="text-center">
                  <td className="p-2 border">{cat.id}</td>
                  <td className="p-2 border">{cat.name}</td>
                  <td className="p-2 border">
                    {cat.image ? (
                      <img
                        src={cat.image instanceof File ? URL.createObjectURL(cat.image) : cat.image}
                        alt={cat.name}
                        className="w-12 h-12 object-cover mx-auto"
                      />
                    ) : (
                      <span className="text-gray-400 italic">No image</span>
                    )}
                  </td>
                  <td className="p-2 border">{cat.active ? "Yes" : "No"}</td>
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

      {/* Save Button */}
      {categories.length > 0 && (
        <button
          onClick={handleSaveToBackend}
          className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Save Categories
        </button>
      )}
    </div>
  );
};

export default CategoryManager;
