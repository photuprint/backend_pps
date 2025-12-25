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
  SearchField,
  StatusFilter,
  DeleteConfirmationPopup,
  calculateStandardStatusCounts,
  filterEntitiesByStatus,
  generateEntityColor 
} from '../common';

const SizeManager = () => {
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);
  const initialFormData = {
    name: "",
    initial: "",
    description: "",
    image: null,
    isActive: false
  };

  const [formData, setFormData] = useState(initialFormData);
  const [searchQuery, setSearchQuery] = useState(""); // Search query state
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive', 'deleted'
  
  // Delete confirmation popup state
  const [deletePopup, setDeletePopup] = useState({
    isVisible: false,
    sizeId: null,
    message: "",
    isPermanentDelete: false,
    action: "delete" // "delete" or "revert"
  });
  
  // Refs for scroll and focus functionality
  const formRef = useRef(null);
  const sizeNameInputRef = useRef(null);
  
  // View mode and pagination states
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // For list view
  const [hasMoreCards, setHasMoreCards] = useState(true);
  const [displayedCards, setDisplayedCards] = useState([]);

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

  // Validate size name for duplicates
  const validateSizeName = (name) => {
    if (!name || !name.trim()) {
      return { isValid: false, error: "Size Name is required" };
    }
    
    // Check for duplicate names only against active, non-deleted sizes (excluding current size being edited)
    const existingSize = sizes.find(size => 
      size.name.toLowerCase().trim() === name.toLowerCase().trim() && 
      size._id !== editingId &&
      size.isActive === true && // Only check against active sizes
      !size.deleted // Exclude deleted sizes
    );
    
    if (existingSize) {
      return { isValid: false, error: "Size name already exists" };
    }
    
    return { isValid: true, error: "" };
  };

  // Validate size initial for duplicates (make it optional)
  const validateSizeInitial = (initial) => {
    // Initial is optional, so if it's empty, it's valid
    if (!initial || !initial.trim()) {
      return { isValid: true, error: "" }; // Allow empty initial
    }
    
    // Check for duplicate initials only against active, non-deleted sizes (excluding current size being edited)
    const existingSize = sizes.find(size => 
      size.initial && // Check if initial exists
      typeof size.initial === 'string' && // Ensure it's a string
      size.initial.toLowerCase().trim() === initial.toLowerCase().trim() && 
      size._id !== editingId &&
      size.isActive === true && // Only check against active sizes
      !size.deleted // Exclude deleted sizes
    );
    
    if (existingSize) {
      return { isValid: false, error: "Size initial already exists" };
    }
    
    return { isValid: true, error: "" };
  };

  // Validate and Add / Update Size
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate size name
    const nameValidation = validateSizeName(formData.name);
    if (!nameValidation.isValid) {
      setError(nameValidation.error);
      return;
    }

    // Validate size initial
    const initialValidation = validateSizeInitial(formData.initial);
    if (!initialValidation.isValid) {
      setError(initialValidation.error);
      return;
    }

    try {
      setLoading(true);
      setSuccess(""); // Clear any existing success message
      setError(""); // Clear any existing error message

      let sizeData;
      
      // Always include initial field - preserve the value as entered
      const initialValue = formData.initial ? formData.initial.trim() : '';
      console.log('Form data initial value:', formData.initial, 'Processed:', initialValue);
      
      if (formData.image) {
        // Use FormData for file upload
        sizeData = new FormData();
        sizeData.append('name', formData.name.trim());
        sizeData.append('initial', initialValue); // Send as-is (empty string if empty)
        sizeData.append('description', formData.description ? formData.description.trim() : '');
        sizeData.append('isActive', formData.isActive ? 'true' : 'false');
        sizeData.append('image', formData.image);
        console.log('Sending FormData with initial:', initialValue);
      } else {
        // Use JSON for better boolean handling
        sizeData = {
          name: formData.name.trim(),
          initial: initialValue || null, // Send null if empty for JSON
          description: formData.description ? formData.description.trim() : null,
          isActive: formData.isActive
        };
        console.log('Sending JSON with initial:', sizeData.initial);
      }

      if (editingId) {
        // Update size
        await api.put(`/sizes/${editingId}`, sizeData);
        setSuccess(`✅ Size "${formData.name.trim()}" has been updated successfully!`);
        resetForm(); // Clear form after successful update
      } else {
        // Create size
        await api.post('/sizes', sizeData);
        setSuccess(`✅ Size "${formData.name.trim()}" has been created successfully!`);
        // Don't clear form after creation - allow "Add Another" button
      }

      // Refresh sizes list
      await fetchSizes();
      // Don't call resetForm() here - let AlertMessage handle the lifecycle
      
    } catch (err) {
      if (err.response?.data?.msg === 'Size name already exists') {
        setError("❌ Size name already exists. Please choose a different name.");
      } else if (err.response?.data?.msg === 'Size initial already exists') {
        setError("❌ Size initial already exists. Please choose a different initial.");
      } else {
        setError(`❌ Failed to ${editingId ? 'update' : 'create'} size. ${err.response?.data?.msg || 'Please try again.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setError("");
    // Don't clear success message here - let AlertMessage handle it
    // setSuccess("");
  };

  // Clear form after successful operations
  const clearForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setError("");
    setSuccess("");
  };

  // Edit size
  const handleEdit = (size) => {
    setFormData({
      ...initialFormData,
      name: size.name || "",
      initial: size.initial || "",
      description: size.description || "",
      image: size.image || null, // Preserve existing image
      isActive: size.isActive !== undefined ? size.isActive : false
    });
    setEditingId(size._id || size.id);
    setError("");
    setSuccess("");
    
    // Scroll to form and focus on size name input
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
      if (sizeNameInputRef.current) {
        sizeNameInputRef.current.focus();
      }
    }, 100);
  };

  // Delete size
  const handleDelete = async (sizeId) => {
    // Find the size to check if it's already marked as deleted
    const size = sizes.find(s => s._id === sizeId);
    const isAlreadyDeleted = size?.deleted;
    
    let message;
    let isPermanentDelete = false;
    
    if (isAlreadyDeleted) {
      message = "This size is already marked as deleted. Click OK to permanently remove it from the database. This action cannot be undone.";
      isPermanentDelete = true;
    } else {
      message = "This will mark the size as inactive and add a deleted flag. Click OK to continue.";
      isPermanentDelete = false;
    }
    
    setDeletePopup({
      isVisible: true,
      sizeId,
      message,
      isPermanentDelete,
      action: "delete"
    });
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    const { sizeId, isPermanentDelete } = deletePopup;
    const size = sizes.find(s => s._id === sizeId);
    
    try {
      setLoading(true);
      setSuccess(""); // Clear any existing success message
      setError(""); // Clear any existing error message
      
      if (isPermanentDelete) {
        // Permanent deletion
        await api.delete(`/sizes/${sizeId}/hard`);
        setSuccess(`🗑️ Size "${size.name}" has been permanently deleted from the database.`);
      } else {
        // Soft delete - mark as inactive and add deleted flag
        await api.delete(`/sizes/${sizeId}`);
        setSuccess(`⏸️ Size "${size.name}" has been marked as deleted and inactive.`);
      }
      
      await fetchSizes();
    } catch (err) {
      const action = isPermanentDelete ? "permanently delete" : "mark as deleted";
      setError(`❌ Failed to ${action} size "${size.name}". ${err.response?.data?.msg || 'Please try again.'}`);
    } finally {
      setLoading(false);
      setDeletePopup({
        isVisible: false,
        sizeId: null,
        message: "",
        isPermanentDelete: false,
        action: "delete"
      });
    }
  };

  // Handle delete cancellation
  const handleDeleteCancel = () => {
    setDeletePopup({
      isVisible: false,
      sizeId: null,
      message: "",
      isPermanentDelete: false,
      action: "delete"
    });
  };

  // Revert deleted size
  const handleRevert = async (sizeId) => {
    const size = sizes.find(s => s._id === sizeId);
    
    if (!size) {
      setError("Size not found");
      return;
    }

    if (!size.deleted) {
      setError("This size is not deleted");
      return;
    }

    setDeletePopup({
      isVisible: true,
      sizeId,
      message: `Are you sure you want to restore the size "${size.name}"? This will make it active again.`,
      isPermanentDelete: false,
      action: "revert"
    });
  };

  // Handle revert confirmation
  const handleRevertConfirm = async () => {
    const { sizeId } = deletePopup;
    const size = sizes.find(s => s._id === sizeId);
    
    try {
      setLoading(true);
      setSuccess("");
      setError("");

      // Check if there's already an active or inactive size with the same name or initial
      const existingSize = sizes.find(s => 
        s._id !== sizeId && // Exclude current size being reverted
        ((s.name && s.name.toLowerCase().trim() === size.name.toLowerCase().trim()) || 
         (s.initial && size.initial && s.initial.toLowerCase().trim() === size.initial.toLowerCase().trim())) && // Same name or initial
        !s.deleted // Not deleted (active or inactive)
      );

      if (existingSize) {
        const status = existingSize.isActive ? 'Active' : 'Inactive';
        const conflict = (existingSize.name && existingSize.name.toLowerCase().trim() === size.name.toLowerCase().trim()) ? 'name' : 'initial';
        const suggestion = existingSize.isActive ? 
          `Consider deleting the active size "${existingSize.name}" first, or use a different ${conflict} for the restored size.` :
          `Consider deleting the inactive size "${existingSize.name}" first, or use a different ${conflict} for the restored size.`;
        
        setError(`❌ Cannot restore size "${size.name}". A ${status.toLowerCase()} size with this ${conflict} already exists. ${suggestion}`);
        setLoading(false);
        setDeletePopup({
          isVisible: false,
          sizeId: null,
          message: "",
          isPermanentDelete: false,
          action: "delete"
        });
        return;
      }

      // Revert the size by setting deleted to false and isActive to true
      await api.put(`/sizes/${sizeId}`, {
        name: size.name,
        initial: size.initial,
        description: size.description,
        isActive: true,
        deleted: false
      });

      setSuccess(`✅ Size "${size.name}" has been restored and is now active!`);
      await fetchSizes();
    } catch (err) {
      setError(`❌ Failed to restore size "${size.name}". ${err.response?.data?.msg || 'Please try again.'}`);
    } finally {
      setLoading(false);
      setDeletePopup({
        isVisible: false,
        sizeId: null,
        message: "",
        isPermanentDelete: false,
        action: "delete"
      });
    }
  };

  // Handle revert cancellation
  const handleRevertCancel = () => {
    setDeletePopup({
      isVisible: false,
      sizeId: null,
      message: "",
      isPermanentDelete: false,
      action: "delete"
    });
  };

  // Fetch sizes from backend
  const fetchSizes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/sizes?includeDeleted=true');
      
      // Process sizes to ensure proper image URLs
      const processedSizes = response.data.map(size => {
        let imageUrl = size.image;
        
        // If image is a relative path, construct full URL
        if (imageUrl && !imageUrl.startsWith('http')) {
          // Check if it's a local upload path
          if (imageUrl.startsWith('/uploads/')) {
            imageUrl = `http://localhost:8080${imageUrl}`;
          }
        }
        
        return {
          ...size,
          image: imageUrl
        };
      });
      
      setSizes(processedSizes);
      setError("");
    } catch (err) {
      setError("Failed to fetch sizes");
      console.error('Error fetching sizes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSizes();
  }, []);

  // Filter sizes based on search query and status
  const filteredSizes = useMemo(() => {
    let filtered = sizes;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(size => 
        size.name.toLowerCase().includes(query) ||
        (size.initial && size.initial.toLowerCase().includes(query)) ||
        (size.description && size.description.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    filtered = filterEntitiesByStatus(filtered, statusFilter);
    
    return filtered;
  }, [sizes, searchQuery, statusFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredSizes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSizes = filteredSizes.slice(startIndex, endIndex);

  // Card lazy loading logic
  useEffect(() => {
    if (viewMode === 'card') {
      const initialCards = filteredSizes.slice(0, 12);
      setDisplayedCards(initialCards);
      setHasMoreCards(filteredSizes.length > 12);
      setCurrentPage(1);
    }
  }, [viewMode, filteredSizes]);

  // Reset pagination when search query changes
  const resetPaginationForSearch = useCallback(() => {
    setCurrentPage(1);
    if (viewMode === 'card') {
      const initialCards = filteredSizes.slice(0, 12);
      setDisplayedCards(initialCards);
      setHasMoreCards(filteredSizes.length > 12);
    }
  }, [viewMode, filteredSizes.length]);

  useEffect(() => {
    resetPaginationForSearch();
  }, [searchQuery, resetPaginationForSearch]);

  // Handle page change for list view
  const handlePageChange = useCallback((pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Handle lazy loading for card view
  const handleLoadMoreCards = useCallback(() => {
    setDisplayedCards(prevCards => {
      const currentCardCount = prevCards.length;
      const nextCards = filteredSizes.slice(currentCardCount, currentCardCount + 12);
      
      if (nextCards.length > 0) {
        setHasMoreCards(currentCardCount + nextCards.length < filteredSizes.length);
        return [...prevCards, ...nextCards];
      } else {
        setHasMoreCards(false);
        return prevCards;
      }
    });
  }, [filteredSizes]);

  // Reset pagination when view mode changes
  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    setCurrentPage(1);
    if (mode === 'card') {
      const initialCards = filteredSizes.slice(0, 12);
      setDisplayedCards(initialCards);
      setHasMoreCards(filteredSizes.length > 12);
    }
  }, [filteredSizes.length]);

  const handleCancel = () => {
    resetForm();
  };

  return (
    <div className="paddingAll20">
      {/* Header */}
      <PageHeader
        title="Size Management"
        subtitle="Manage your product sizes and classifications"
        isEditing={!!editingId}
        editText="Edit Size"
        createText="Add New Size"
      />

      {/* Success/Error Messages */}
      <AlertMessage
        type="success"
        message={success}
        onClose={() => setSuccess("")}
        autoClose={true}
      />
      
      <AlertMessage
        type="error"
        message={error}
        onClose={() => setError("")}
        autoClose={true}
      />

      {/* Form */}
      <div className="brandFormContainer paddingAll32 appendBottom30" ref={formRef}>
        <form onSubmit={handleSubmit} className="brandForm">
          <div className="makeFlex row gap10">
            <div className="fullWidth">
              <FormField
                ref={sizeNameInputRef}
                type="text"
                name="name"
                label="Size Name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter Size Name (e.g., Small, Medium, Large)"
                required={true}
              />
            </div>
          </div>
          
          <div className="makeFlex row gap10">
            <div className="fullWidth">
              <FormField
                type="text"
                name="initial"
                label="Size Initial"
                value={formData.initial}
                onChange={handleChange}
                placeholder="Enter Size Initial (e.g., S, M, L) - Optional"
                required={false}
                maxLength={3}
              />
            </div>
          </div>
          
          <div className="makeFlex row gap10">
            <div className="fullWidth">
              <FormField
                type="file"
                name="image"
                label="Size Image"
                onChange={handleChange}
                accept="image/*"
                info="Supported formats: JPG, PNG, GIF (Max size: 5MB)"
              />
              {/* Show current image if editing */}
              {editingId && formData.image && typeof formData.image === 'string' && (
                <div className="currentImageInfo paddingTop8">
                  <p className="font12 grayText">Current image:</p>
                  <img 
                    src={formData.image} 
                    alt="Current size image" 
                    className="currentImagePreview"
                    style={{ 
                      maxWidth: '100px', 
                      maxHeight: '100px', 
                      objectFit: 'cover',
                      borderRadius: '4px',
                      marginTop: '4px'
                    }}
                    onError={(e) => {
                      console.error('Current image failed to load:', formData.image);
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
                placeholder="Enter Size Description"
                rows={3}
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
              <p className="negativeMarginTop10">Check this box to keep the size active, uncheck to mark as inactive</p>
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
                <span>{editingId ? "Update Size" : "Add Size"}</span>
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
            
            {!editingId && success && (
              <button
                type="button"
                onClick={clearForm}
                className="btnSecondary"
              >
                Add Another Size
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Sizes List */}
      <div className="brandsListContainer paddingAll32">
        <div className="listHeader makeFlex spaceBetween end appendBottom24">
          <div className="leftSection">
            <h2 className="listTitle font30 fontBold blackText appendBottom16">Sizes ({filteredSizes.length})</h2>
            <StatusFilter
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              counts={calculateStandardStatusCounts(sizes)}
              disabled={loading}
            />
          </div>
          <div className="rightSection makeFlex end gap10">
            <SearchField
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sizes..."
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

        {filteredSizes.length === 0 && !loading ? (
          <div className="emptyState textCenter paddingAll60">
            <div className="emptyIcon appendBottom16">📏</div>
            <h3 className="font22 fontSemiBold grayText appendBottom8">No Sizes Found</h3>
            <p className="font16 grayText">Start by adding your first size above</p>
          </div>
        ) : (
          <>
            {/* Card View */}
            {viewMode === 'card' && (
              <div className="brandsGrid">
                {displayedCards.map((size) => (
                  <EntityCard
                    key={size._id || size.id}
                    entity={size}
                    logoField="image"
                    nameField="name"
                    idField="_id"
                    onEdit={size.deleted ? undefined : handleEdit}
                    onDelete={handleDelete}
                    onRevert={size.deleted ? () => handleRevert(size._id || size.id) : undefined}
                    loading={loading}
                    imagePlaceholderColor={generateEntityColor(size._id || size.id, size.name)}
                    renderHeader={(size) => (
                      <EntityCardHeader
                        entity={size}
                        imageField="image"
                        titleField="name"
                        dateField="createdAt"
                        generateColor={generateEntityColor}
                      />
                    )}
                    renderDetails={(size) => {
                      return (
                        <>
                          <div className="brandDetail makeFlex spaceBetween alignCenter paddingTop8 paddingBottom8">
                            <span className="detailLabel font14 fontSemiBold grayText textUppercase">Size ID:</span>
                            <span className="detailValue font14 blackText appendLeft6">{size._id || 'N/A'}</span>
                          </div>
                          <div className="brandDetail makeFlex spaceBetween alignCenter paddingTop8 paddingBottom8">
                            <span className="detailLabel font14 fontSemiBold grayText textUppercase">Name:</span>
                            <span className="detailValue font14 blackText appendLeft6">{size.name}</span>
                          </div>
                          <div className="brandDetail makeFlex spaceBetween alignCenter paddingTop8 paddingBottom8">
                            <span className="detailLabel font14 fontSemiBold grayText textUppercase">Initial:</span>
                            <span className="detailValue font14 blackText appendLeft6">{size.initial || '-'}</span>
                          </div>
                          {size.description && (
                            <div className="brandDetail makeFlex spaceBetween alignCenter paddingTop8 paddingBottom8">
                              <span className="detailLabel font14 fontSemiBold grayText textUppercase">Description:</span>
                              <span className="detailValue font14 blackText appendLeft6">{size.description}</span>
                            </div>
                          )}
                          <div className="brandDetail makeFlex spaceBetween alignCenter paddingTop8 paddingBottom8">
                            <span className="detailLabel font14 fontSemiBold grayText textUppercase">Status:</span>
                            <span className={`detailValue font14 ${size.deleted ? 'deleted' : (size.isActive ? 'greenText' : 'inactive')} appendLeft6`}>
                              {size.deleted ? 'Deleted' : (size.isActive ? 'Active' : 'Inactive')}
                            </span>
                          </div>
                        </>
                      );
                    }}
                    renderActions={(size) => (
                      <ActionButtons
                        onEdit={size.deleted ? undefined : () => handleEdit(size)}
                        onDelete={() => handleDelete(size._id || size.id)}
                        onRevert={size.deleted ? () => handleRevert(size._id || size.id) : undefined}
                        loading={loading}
                        size="normal"
                        editText="✏️ Edit"
                        deleteText={size.deleted ? "🗑️ Final Del" : "🗑️ Delete"}
                        revertText="🔄 Undelete"
                        editTitle="Edit Size"
                        deleteTitle={size.deleted ? "Final Del" : "Delete Size"}
                        revertTitle="Restore Size"
                      />
                    )}
                    className="brandCard"
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
                        <th className="tableHeader">Name</th>
                        <th className="tableHeader">Initial</th>
                        <th className="tableHeader">Description</th>
                        <th className="tableHeader">Status</th>
                        <th className="tableHeader">Created</th>
                        <th className="tableHeader">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentSizes.map((size) => (
                        <tr key={size._id || size.id} className="tableRow">
                          <td className="tableCell">
                            {size.image ? (
                              <img
                                src={size.image}
                                alt={size.name}
                                className="tableImage"
                                style={{ 
                                  width: '40px', 
                                  height: '40px', 
                                  objectFit: 'cover',
                                  borderRadius: '4px'
                                }}
                                onError={(e) => {
                                  console.error('Image failed to load:', size.image);
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div 
                                className="tableImagePlaceholder"
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  backgroundColor: generateEntityColor(size._id || size.id, size.name),
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}
                              >
                                {size.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </td>
                          <td className="tableCell">
                            <span className="brandNameText">{size.name}</span>
                          </td>
                          <td className="tableCell">
                            <span className="brandNameText">{size.initial || '-'}</span>
                          </td>
                          <td className="tableCell">
                            <span className="addressText" title={size.description}>
                              {size.description ? (size.description.length > 30 ? `${size.description.substring(0, 30)}...` : size.description) : '-'}
                            </span>
                          </td>
                          <td className="tableCell">
                            <span className={`statusText ${size.deleted ? 'deleted' : (size.isActive ? 'active' : 'inactive')}`}>
                              {size.deleted ? 'Deleted' : (size.isActive ? 'Active' : 'Inactive')}
                            </span>
                          </td>
                          <td className="tableCell">
                            <span className="dateText">
                              {new Date(size.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="tableCell">
                            <div className="tableActions makeFlex gap8">
                              <ActionButtons
                                onEdit={size.deleted ? undefined : () => handleEdit(size)}
                                onDelete={() => handleDelete(size._id || size.id)}
                                onRevert={size.deleted ? () => handleRevert(size._id || size.id) : undefined}
                                loading={loading}
                                size="small"
                                editText="✏️"
                                deleteText={size.deleted ? "🗑️" : "🗑️"}
                                revertText="🔄"
                                editTitle="Edit Size"
                                deleteTitle={size.deleted ? "Final Del" : "Delete Size"}
                                revertTitle="Restore Size"
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
        onConfirm={deletePopup.action === "delete" ? handleDeleteConfirm : handleRevertConfirm}
        onCancel={deletePopup.action === "delete" ? handleDeleteCancel : handleRevertCancel}
        action={deletePopup.action}
        isPermanentDelete={deletePopup.isPermanentDelete}
      />
    </div>
  );
};

export default SizeManager;
