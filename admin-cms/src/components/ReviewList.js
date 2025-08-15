import React, { useEffect, useState } from "react";

const ReviewList = () => {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [filters, setFilters] = useState({
    categoryId: "",
    subCategoryId: "",
    productId: "",
  });

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error("Error fetching categories:", err));
  }, [API_BASE_URL]);

  const loadReviews = () => {
    let url = `${API_BASE_URL}/api/reviews`;
    const params = [];
    if (filters.categoryId) params.push(`categoryId=${filters.categoryId}`);
    if (filters.subCategoryId) params.push(`subCategoryId=${filters.subCategoryId}`);
    if (filters.productId) params.push(`productId=${filters.productId}`);
    if (params.length > 0) url += "?" + params.join("&");

    fetch(url)
      .then((res) => res.json())
      .then((data) => setReviews(data))
      .catch((err) => console.error("Error fetching reviews:", err));
  };

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    setFilters({ categoryId, subCategoryId: "", productId: "" });

    if (categoryId) {
      fetch(`${API_BASE_URL}/api/subcategories?categoryId=${categoryId}`)
        .then((res) => res.json())
        .then((data) => setSubCategories(data))
        .catch((err) => console.error("Error loading subcategories:", err));
    } else {
      setSubCategories([]);
      setProducts([]);
    }
  };

  const handleSubCategoryChange = (e) => {
    const subCategoryId = e.target.value;
    setFilters((prev) => ({ ...prev, subCategoryId, productId: "" }));

    if (subCategoryId) {
      fetch(`${API_BASE_URL}/api/products?subCategoryId=${subCategoryId}`)
        .then((res) => res.json())
        .then((data) => setProducts(data))
        .catch((err) => console.error("Error loading products:", err));
    } else {
      setProducts([]);
    }
  };

  const handleProductChange = (e) => {
    setFilters((prev) => ({ ...prev, productId: e.target.value }));
  };

  const updateStatus = async (id, status) => {
    try {
      await fetch(`${API_BASE_URL}/api/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      loadReviews();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const deleteReview = async (id) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await fetch(`${API_BASE_URL}/api/reviews/${id}`, { method: "DELETE" });
      loadReviews();
    } catch (err) {
      console.error("Error deleting review:", err);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [filters]);

  return (
    <div className="p-4 bg-white rounded shadow max-w-6xl mx-auto">
      <h2 className="text-lg font-bold mb-4">Manage Reviews</h2>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <select
          className="border p-2"
          value={filters.categoryId}
          onChange={handleCategoryChange}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        {subCategories.length > 0 && (
          <select
            className="border p-2"
            value={filters.subCategoryId}
            onChange={handleSubCategoryChange}
          >
            <option value="">All Subcategories</option>
            {subCategories.map((sub) => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>
        )}

        {products.length > 0 && (
          <select
            className="border p-2"
            value={filters.productId}
            onChange={handleProductChange}
          >
            <option value="">All Products</option>
            {products.map((prod) => (
              <option key={prod.id} value={prod.id}>{prod.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="p-2 border">User</th>
            <th className="p-2 border">Product</th>
            <th className="p-2 border">Rating</th>
            <th className="p-2 border">Comment</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <tr key={review.id} className="border-b">
                <td className="p-2 border">
                  <div className="flex items-center gap-2">
                    {review.avatar && (
                      <img
                        src={review.avatar}
                        alt="avatar"
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    {review.name}
                  </div>
                </td>
                <td className="p-2 border">{review.productName}</td>
                <td className="p-2 border">{"★".repeat(review.rating)}</td>
                <td className="p-2 border">{review.comment}</td>
                <td className="p-2 border">{review.status}</td>
                <td className="p-2 border">
                  <button
                    className="bg-green-500 text-white px-2 py-1 rounded mr-1"
                    onClick={() => updateStatus(review.id, "approved")}
                  >
                    Approve
                  </button>
                  <button
                    className="bg-yellow-500 text-white px-2 py-1 rounded mr-1"
                    onClick={() => updateStatus(review.id, "disapproved")}
                  >
                    Disapprove
                  </button>
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded"
                    onClick={() => deleteReview(review.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center p-4">
                No reviews found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ReviewList;
