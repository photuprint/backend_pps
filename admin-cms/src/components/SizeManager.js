import React, { useState } from "react";

const SizeManager = () => {
  const [sizeName, setSizeName] = useState("");
  const [sizeInitial, setSizeInitial] = useState("");
  const [sizes, setSizes] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";

  const handleAddOrUpdate = () => {
    if (!sizeName.trim() || !sizeInitial.trim()) return;

    if (editingIndex !== null) {
      const updatedSizes = [...sizes];
      updatedSizes[editingIndex] = { name: sizeName, initial: sizeInitial };
      setSizes(updatedSizes);
      setEditingIndex(null);
    } else {
      setSizes([...sizes, { name: sizeName, initial: sizeInitial }]);
    }

    setSizeName("");
    setSizeInitial("");
  };

  const handleEdit = (index) => {
    setSizeName(sizes[index].name);
    setSizeInitial(sizes[index].initial);
    setEditingIndex(index);
  };

  const handleDelete = (index) => {
    setSizes(sizes.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setSizeName("");
      setSizeInitial("");
      setEditingIndex(null);
    }
  };

  const handleSaveToBackend = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/sizes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sizes }),
      });
      if (!res.ok) throw new Error("Failed to save sizes");
      alert("Sizes saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Error saving sizes");
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-md max-w-lg bg-white">
      <h2 className="text-lg font-bold mb-4">Manage Sizes</h2>

      {/* Form */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Size Name (e.g. Small)"
          value={sizeName}
          onChange={(e) => setSizeName(e.target.value)}
          className="border p-2 rounded w-2/5"
        />
        <input
          type="text"
          placeholder="Initial (e.g. S)"
          value={sizeInitial}
          onChange={(e) => setSizeInitial(e.target.value)}
          className="border p-2 rounded w-1/5"
          maxLength={3}
        />
        <button
          onClick={handleAddOrUpdate}
          className={`${
            editingIndex !== null
              ? "bg-yellow-500 hover:bg-yellow-600"
              : "bg-blue-500 hover:bg-blue-600"
          } text-white px-4 py-2 rounded`}
        >
          {editingIndex !== null ? "Update" : "Add"}
        </button>
      </div>

      {/* Table */}
      {sizes.length > 0 && (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Size Name</th>
              <th className="p-2 border">Initial</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sizes.map((s, index) => (
              <tr key={index} className="text-center">
                <td className="p-2 border">{s.name}</td>
                <td className="p-2 border">{s.initial}</td>
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
      {sizes.length > 0 && (
        <button
          onClick={handleSaveToBackend}
          className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Save Sizes
        </button>
      )}
    </div>
  );
};

export default SizeManager;
