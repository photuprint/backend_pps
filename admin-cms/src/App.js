import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Status from './pages/Status';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext';
import AddColor from './components/ColorManager';
import AddSize from './components/SizeManager'; 
import AddCategory from './components/CategoryManager';
import AddSubcategory from './components/SubcategoryManager';
import AddReviewManager from './components/ReviewManager';
import ReviewList from './components/ReviewList';
import MaterialManager from './components/MaterialManager';
import BrandManager from './components/BrandManager';
import WidthManager from "./components/WidthManager";
import HeightManager from "./components/HeightManager";
import LengthManager from "./components/LengthManager";
import PatternManager from "./components/PatternManager";
import FitTypeManager from "./components/FitTypeManager";
import SleeveTypeManager from "./components/SleeveTypeManager";
import CollarStyleManager from "./components/CollarStyleManager";
import CountryOfOriginManager from "./components/CountryOfOriginManager";
import PinCodeManager from "./components/PinCodeManager";
import ProductMediaUploader from './common/MediaUploaderWithVideos';

export default function App() {
  const [media, setMedia] = useState([]);
  const handleSubmit = (e) => {
    e.preventDefault();

    if (media.length === 0) {
      alert("Please upload at least the main image.");
      return;
    }

    const formData = new FormData();
    media.forEach((item) => formData.append("media", item.file));

    // append other product fields here...

    fetch("/api/products", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        alert("Product added!");
        setMedia([]);
      })
      .catch((err) => console.error(err));
  };
  return (
    <AuthProvider>
      <Router>
        <Routes>
        /* {/*  <Route path="/" element={<Login />} />
          <Route path="/status" element={<Status />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} /> */}   
                    <Route path="/dashboard" element={<Dashboard />} />                    
                    <Route path="/products" element={<Products />} />
                    <Route path="/addcolor" element={<AddColor />} />
                    <Route path="/addsize" element={<AddSize />} />
                    <Route path="/addcategory" element={<AddCategory />} />
                    <Route path="/addsubcategory" element={<AddSubcategory />} />
                    <Route path="/addreview" element={<AddReviewManager />} />
                    <Route path="/reviewlist" element={<ReviewList />} />
                    <Route path="/addmaterial" element={<MaterialManager />} />
                    <Route path="/addbrand" element={<BrandManager />} />
                    <Route path="/addwidth" element={<WidthManager />} />
                    <Route path="/addheight" element={<HeightManager />} />
                    <Route path="/addlength" element={<LengthManager />} />
                    <Route path="/addpattern" element={<PatternManager />} />
                    <Route path="/addfittype" element={<FitTypeManager />} />
                    <Route path="/addsleevetype" element={<SleeveTypeManager />} />
                    <Route path="/addcollarstyle" element={<CollarStyleManager />} />
                    <Route path="/addcountryoforigin" element={<CountryOfOriginManager />} />
                    <Route path="/addpincode" element={<PinCodeManager />} />     
                    <Route path="/addMedia" element={<ProductMediaUploader media={media} setMedia={setMedia} />} />  
                              

        </Routes>
      </Router>
    </AuthProvider>
  );
}
