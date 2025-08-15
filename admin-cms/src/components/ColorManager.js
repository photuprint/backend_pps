// admin-cms/src/components/admin/ColorManager.jsx
import React, { useEffect, useMemo, useState } from "react";

const apiBase =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === "production" ? "/api" : "http://localhost:8080/api");

/**
 * Props:
 * - productId (string, required)
 */
export default function ColorManager({ productId }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null); // item or null

  const [form, setForm] = useState({
    name: "",
    code: "#000000",
    image: null, // File
    imageUrl: "", // existing URL when editing
  });

  const canSubmit = useMemo(
    () => form.name.trim() && form.code.trim() && (!editing || true),
    [form, editing]
  );

  // Fetch colors on mount
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiBase}/products/${productId}/colors`);
        const data = await res.json();
        setList(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Fetch colors failed", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [apiBase, productId]);

  const resetForm = () =>
    setForm({ name: "", code: "#000000", image: null, imageUrl: "" });

  const onChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setForm((f) => ({ ...f, image: files?.[0] || null }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const onEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name,
      code: item.code,
      image: null,
      imageUrl: item.image || "",
    });
  };

  const onDelete = async (id) => {
    if (!window.confirm("Delete this color variant?")) return;
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/products/${productId}/colors/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setList((l) => l.filter((x) => x._id !== id));
      if (editing?._id === id) {
        setEditing(null);
        resetForm();
      }
    } catch (e) {
      console.error(e);
      alert("Error deleting color");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async () => {
    if (!canSubmit) return;

    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("code", form.code.trim());
    if (form.image) fd.append("image", form.image);

    try {
      setLoading(true);
      let res;
      if (editing) {
        res = await fetch(
          `${apiBase}/products/${productId}/colors/${editing._id}`,
          { method: "PUT", body: fd }
        );
      } else {
        res = await fetch(`${apiBase}/products/${productId}/colors`, {
          method: "POST",
          body: fd,
        });
      }
      if (!res.ok) throw new Error("Save failed");
      const saved = await res.json();

      if (editing) {
        setList((l) => l.map((x) => (x._id === saved._id ? saved : x)));
        setEditing(null);
      } else {
        setList((l) => [...l, saved]);
      }
      resetForm();
    } catch (e) {
      console.error(e);
      alert("Error saving color");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-2xl shadow max-w-4xl">
      <h2 className="text-xl font-semibold mb-4">
        {editing ? "Edit Color Variant" : "Add Color Variant"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Color Name</label>
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            className="w-full border rounded-lg p-2"
            placeholder="e.g. Black"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Color Code</label>
          <div className="flex gap-2">
            <input
              name="code"
              type="text"
              value={form.code}
              onChange={onChange}
              className="flex-1 border rounded-lg p-2"
              placeholder="#000000"
            />
            <input
              name="code"
              type="color"
              value={form.code}
              onChange={onChange}
              className="w-12 h-10 border rounded"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Variant Image (optional)
          </label>
          <input
            name="image"
            type="file"
            accept="image/*"
            onChange={onChange}
            className="w-full border rounded-lg p-2"
          />
        </div>

        <div className="md:col-span-3 flex gap-2">
          <button
            onClick={onSubmit}
            disabled={!canSubmit || loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {editing ? "Update" : "Add"}
          </button>
          {editing && (
            <button
              onClick={() => {
                setEditing(null);
                resetForm();
              }}
              className="px-4 py-2 rounded-lg border"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Grid preview like Amazon/Flipkart */}
      <h3 className="mt-6 mb-2 font-semibold">Variants</h3>
      {loading && <div className="text-sm text-gray-500 mb-2">Loading…</div>}

      {list.length === 0 ? (
        <div className="text-sm text-gray-500">No variants yet.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {list.map((item) => (
            <div
              key={item._id}
              className={`rounded-xl p-1 border hover:shadow transition group ${
                editing?._id === item._id ? "ring-2 ring-blue-500" : ""
              }`}
            >
              <div className="aspect-square overflow-hidden rounded-lg bg-gray-50">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                    No image
                  </div>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium">{item.name}</div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{item.code}</span>
                    <span
                      className="inline-block w-3 h-3 rounded-full border"
                      style={{ background: item.code }}
                    />
                  </div>
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => onEdit(item)}
                    className="text-blue-600 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(item._id)}
                    className="text-red-600 text-sm"
                  >
                    Del
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
