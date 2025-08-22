// frontend/src/pages/ProductDetails.jsx
import React, { useEffect, useState } from "react";
import ColorSelector from "../components/product/ColorSelector";

const apiBase =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === "production" ? "/api" : "http://localhost:8080/api");

export default function ProductDetails({ productId }) {
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selected, setSelected] = useState(null);
  const mainImage = selected?.image || product?.images?.[0];

  useEffect(() => {
    (async () => {
      const [pRes, cRes] = await Promise.all([
        fetch(`${apiBase}/products/${productId}`),
        fetch(`${apiBase}/products/${productId}/colors`),
      ]);
      const p = await pRes.json();
      const c = await cRes.json();
      setProduct(p);
      setVariants(c || []);
      if (c?.length) setSelected(c[0]);
    })();
  }, [productId]);

  return (
    <div className="max-w-6xl mx-auto p-4 grid md:grid-cols-2 gap-8">
      <div className="rounded-xl overflow-hidden border bg-white">
        {mainImage ? (
          <img src={mainImage} alt={product?.name} className="w-full object-cover" />
        ) : (
          <div className="p-8 text-gray-400">No image</div>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold mb-4">{product?.name}</h1>

        <ColorSelector
          variants={variants}
          selectedId={selected?._id}
          onChange={(_, v) => setSelected(v)}
        />

        {/* …rest of product details */}
      </div>
    </div>
  );
}
