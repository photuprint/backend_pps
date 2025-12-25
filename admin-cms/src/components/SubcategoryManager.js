import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import api from '../api/axios';
import { 
  PageHeader, 
  AlertMessage, 
  ViewToggle, 
  Pagination, 
  EntityCard, 
  EntityCardHeader,
  FormField, 
  ActionButtons,
  StickyHeaderWrapper,
  SearchField,
  generateEntityColor,
  DeleteConfirmationPopup,
  StatusFilter,
  filterEntitiesByStatus,
  calculateStandardStatusCounts
} from '../common';

const SubcategoryManager = () => {
  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'
  
  // Pagination and lazy loading states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // For list view
  const [hasMoreCards, setHasMoreCards] = useState(true);
  const [displayedCards, setDisplayedCards] = useState([]);
  
  // Status filtering state
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Delete confirmation popup state
  const [deletePopup, setDeletePopup] = useState({
    isVisible: false,
    subcategoryId: null,
    message: '',
    isPermanentDelete: false,
    action: 'delete' // 'delete' or 'revert'
  });
  
  const initialFormData = {
    categoryId: "",
    name: "",
    description: "",
    image: null,
    isActive: false,  // Default to false for new subcategories
    subcategoryId: ""  // Will be auto-generated
  };

  const [formData, setFormData] = useState(initialFormData);
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [searchQuery, setSearchQuery] = useState(""); // Search query state
  
  // Refs for scroll and focus functionality
  const formRef = useRef(null);
  const subcategoryNameInputRef = useRef(null);

  // Fetch subcategories from backend
  const fetchSubcategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/subcategories?showInactive=true&includeDeleted=true');
      
      console.log('Subcategories response:', response.data);
      
      // Process subcategories to ensure proper image URLs
      const processedSubcategories = response.data.map(subcategory => {
        let imageUrl = subcategory.image;
        
        // If image is a relative path, construct full URL
        if (imageUrl && !imageUrl.startsWith('http')) {
          if (imageUrl.startsWith('/uploads/')) {
            imageUrl = `http://localhost:8080${imageUrl}`;
          }
        }
        
        console.log('Processing subcategory:', {
          id: subcategory._id,
          name: subcategory.name,
          categoryId: subcategory.categoryId,
          categoryName: subcategory.categoryName,
          categorySlug: subcategory.categorySlug,
          deleted: subcategory.deleted,
          isActive: subcategory.isActive
        });
        
        return {
          ...subcategory,
          image: imageUrl
        };
      });
      
      console.log('Processed subcategories:', processedSubcategories);
      setSubcategories(processedSubcategories);
      setError("");
    } catch (err) {
      setError("Failed to load subcategories. Please refresh the page and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories for dropdown
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      console.log("Fetching categories...");
      const response = await api.get('/categories');
      console.log("Categories response:", response);
      console.log("Categories data:", response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setCategories(response.data);
        console.log("Categories set successfully:", response.data.length, "categories");
      } else {
        console.error("Invalid categories data format:", response.data);
        setError("Failed to load categories. Invalid data format.");
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      console.error("Error details:", err.response?.data, err.message);
      setError("Failed to load categories. Please check the connection.");
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchSubcategories();
    fetchCategories();
  }, []);



  // Filter subcategories based on search query and status - memoized to prevent infinite loops
  const filteredSubcategories = useMemo(() => {
    let filtered = subcategories;
    
    // Apply status filter first
    if (statusFilter !== 'all') {
      filtered = filterEntitiesByStatus(filtered, statusFilter);
    }
    
    // Then apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(subcategory => 
        subcategory.name.toLowerCase().includes(query) ||
        (subcategory.description && subcategory.description.toLowerCase().includes(query)) ||
        (subcategory.categoryName && subcategory.categoryName.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [subcategories, searchQuery, statusFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredSubcategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSubcategories = filteredSubcategories.slice(startIndex, endIndex);

  // Card lazy loading logic
  useEffect(() => {
    if (viewMode === 'card' && filteredSubcategories.length > 0) {
      const initialCards = filteredSubcategories.slice(0, 12);
      setDisplayedCards(initialCards);
      setHasMoreCards(filteredSubcategories.length > 12);
      setCurrentPage(1);
    }
  }, [filteredSubcategories, viewMode]);

  // Reset pagination when search query or status filter changes
  useEffect(() => {
    setCurrentPage(1);
    if (viewMode === 'card') {
      const initialCards = filteredSubcategories.slice(0, 12);
      setDisplayedCards(initialCards);
      setHasMoreCards(filteredSubcategories.length > 12);
    }
  }, [searchQuery, statusFilter, viewMode, filteredSubcategories]);

  // Handle page change for list view
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle lazy loading for card view
  const handleLoadMoreCards = () => {
    const currentCardCount = displayedCards.length;
    const nextCards = filteredSubcategories.slice(currentCardCount, currentCardCount + 12);
    
    if (nextCards.length > 0) {
      setDisplayedCards([...displayedCards, ...nextCards]);
      setHasMoreCards(currentCardCount + nextCards.length < filteredSubcategories.length);
    } else {
      setHasMoreCards(false);
    }
  };

  // Reset pagination when view mode changes
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setCurrentPage(1);
    if (mode === 'card') {
      const initialCards = filteredSubcategories.slice(0, 12);
      setDisplayedCards(initialCards);
      setHasMoreCards(filteredSubcategories.length > 12);
    }
  };

  // Handle status filter change
  const handleStatusFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else if (type === 'file') {
      setFormData({ ...formData, [name]: files[0] || null });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setCurrentImageUrl(null);
    setEditingId(null);
    setError("");
    setSuccess("");
  };

  // Clear file input after successful upload
  const clearFileInput = () => {
    const fileInput = document.querySelector('input[name="image"]');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Check for duplicate subcategory names within the same category
  const checkDuplicateNameInCategory = (name, categoryId, excludeId = null) => {
    const trimmedName = name.trim().toLowerCase();
    
    return subcategories.some(subcategory => {
      // Skip the current subcategory being edited
      if (excludeId && subcategory._id === excludeId) {
        return false;
      }
      
      // Check if name matches and category matches
      return subcategory.name.toLowerCase() === trimmedName && 
             subcategory.categoryId === categoryId;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.categoryId) {
      setError("Please select a category for this subcategory.");
      return;
    }

    if (!formData.name.trim()) {
      setError("Subcategory name is required. Please enter a name to continue.");
      return;
    }

    // Check for duplicate names within the same category
    if (checkDuplicateNameInCategory(formData.name, formData.categoryId, editingId)) {
      setError("Subcategory name already exists in this category. Please choose a different name.");
      return;
    }

    try {
      setLoading(true);
      setSuccess(""); // Clear any existing success message
      setError(""); // Clear any existing error message

      let subcategoryData;
      
      if (formData.image) {
        // Use FormData for file upload (new image selected)
        subcategoryData = new FormData();
        subcategoryData.append('categoryId', formData.categoryId);
        subcategoryData.append('name', formData.name.trim());
        subcategoryData.append('description', formData.description.trim() || '');
        subcategoryData.append('image', formData.image);
        subcategoryData.append('isActive', formData.isActive ? 'true' : 'false');
      } else if (editingId && currentImageUrl) {
        // Use JSON for update without image change (keep existing image)
        subcategoryData = {
          categoryId: formData.categoryId,
          name: formData.name.trim(),
          description: formData.description.trim() || '',
          isActive: formData.isActive
        };
      } else {
        // Use JSON for new subcategory without image
        subcategoryData = {
          categoryId: formData.categoryId,
          name: formData.name.trim(),
          description: formData.description.trim() || '',
          isActive: formData.isActive
        };
      }

      if (editingId) {
        // Update subcategory
        await api.put(`/subcategories/${editingId}`, subcategoryData);
        const action = formData.image ? "updated with new image" : "updated successfully";
        setSuccess(`Subcategory "${formData.name.trim()}" ${action}!`);
      } else {
        // Create subcategory
        await api.post('/subcategories', subcategoryData);
        const action = formData.image ? "created with image" : "created successfully";
        setSuccess(`Subcategory "${formData.name.trim()}" ${action}!`);
      }

      // Refresh subcategories list
      await fetchSubcategories();
      
      // Delay form reset to allow user to see success message
      setTimeout(() => {
        resetForm();
        clearFileInput();
      }, 2000); // Wait 2 seconds before clearing the form
      
    } catch (err) {
      const action = editingId ? "update" : "create";
      setError(err.response?.data?.msg || `Failed to ${action} subcategory. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (subcategory) => {
    console.log('Editing subcategory:', subcategory);
    console.log('Available categories:', categories);
    console.log('Subcategory isActive value:', subcategory.isActive, 'Type:', typeof subcategory.isActive);
    
    // Ensure categories are loaded before editing
    if (categories.length === 0) {
      console.log('Categories not loaded yet, fetching...');
      fetchCategories().then(() => {
        // Retry edit after categories are loaded
        setTimeout(() => handleEdit(subcategory), 100);
      });
      return;
    }
    
    // Use categoryId directly (should be a string now)
    const categoryIdValue = subcategory.categoryId || "";
    console.log('Using categoryId:', categoryIdValue);
    
    // Check if the categoryId exists in categories
    const categoryExists = categories.find(cat => cat._id === categoryIdValue);
    console.log('Category exists:', categoryExists);
    
    // Ensure isActive is a boolean - default to false if undefined
    const isActiveValue = subcategory.isActive !== undefined ? Boolean(subcategory.isActive) : false;
    console.log('Setting isActive to:', isActiveValue, 'Type:', typeof isActiveValue);
    
    setFormData({
      ...initialFormData,
      categoryId: categoryIdValue,
      name: subcategory.name || "",
      description: subcategory.description || "",
      image: null, // Reset image field for new file selection
      isActive: isActiveValue,
      subcategoryId: subcategory.subcategoryId || ""
    });
    setCurrentImageUrl(subcategory.image || null);
    setEditingId(subcategory._id);
    setError("");
    setSuccess("");
    
    // Scroll to form and focus on subcategory name input
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
      if (subcategoryNameInputRef.current) {
        subcategoryNameInputRef.current.focus();
      }
    }, 100);
  };

  const handleDelete = (subcategoryId) => {
    // Find the subcategory to check if it's already marked as deleted
    const subcategory = subcategories.find(s => s._id === subcategoryId);
    const isAlreadyDeleted = subcategory?.deleted;
    
    let message;
    if (isAlreadyDeleted) {
      message = "This subcategory is already marked as deleted. Click OK to permanently remove it from the database. This action cannot be undone.";
    } else {
      message = "This will mark the subcategory as inactive and add a deleted flag. Click OK to continue.";
    }
    
    setDeletePopup({
      isVisible: true,
      subcategoryId,
      message,
      isPermanentDelete: isAlreadyDeleted,
      action: 'delete'
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      setSuccess(""); // Clear any existing success message
      setError(""); // Clear any existing error message
      
      const { subcategoryId, isPermanentDelete } = deletePopup;
      
      if (isPermanentDelete) {
        // Permanent deletion
        try {
          await api.delete(`/subcategories/${subcategoryId}/hard`);
          setSuccess("Subcategory permanently deleted from database!");
        } catch (hardDeleteErr) {
          console.error('Hard delete failed, trying regular delete:', hardDeleteErr);
          // Fallback to regular delete if hard delete endpoint doesn't exist
          await api.delete(`/subcategories/${subcategoryId}`);
          setSuccess("Subcategory deleted from database!");
        }
      } else {
        // Soft delete - try multiple approaches
        console.log('Attempting soft delete for subcategory:', subcategoryId);
        
        let deleteSuccess = false;
        
        // Approach 1: Try soft delete endpoint
        try {
          const deleteResponse = await api.delete(`/subcategories/${subcategoryId}`);
          console.log('Soft delete response:', deleteResponse);
          deleteSuccess = true;
          setSuccess("Subcategory marked as deleted and inactive!");
        } catch (softDeleteErr) {
          console.log('Soft delete endpoint failed:', softDeleteErr.response?.data);
        }
        
        // Approach 2: If soft delete failed, try updating with deleted flag
        if (!deleteSuccess) {
          try {
            console.log('Trying to update subcategory with deleted flag...');
            const updateResponse = await api.put(`/subcategories/${subcategoryId}`, {
              isActive: false,
              deleted: true
            });
            console.log('Update with deleted flag response:', updateResponse);
            deleteSuccess = true;
            setSuccess("Subcategory marked as deleted and inactive!");
          } catch (updateErr) {
            console.log('Update with deleted flag failed:', updateErr.response?.data);
          }
        }
        
        // Approach 3: If both failed, try just setting inactive
        if (!deleteSuccess) {
          try {
            console.log('Trying to set subcategory as inactive...');
            const updateResponse = await api.put(`/subcategories/${subcategoryId}`, {
              isActive: false
            });
            console.log('Set inactive response:', updateResponse);
            deleteSuccess = true;
            setSuccess("Subcategory marked as inactive!");
          } catch (inactiveErr) {
            console.log('Set inactive failed:', inactiveErr.response?.data);
            throw new Error('All delete approaches failed');
          }
        }
      }
      
      console.log('Refreshing subcategories after delete...');
      // Delay fetch to allow user to see success message
      setTimeout(async () => {
        await fetchSubcategories();
      }, 1000); // Wait 1 second before refreshing
      
      // Debug: Check if the deleted subcategory is properly marked
      try {
        const updatedSubcategories = await api.get('/subcategories?showInactive=true&includeDeleted=true');
        console.log('Updated subcategories after delete:', updatedSubcategories.data);
        const deletedSubcategory = updatedSubcategories.data.find(s => s._id === subcategoryId);
        console.log('Deleted subcategory status:', deletedSubcategory);
      } catch (debugErr) {
        console.log('Debug fetch failed:', debugErr);
      }
      
    } catch (err) {
      console.error('Delete operation failed:', err);
      const action = deletePopup.isPermanentDelete ? "permanently delete" : "mark as deleted";
      setError(err.response?.data?.msg || err.message || `Failed to ${action} subcategory`);
    } finally {
      setLoading(false);
      setDeletePopup({ isVisible: false, subcategoryId: null, message: '', isPermanentDelete: false, action: 'delete' });
    }
  };

  const handleDeleteCancel = () => {
    setDeletePopup({ isVisible: false, subcategoryId: null, message: '', isPermanentDelete: false, action: 'delete' });
  };

  const handleRevert = (subcategoryId) => {
    const subcategory = subcategories.find(s => s._id === subcategoryId);
    const message = `Are you sure you want to restore the subcategory "${subcategory.name}"? This will make it active again.`;
    
    setDeletePopup({
      isVisible: true,
      subcategoryId,
      message,
      isPermanentDelete: false,
      action: 'revert'
    });
  };

  const handleRevertConfirm = async () => {
    try {
      setLoading(true);
      setSuccess(""); // Clear any existing success message
      setError(""); // Clear any existing error message
      
      const { subcategoryId } = deletePopup;
      const subcategory = subcategories.find(s => s._id === subcategoryId);
      
      if (!subcategory) {
        setError("Subcategory not found. Please refresh the page and try again.");
        return;
      }

      // Check for duplicate names within the same category when reverting
      if (checkDuplicateNameInCategory(subcategory.name, subcategory.categoryId, subcategoryId)) {
        const existingSubcategory = subcategories.find(s => 
          s.name.toLowerCase() === subcategory.name.toLowerCase() && 
          s.categoryId === subcategory.categoryId &&
          s._id !== subcategoryId
        );
        
        const statusText = existingSubcategory?.isActive ? 'active' : 'inactive';
        setError(`Cannot restore subcategory. A ${statusText} subcategory with this name already exists in the same category.`);
        return;
      }

      // Call API to restore subcategory
      await api.put(`/subcategories/${subcategoryId}/revert`);
      setSuccess(`Subcategory "${subcategory.name}" restored successfully!`);
      
      // Delay fetch to allow user to see success message
      setTimeout(async () => {
        await fetchSubcategories();
      }, 1000); // Wait 1 second before refreshing
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to restore subcategory. Please try again.");
    } finally {
      setLoading(false);
      setDeletePopup({ isVisible: false, subcategoryId: null, message: '', isPermanentDelete: false, action: 'delete' });
    }
  };

  const handleRevertCancel = () => {
    setDeletePopup({ isVisible: false, subcategoryId: null, message: '', isPermanentDelete: false, action: 'delete' });
  };

  const handleCancel = () => {
    resetForm();
  };

  // Generate next subcategory ID
  const generateNextSubcategoryId = useCallback(() => {
    if (subcategories.length === 0) {
      return 'PPSSUBCATNM1001';
    }
    
    // Find the highest existing subcategory ID number
    const existingIds = subcategories
      .map(subcategory => subcategory.subcategoryId)
      .filter(id => id && id.startsWith('PPSSUBCATNM'))
      .map(id => {
        const match = id.match(/PPSSUBCATNM(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });
    
    const maxNumber = Math.max(...existingIds, 1000);
    const nextNumber = maxNumber + 1;
    return `PPSSUBCATNM${nextNumber}`;
  }, [subcategories]);

  // Get current subcategory ID for display
  const getCurrentSubcategoryId = useCallback(() => {
    if (editingId) {
      return subcategories.find(s => s._id === editingId)?.subcategoryId || 'N/A';
    }
    return generateNextSubcategoryId();
  }, [editingId, subcategories, generateNextSubcategoryId]);





  // Get category name - now directly from subcategory data
  const getCategoryName = (subcategory) => {
    if (!subcategory) {
      return 'No Subcategory';
    }
    
    // Use categoryName directly from subcategory
    if (subcategory.categoryName) {
      return subcategory.categoryName;
    }
    
    // Fallback to categoryId if categoryName is not available
    if (subcategory.categoryId) {
      if (categories.length === 0) {
        return 'Loading Categories...';
      }
      
      const category = categories.find(cat => cat._id === subcategory.categoryId);
      return category ? category.name : 'Unknown Category';
    }
    
    return 'No Category';
  };



  return (
    <div className="paddingAll20">
      {/* Header */}
      <StickyHeaderWrapper>
        <PageHeader
          title="Subcategory Management"
          subtitle="Manage subcategories within your product categories"
          isEditing={!!editingId}
          editText="Edit Subcategory"
          createText="Add New Subcategory"
        />
      </StickyHeaderWrapper>

      {/* Success/Error Messages */}
      <AlertMessage
        type="success"
        message={success}
        onClose={() => setSuccess("")}
        autoClose={false}
      />
      
      <AlertMessage
        type="error"
        message={error}
        onClose={() => setError("")}
        autoClose={false}
      />

      {/* Subcategory Form */}
              <div className="brandFormContainer paddingAll32 appendBottom30" ref={formRef}>
        <form onSubmit={handleSubmit} className="brandForm">
          {/* Subcategory ID Display Field */}
          <div className="makeFlex row gap10">
            <div className="fullWidth">
              <FormField
                type="text"
                name="subcategoryId"
                label="Subcategory ID"
                value={getCurrentSubcategoryId()}
                onChange={() => {}} // No change handler - read-only
                placeholder="Subcategory ID will be auto-generated"
                disabled={true}
                info="Subcategory ID is automatically generated in the format PPSSUBCATNM1001, PPSSUBCATNM1002, etc. This field cannot be edited."
              />
            </div>
          </div>
          
          <div className="makeFlex row gap10">
            <div className="fullWidth">
              <FormField
                type="select"
                name="categoryId"
                label="Category"
                value={formData.categoryId}
                onChange={handleChange}
                required={true}
                disabled={categoriesLoading}
                info={categoriesLoading ? "Loading categories..." : `Selected: ${formData.categoryId || 'None'} | Categories: ${categories.length}`}
                options={[
                  { value: "", label: categoriesLoading ? "Loading..." : "Select Category" },
                  ...categories.map(cat => ({
                    value: cat._id,
                    label: cat.name
                  }))
                ]}
              />
            </div>
          </div>
          
          <div className="makeFlex row gap10">
            <div className="fullWidth">
              <FormField
                ref={subcategoryNameInputRef}
                type="text"
                name="name"
                label="Subcategory Name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter Subcategory Name"
                required={true}
                info="Subcategory ID will be auto-generated (e.g., PPSSUBCATNM1002). Duplicate names are checked within the same category."
              />
            </div>
          </div>
          
          <div className="makeFlex row gap10">
            <div className="fullWidth">
              <FormField
                type="file"
                name="image"
                label="Subcategory Image"
                onChange={handleChange}
                accept="image/*"
                info="Supported formats: JPG, PNG, GIF (Max size: 5MB)"
              />
              {/* Show current image if editing */}
              {editingId && currentImageUrl && (
                <div className="currentImageInfo paddingTop8">
                  <p className="font12 grayText">Current image:</p>
                  <img 
                    src={currentImageUrl} 
                    alt="Current subcategory image" 
                    className="currentImagePreview"
                    style={{ 
                      maxWidth: '100px', 
                      maxHeight: '100px', 
                      objectFit: 'cover',
                      borderRadius: '4px',
                      marginTop: '4px'
                    }}
                    onError={(e) => {
                      console.error('Current image failed to load:', currentImageUrl);
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="makeFlex row gap10">
            <div className="fullWidth">
              <FormField
                type="textarea"
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter subcategory description"
                rows={3}
                info="Optional description for this subcategory"
              />
            </div>
          </div>
          
          <div className="makeFlex row gap10">
            <div className="makeFlex column flexOne appendBottom16">
              <label className="formLabel appendBottom10">Status:</label>
              <label className="formLabel appendBottom8 makeFlex gap10">
                <FormField
                  type="checkbox"
                  name="isActive"
                  value={formData.isActive}
                  onChange={handleChange}
                />
                Active
              </label>
              <p className="negativeMarginTop10">Check this box to keep the subcategory active, uncheck to mark as inactive</p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="formActions paddingTop16">
            <button
              type="submit"
              disabled={loading}
              className="btnPrimary"
            >
              {loading ? (
                <span className="loadingSpinner">⏳</span>
              ) : (
                <span>{editingId ? "Update Subcategory" : "Create Subcategory"}</span>
              )}
            </button>
            
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className="btnSecondary"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Subcategories List */}
      <div className="brandsListContainer paddingAll32">
        <div className="listHeader makeFlex spaceBetween end appendBottom24">
          <div className="leftSection">
            <h2 className="listTitle font30 fontBold blackText appendBottom16">Subcategories ({filteredSubcategories.length})</h2>
            <div className="makeFlex alignCenter gap16">
              <StatusFilter
                statusFilter={statusFilter}
                onStatusChange={handleStatusFilterChange}
                counts={calculateStandardStatusCounts(subcategories || [])}
                disabled={loading}
              />

            </div>
          </div>
          <div className="rightSection makeFlex end gap10">
            <SearchField
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subcategories..."
              disabled={loading}
              minWidth="250px"
            />
            {loading && <div className="loadingIndicator grayText">Loading...</div>}
            <ViewToggle
              viewMode={viewMode}
              onViewChange={handleViewModeChange}
              disabled={loading}
            />
          </div>
        </div>

        {filteredSubcategories.length === 0 && !loading ? (
          <div className="emptyState textCenter paddingAll60">
            <div className="emptyIcon appendBottom16">📂</div>
            <h3 className="font22 fontSemiBold grayText appendBottom8">No Subcategories Found</h3>
            <p className="font16 grayText">Start by adding your first subcategory above</p>
          </div>
        ) : (
          <>
            {/* Card View */}
            {viewMode === 'card' && (
              <div className="brandsGrid">
                {displayedCards.map((subcategory) => (
                  <EntityCard
                    key={subcategory._id}
                    entity={subcategory}
                    logoField="image"
                    nameField="name"
                    idField="_id"
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    loading={loading}
                    imagePlaceholderColor={generateEntityColor(subcategory._id, subcategory.name)}
                    renderHeader={(subcategory) => (
                      <EntityCardHeader
                        entity={subcategory}
                        imageField="image"
                        titleField="name"
                        dateField="createdAt"
                        generateColor={generateEntityColor}
                      />
                    )}
                    renderDetails={(subcategory) => {
                      return (
                        <>
                          <div className="brandDetail makeFlex spaceBetween alignCenter paddingTop8 paddingBottom8">
                            <span className="detailLabel font14 fontSemiBold grayText textUppercase">Subcategory ID:</span>
                            <span className="detailValue font14 blackText appendLeft6">{subcategory.subcategoryId || subcategory._id || 'N/A'}</span>
                          </div>
                          <div className="brandDetail makeFlex spaceBetween alignCenter paddingTop8 paddingBottom8">
                            <span className="detailLabel font14 fontSemiBold grayText textUppercase">Name:</span>
                            <span className="detailValue font14 blackText appendLeft6">{subcategory.name}</span>
                          </div>
                          <div className="brandDetail makeFlex spaceBetween alignCenter paddingTop8 paddingBottom8">
                            <span className="detailLabel font14 fontSemiBold grayText textUppercase">Category:</span>
                            <span className="detailValue font14 blackText appendLeft6">
                              {getCategoryName(subcategory)}
                            </span>
                          </div>
                          {subcategory.description && (
                            <div className="brandDetail makeFlex spaceBetween alignCenter paddingTop8 paddingBottom8">
                              <span className="detailLabel font14 fontSemiBold grayText textUppercase">Description:</span>
                              <span className="detailValue font14 blackText appendLeft6">
                                {subcategory.description.length > 30 
                                  ? `${subcategory.description.substring(0, 30)}...` 
                                  : subcategory.description}
                              </span>
                            </div>
                          )}
                          <div className="brandDetail makeFlex spaceBetween alignCenter paddingTop8 paddingBottom8">
                            <span className="detailLabel font14 fontSemiBold grayText textUppercase">Status:</span>
                            <span className={`detailValue font14 ${subcategory.deleted ? 'deleted' : (subcategory.isActive ? 'greenText' : 'inactive')} appendLeft6`}>
                              {subcategory.deleted ? 'Deleted' : (subcategory.isActive ? 'Active' : 'Inactive')}
                            </span>
                          </div>
                        </>
                      );
                    }}
                    renderActions={(subcategory) => (
                      <ActionButtons
                        onEdit={subcategory.deleted ? undefined : () => handleEdit(subcategory)}
                        onDelete={() => handleDelete(subcategory._id)}
                        onRevert={subcategory.deleted ? () => handleRevert(subcategory._id) : undefined}
                        loading={loading}
                        size="normal"
                        editText="✏️ Edit"
                        deleteText={subcategory.deleted ? "🗑️ Final Del" : "🗑️ Delete"}
                        revertText="🔄 Undelete"
                        editTitle="Edit Subcategory"
                        deleteTitle={subcategory.deleted ? "Permanently delete this subcategory" : "Mark subcategory as deleted"}
                        revertTitle="Restore this subcategory back to active"
                        editDisabled={subcategory.deleted}
                      />
                    )}
                    className="categoryCard"
                  />
                ))}
                {hasMoreCards && (
                  <div className="loadMoreContainer textCenter paddingAll20">
                    <button
                      onClick={handleLoadMoreCards}
                      className="btnPrimary"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="loadingSpinner">⏳</span>
                      ) : (
                        <span>Load More</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="brandsListTable">
                <div className="tableContainer">
                  <table className="brandsTable">
                    <thead>
                      <tr>
                        <th className="tableHeader">Image</th>
                        <th className="tableHeader">Subcategory ID</th>
                        <th className="tableHeader">Name</th>
                        <th className="tableHeader">Category</th>
                        <th className="tableHeader">Description</th>
                        <th className="tableHeader">Status</th>
                        <th className="tableHeader">Created</th>
                        <th className="tableHeader">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentSubcategories.map((subcategory) => (
                        <tr key={subcategory._id} className="tableRow">
                          <td className="tableCell">
                            <div className="tableLogo">
                              {subcategory.image ? (
                                <img
                                  src={subcategory.image}
                                  alt={subcategory.name}
                                  className="tableLogoImage"
                                />
                              ) : (
                                <div className="tableLogoPlaceholder" style={{ backgroundColor: generateEntityColor(subcategory._id, subcategory.name) }}>
                                  {subcategory.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="tableCell">
                            <span className="brandIdText">{subcategory.subcategoryId || 'N/A'}</span>
                          </td>
                          <td className="tableCell">
                            <span className="brandNameText">{subcategory.name}</span>
                          </td>
                          <td className="tableCell">
                            <span className="companyNameText">{getCategoryName(subcategory)}</span>
                          </td>
                          <td className="tableCell">
                            <span className="companyNameText" title={subcategory.description}>
                              {subcategory.description ? (subcategory.description.length > 30 ? `${subcategory.description.substring(0, 30)}...` : subcategory.description) : '-'}
                            </span>
                          </td>
                          <td className="tableCell">
                            <span className={`statusText ${subcategory.deleted ? 'deleted' : (subcategory.isActive ? 'active' : 'inactive')}`}>
                              {subcategory.deleted ? 'Deleted' : (subcategory.isActive ? 'Active' : 'Inactive')}
                            </span>
                          </td>
                          <td className="tableCell">
                            <span className="dateText">
                              {new Date(subcategory.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="tableCell">
                            <div className="tableActions makeFlex gap8">
                              <ActionButtons
                                onEdit={subcategory.deleted ? undefined : () => handleEdit(subcategory)}
                                onDelete={() => handleDelete(subcategory._id)}
                                onRevert={subcategory.deleted ? () => handleRevert(subcategory._id) : undefined}
                                loading={loading}
                                size="small"
                                editText="✏️"
                                deleteText="🗑️"
                                revertText="🔄 Revert Back"
                                editTitle="Edit Subcategory"
                                deleteTitle={subcategory.deleted ? "Final Del" : "Delete Subcategory"}
                                revertTitle="Restore this subcategory back to active"
                                editDisabled={subcategory.deleted}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    disabled={loading}
                    showGoToPage={true}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Popup */}
      <DeleteConfirmationPopup
        isVisible={deletePopup.isVisible}
        message={deletePopup.message}
        onConfirm={deletePopup.action === 'revert' ? handleRevertConfirm : handleDeleteConfirm}
        onCancel={deletePopup.action === 'revert' ? handleRevertCancel : handleDeleteCancel}
        confirmButtonText={deletePopup.action === 'revert' ? 'Restore Subcategory' : 'Confirm'}
        cancelButtonText="Cancel"
        isPermanentDelete={deletePopup.isPermanentDelete}
        action={deletePopup.action}
      />
    </div>
  );
};

export default SubcategoryManager;

