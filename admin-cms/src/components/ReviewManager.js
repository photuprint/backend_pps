import React, { useEffect, useState } from "react";

const AddReview = ({ onReviewAdded }) => {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [form, setForm] = useState({
    categoryId: "",
    subCategoryId: "",
    productId: "",
    productName: "",
    userId: "",
    name: "",
    avatar: null,
    title: "",
    email: "",
    comment: "",
    rating: 0,
    productImage: null,
    status: "pending",
  });

  useEffect(() => {
    // Fetch Categories
    fetch(`${API_BASE_URL}/api/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error("Error loading categories:", err));
  }, [API_BASE_URL]);

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    setForm({ ...form, categoryId, subCategoryId: "", productId: "", productName: "" });
    // Fetch subcategories for selected category
    fetch(`${API_BASE_URL}/api/subcategories?categoryId=${categoryId}`)
      .then((res) => res.json())
      .then((data) => setSubCategories(data))
      .catch((err) => console.error("Error loading subcategories:", err));
  };

  const handleSubCategoryChange = (e) => {
    const subCategoryId = e.target.value;
    setForm({ ...form, subCategoryId, productId: "", productName: "" });
    // Fetch products for selected subcategory
    fetch(`${API_BASE_URL}/api/products?subCategoryId=${subCategoryId}`)
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Error loading products:", err));
  };

  const handleProductChange = (e) => {
    const selected = products.find((p) => p.id === e.target.value);
    setForm({ ...form, productId: selected?.id, productName: selected?.name || "" });
  };

  const handleFileChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.files[0] });
  };

  const handleRatingChange = (value) => {
    setForm({ ...form, rating: value });
  };

  const handleSubmit = async () => {
    if (!form.categoryId || !form.subCategoryId || !form.productId) {
      alert("Please select category, subcategory, and product");
      return;
    }
    if (!form.userId || !form.name || !form.email || !form.comment || form.rating < 1) {
      alert("Please fill all required fields and select rating");
      return;
    }

    const formData = new FormData();
    Object.keys(form).forEach((key) => {
      formData.append(key, form[key]);
    });

    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to save review");

      alert("Review added successfully!");
      onReviewAdded && onReviewAdded();
      setForm({
        categoryId: "",
        subCategoryId: "",
        productId: "",
        productName: "",
        userId: "",
        name: "",
        avatar: null,
        title: "",
        email: "",
        comment: "",
        rating: 0,
        productImage: null,
        status: "pending",
      });
    } catch (err) {
      console.error(err);
      alert("Error saving review");
    }
  };

  const renderStars = (count, onClick) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((num) => (
          <span
            key={num}
            className={`cursor-pointer text-xl ${num <= count ? "text-yellow-500" : "text-gray-300"}`}
            onClick={() => onClick(num)}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 bg-white rounded shadow max-w-2xl mx-auto">
      <h2 className="text-lg font-bold mb-4">Add Review</h2>

      {/* Category Dropdown */}
      <select
        className="border p-2 w-full mb-2"
        value={form.categoryId}
        onChange={handleCategoryChange}
      >
        <option value="">Select Category</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      {/* Subcategory Dropdown */}
      {subCategories.length > 0 && (
        <select
          className="border p-2 w-full mb-2"
          value={form.subCategoryId}
          onChange={handleSubCategoryChange}
        >
          <option value="">Select Subcategory</option>
          {subCategories.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
          ))}
        </select>
      )}

      {/* Products Dropdown */}
      {products.length > 0 && (
        <select
          className="border p-2 w-full mb-2"
          value={form.productId}
          onChange={handleProductChange}
        >
          <option value="">Select Product</option>
          {products.map((prod) => (
            <option key={prod.id} value={prod.id}>
              {prod.name}
            </option>
          ))}
        </select>
      )}

      {/* Rest of the fields */}
      {form.productId && (
        <>
          <input
            type="text"
            placeholder="User ID"
            value={form.userId}
            onChange={(e) => setForm({ ...form, userId: e.target.value })}
            className="border p-2 w-full mb-2"
          />
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border p-2 w-full mb-2"
          />
          <input
            type="file"
            name="avatar"
            onChange={handleFileChange}
            className="border p-2 w-full mb-2"
          />
          <input
            type="text"
            placeholder="Review Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="border p-2 w-full mb-2"
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="border p-2 w-full mb-2"
          />

          {/* Star Rating */}
          <div className="mb-2">{renderStars(form.rating, handleRatingChange)}</div>

          <textarea
            placeholder="Comment"
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
            className="border p-2 w-full mb-2"
          />
          <input
            type="file"
            name="productImage"
            onChange={handleFileChange}
            className="border p-2 w-full mb-2"
          />

          <button
            onClick={handleSubmit}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Submit Review
          </button>
        </>
      )}
    </div>
  );
};

export default AddReview;
