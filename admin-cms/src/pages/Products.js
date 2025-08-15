import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function Products() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    sku: '',
    stock: '',
    images: []
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      // Handle the API response structure: {total, page, pages, products}
      const productsData = response.data.products || response.data || [];
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (err) {
      setError('Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      setShowAddForm(false);
      setEditingProduct(null);
      setFormData({ name: '', description: '', price: '', sku: '', stock: '', images: [] });
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      sku: product.sku || '',
      stock: product.stock || '',
      images: product.images || []
    });
    setShowAddForm(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${productId}`);
        fetchProducts();
      } catch (err) {
        setError('Failed to delete product');
      }
    }
  };

  const containerStyle = {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  };

  const buttonStyle = {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    textDecoration: 'none',
    display: 'inline-block'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  };

  const thStyle = {
    backgroundColor: '#f8f9fa',
    padding: '12px',
    textAlign: 'left',
    borderBottom: '1px solid #dee2e6'
  };

  const tdStyle = {
    padding: '12px',
    borderBottom: '1px solid #dee2e6'
  };

  const formStyle = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  };

  const inputStyle = {
    width: '100%',
    padding: '8px',
    margin: '5px 0',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box'
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h2>Loading products...</h2>
        </div>
      </div>
    );
    }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <h1>📦 Product Management</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>
            Manage your product catalog and inventory
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/dashboard" style={{...buttonStyle, backgroundColor: '#6c757d'}}>
            ← Back to Dashboard
          </Link>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            style={buttonStyle}
          >
            {showAddForm ? 'Cancel' : 'Add New Product'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          borderRadius: '4px', 
          marginBottom: '20px' 
        }}>
          {error}
        </div>
      )}

      {showAddForm && (
        <div style={formStyle}>
          <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label>Name:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label>SKU:</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label>Price:</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label>Stock:</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  style={inputStyle}
                  required
                />
              </div>
            </div>
            <div>
              <label>Description:</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                style={{...inputStyle, minHeight: '100px'}}
                required
              />
            </div>
            <div style={{ marginTop: '10px' }}>
              <button type="submit" style={buttonStyle}>
                {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      <table style={tableStyle}>
        <thead>
              <tr>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>SKU</th>
            <th style={thStyle}>Price</th>
            <th style={thStyle}>Stock</th>
            <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan="5" style={{...tdStyle, textAlign: 'center'}}>
                No products found. Add your first product!
              </td>
            </tr>
          ) : (
            products.map((product) => (
              <tr key={product._id}>
                <td style={tdStyle}>{product.name}</td>
                <td style={tdStyle}>{product.sku}</td>
                <td style={tdStyle}>${product.price}</td>
                <td style={tdStyle}>{product.stock}</td>
                <td style={tdStyle}>
                  <button 
                    onClick={() => handleEdit(product)}
                    style={{...buttonStyle, marginRight: '5px', backgroundColor: '#28a745'}}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(product._id)}
                    style={{...buttonStyle, backgroundColor: '#dc3545'}}
                  >
                    Delete
                  </button>
                  </td>
                </tr>
            ))
          )}
            </tbody>
          </table>
    </div>
  );
}



// import React, { useState } from "react";
// import ProductMediaUploader from "./ProductMediaUploader";

// const AddProductPage = () => {
//   const [media, setMedia] = useState([]);

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     if (media.length === 0) {
//       alert("Please upload at least the main image.");
//       return;
//     }

//     const formData = new FormData();
//     media.forEach((item) => formData.append("media", item.file));

//     // append other product fields here...

//     fetch("/api/products", {
//       method: "POST",
//       body: formData,
//     })
//       .then((res) => res.json())
//       .then((data) => {
//         alert("Product added!");
//         setMedia([]);
//       })
//       .catch((err) => console.error(err));
//   };

//   return (
//     <form onSubmit={handleSubmit}>
//       <ProductMediaUploader media={media} setMedia={setMedia} />

//       {/* Other product fields here */}

//       <button
//         type="submit"
//         className="bg-blue-600 text-white px-4 py-2 rounded"
//       >
//         Add Product
//       </button>
//     </form>
//   );
// };

// export default AddProductPage;
