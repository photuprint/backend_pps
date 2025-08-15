import React, { useEffect, useMemo, useState } from "react";

/**
 * MaterialManager
 * Fields: type, name, description, image (optional)
 * Endpoints expected (adjust if yours differ):
 *  GET    /api/materials
 *  POST   /api/materials           (multipart/form-data)
 *  PUT    /api/materials/:id       (multipart/form-data)
 *  DELETE /api/materials/:id
 *
 * Backend hints:
 * - Use multer (or similar) to handle "image" file field.
 * - When updating without a new file, keep existing imageUrl.
 * - Return objects like: { _id, type, name, description, imageUrl }
 */

const DEFAULT_TYPES = ["Paper", "Canvas", "Metal", "Wood", "Fabric", "Acrylic"];

const MaterialManager = () => {
  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";

  // Data
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [materialId, setMaterialId] = useState(null); // null => create, else edit
  const [type, setType] = useState("");
  const [customTypeMode, setCustomTypeMode] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [errors, setErrors] = useState({});

  // Filters/search (optional nicety)
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return materials;
    return materials.filter(
      (m) =>
        m.name?.toLowerCase().includes(query) ||
        m.type?.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query)
    );
  }, [q, materials]);

  // Load all
  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/materials`);
      const data = await res.json();
      setMaterials(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load materials", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE_URL]);

  // Image preview
  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  // Validation
  const validate = () => {
    const errs = {};
    if (!type.trim()) errs.type = "Type is required";
    if (!name.trim()) errs.name = "Name is required";
    if (name.length > 100) errs.name = "Name is too long";
    if (description.length > 1000) errs.description = "Description is too long";

    // Unique name check (client-side, backend should also enforce)
    const clash = materials.find(
      (m) => m.name?.toLowerCase() === name.trim().toLowerCase()
    );
    if (clash && clash._id !== materialId) {
      errs.name = "Name must be unique";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Reset form
  const resetForm = () => {
    setMaterialId(null);
    setType("");
    setCustomTypeMode(false);
    setName("");
    setDescription("");
    setImageFile(null);
    setImagePreview("");
    setErrors({});
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const fd = new FormData();
    fd.append("type", type.trim());
    fd.append("name", name.trim());
    fd.append("description", description.trim());
    if (imageFile) fd.append("image", imageFile); // optional

    try {
      const endpoint = materialId
        ? `${API_BASE_URL}/api/materials/${materialId}`
        : `${API_BASE_URL}/api/materials`;
      const method = materialId ? "PUT" : "POST";
      const res = await fetch(endpoint, { method, body: fd });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to save material");
      }

      await fetchMaterials();
      resetForm();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error saving material");
    }
  };

  // Edit
  const handleEdit = (m) => {
    setMaterialId(m._id);
    setType(m.type || "");
    setCustomTypeMode(
      m.type ? !DEFAULT_TYPES.map((t) => t.toLowerCase()).includes(m.type.toLowerCase()) : false
    );
    setName(m.name || "");
    setDescription(m.description || "");
    setImageFile(null);
    setImagePreview(m.imageUrl || "");
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this material?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/materials/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setMaterials((prev) => prev.filter((m) => m._id !== id));
    } catch (e) {
      console.error(e);
      alert("Error deleting material");
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow max-w-5xl mx-auto">
      <h2 className="text-xl font-bold mb-4">
        {materialId ? "Edit Material" : "Material Manager"}
      </h2>

      {/* Form */}
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        {/* Type */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium">Type</label>
          {!customTypeMode ? (
            <div className="flex gap-2">
              <select
                className="border rounded px-3 py-2 flex-1"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="">Select type</option>
                {DEFAULT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="border rounded px-3 py-2"
                onClick={() => {
                  setCustomTypeMode(true);
                  setType("");
                }}
              >
                Custom
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter custom type"
                className="border rounded px-3 py-2 flex-1"
                value={type}
                onChange={(e) => setType(e.target.value)}
              />
              <button
                type="button"
                className="border rounded px-3 py-2"
                onClick={() => {
                  setCustomTypeMode(false);
                  setType("");
                }}
              >
                Use list
              </button>
            </div>
          )}
          {errors.type && (
            <span className="text-sm text-red-600 mt-1">{errors.type}</span>
          )}
        </div>

        {/* Name */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium">Name</label>
          <input
            type="text"
            placeholder="e.g., Premium Glossy Paper"
            className="border rounded px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {errors.name && (
            <span className="text-sm text-red-600 mt-1">{errors.name}</span>
          )}
        </div>

        {/* Description */}
        <div className="flex flex-col md:col-span-2">
          <label className="mb-1 font-medium">Description</label>
          <textarea
            rows={3}
            placeholder="Short description..."
            className="border rounded px-3 py-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {errors.description && (
            <span className="text-sm text-red-600 mt-1">
              {errors.description}
            </span>
          )}
        </div>

        {/* Image (optional) */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium">Image (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />
          {(imagePreview || imageFile) && (
            <div className="mt-2">
              <img
                src={imageFile ? imagePreview : imagePreview}
                alt="preview"
                className="w-28 h-28 object-cover rounded border"
              />
              {materialId && !imageFile && imagePreview && (
                <p className="text-xs text-gray-500 mt-1">
                  Using existing image
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="md:col-span-2 flex gap-2">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            {materialId ? "Update Material" : "Add Material"}
          </button>
          {materialId && (
            <button
              type="button"
              onClick={resetForm}
              className="border px-4 py-2 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Divider */}
      <hr className="my-6" />

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">
          {loading ? "Loading materials..." : `Materials (${materials.length})`}
        </h3>
        <input
          className="border rounded px-3 py-2"
          placeholder="Search materials..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-auto border rounded">
        <table className="min-w-full text-left">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2 border">Image</th>
              <th className="p-2 border">Type</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Description</th>
              <th className="p-2 border w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan="5" className="p-4 text-center text-gray-500">
                  No materials found
                </td>
              </tr>
            )}
            {filtered.map((m) => (
              <tr key={m._id}>
                <td className="p-2 border">
                  {m.imageUrl ? (
                    <img
                      src={m.imageUrl}
                      alt={m.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">No image</span>
                  )}
                </td>
                <td className="p-2 border">{m.type}</td>
                <td className="p-2 border font-medium">{m.name}</td>
                <td className="p-2 border">
                  <span className="line-clamp-2">{m.description}</span>
                </td>
                <td className="p-2 border">
                  <div className="flex gap-2">
                    <button
                      className="px-2 py-1 rounded text-white bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => handleEdit(m)}
                    >
                      Edit
                    </button>
                    <button
                      className="px-2 py-1 rounded text-white bg-red-600 hover:bg-red-700"
                      onClick={() => handleDelete(m._id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan="5" className="p-4 text-center">
                  Loading...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Small note */}
      <p className="text-xs text-gray-500 mt-4">
        Tip: Backend should accept <code>multipart/form-data</code>. File field
        name: <code>image</code>. Return the final <code>imageUrl</code> in
        responses.
      </p>
    </div>
  );
};

export default MaterialManager;
