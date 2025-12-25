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

const SleeveTypeManager = () => {
  const [sleeveTypes, setSleeveTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);
  const initialFormData = {
    name: "",
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
    sleeveTypeId: null,
    message: "",
    isPermanentDelete: false,
    action: "delete" // "delete" or "revert"
  });
  
  // Refs for scroll and focus functionality
  const formRef = useRef(null);
  const sleeveTypeNameInputRef = useRef(null);
  
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

  // Validate sleeve type name for duplicates
  const validateSleeveTypeName = (name) => {
    if (!name || !name.trim()) {
      return { isValid: false, error: "Sleeve Type Name is required" };
    }
    
    // Check for duplicate names only against active, non-deleted sleeve types (excluding current sleeve type being edited)
    const existingSleeveType = sleeveTypes.find(sleeveType => 
      sleeveType.name.toLowerCase().trim() === name.toLowerCase().trim() && 
      sleeveType._id !== editingId &&
      sleeveType.isActive === true && // Only check against active sleeve types
      !sleeveType.deleted // Exclude deleted sleeve types
    );
    
    if (existingSleeveType) {
      return { isValid: false, error: "Sleeve type name already exists" };
    }
    
    return { isValid: true, error: "" };
  };

  // Validate and Add / Update Sleeve Type
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate sleeve type name
    const nameValidation = validateSleeveTypeName(formData.name);
    if (!nameValidation.isValid) {
      setError(nameValidation.error);
      return;
    }

    try {
      setLoading(true);
      setSuccess(""); // Clear any existing success message
      setError(""); // Clear any existing error message

      let sleeveTypeData;
      
      if (formData.image) {
        // Use FormData for file upload
        sleeveTypeData = new FormData();
        sleeveTypeData.append('name', formData.name.trim());
        sleeveTypeData.append('description', formData.description.trim() || '');
        sleeveTypeData.append('isActive', formData.isActive ? 'true' : 'false');
        sleeveTypeData.append('image', formData.image);
      } else {
        // Use JSON for better boolean handling
        sleeveTypeData = {
          name: formData.name.trim(),
          description: formData.description.trim() || '',
          isActive: formData.isActive
        };
      }

      if (editingId) {
        // Update sleeve type
        await api.put(`/api/sleeve-types/${editingId}`, sleeveTypeData);
        setSuccess(`✅ Sleeve Type "${formData.name.trim()}" has been updated successfully!`);
      } else {
        // Create sleeve type
        await api.post('/api/sleeve-types', sleeveTypeData);
        setSuccess(`✅ Sleeve Type "${formData.name.trim()}" has been created successfully!`);
      }

      // Refresh sleeve types list
      await fetchSleeveTypes();
      // Don't call resetForm() here - let AlertMessage handle the lifecycle
      
    } catch (err) {
      if (err.response?.data?.msg === 'Sleeve type name already exists') {
        setError("❌ Sleeve type name already exists. Please choose a different name.");
      } else {
        setError(`❌ Failed to ${editingId ? 'update' : 'create'} sleeve type. ${err.response?.data?.msg || 'Please try again.'}`);
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

  // Edit sleeve type
  const handleEdit = (sleeveType) => {
    setFormData({
      ...initialFormData,
      name: sleeveType.name || "",
      description: sleeveType.description || "",
      image: sleeveType.image || null, // Preserve existing image
      isActive: sleeveType.isActive !== undefined ? sleeveType.isActive : false
    });
    setEditingId(sleeveType._id || sleeveType.id);
    setError("");
    setSuccess("");
    
    // Scroll to form and focus on sleeve type name input
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
      if (sleeveTypeNameInputRef.current) {
        sleeveTypeNameInputRef.current.focus();
      }
    }, 100);
  };

  // Delete sleeve type
  const handleDelete = async (sleeveTypeId) => {
    // Find the sleeve type to check if it's already marked as deleted
    const sleeveType = sleeveTypes.find(st => st._id === sleeveTypeId);
    const isAlreadyDeleted = sleeveType?.deleted;
    
    let message;
    let isPermanentDelete = false;
    
    if (isAlreadyDeleted) {
      message = "This sleeve type is already marked as deleted. Click OK to permanently remove it from the database. This action cannot be undone.";
      isPermanentDelete = true;
    } else {
      message = "This will mark the sleeve type as inactive and add a deleted flag. Click OK to continue.";
      isPermanentDelete = false;
    }
    
    setDeletePopup({
      isVisible: true,
      sleeveTypeId,
      message,
      isPermanentDelete,
      action: "delete"
    });
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    const { sleeveTypeId, isPermanentDelete } = deletePopup;
    const sleeveType = sleeveTypes.find(st => st._id === sleeveTypeId);
    
    try {
      setLoading(true);
      setSuccess(""); // Clear any existing success message
      setError(""); // Clear any existing error message
      
      if (isPermanentDelete) {
        // Permanent deletion
        await api.delete(`/api/sleeve-types/${sleeveTypeId}/hard`);
        setSuccess(`🗑️ Sleeve Type "${sleeveType.name}" has been permanently deleted from the database.`);
      } else {
        // Soft delete - mark as inactive and add deleted flag
        await api.delete(`/api/sleeve-types/${sleeveTypeId}`);
        setSuccess(`⏸️ Sleeve Type "${sleeveType.name}" has been marked as deleted and inactive.`);
      }
      
      await fetchSleeveTypes();
    } catch (err) {
      const action = isPermanentDelete ? "permanently delete" : "mark as deleted";
      setError(`❌ Failed to ${action} sleeve type "${sleeveType.name}". ${err.response?.data?.msg || 'Please try again.'}`);
    } finally {
      setLoading(false);
      setDeletePopup({
        isVisible: false,
        sleeveTypeId: null,
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
      sleeveTypeId: null,
      message: "",
      isPermanentDelete: false,
      action: "delete"
    });
  };

  // Revert deleted sleeve type
  const handleRevert = async (sleeveTypeId) => {
    const sleeveType = sleeveTypes.find(st => st._id === sleeveTypeId);
    
    if (!sleeveType) {
      setError("Sleeve type not found");
      return;
    }

    if (!sleeveType.deleted) {
      setError("This sleeve type is not deleted");
      return;
    }

    setDeletePopup({
      isVisible: true,
      sleeveTypeId,
      message: `Are you sure you want to restore the sleeve type "${sleeveType.name}"? This will make it active again.`,
      isPermanentDelete: false,
      action: "revert"
    });
  };

  // Handle revert confirmation
  const handleRevertConfirm = async () => {
    const { sleeveTypeId } = deletePopup;
    const sleeveType = sleeveTypes.find(st => st._id === sleeveTypeId);
    
    try {
      setLoading(true);
      setSuccess("");
      setError("");

      // Check if there's already an active or inactive sleeve type with the same name
      const existingSleeveType = sleeveTypes.find(st => 
        st._id !== sleeveTypeId && // Exclude current sleeve type being reverted
        st.name.toLowerCase().trim() === sleeveType.name.toLowerCase().trim() && // Same name
        !st.deleted // Not deleted (active or inactive)
      );

      if (existingSleeveType) {
        const status = existingSleeveType.isActive ? 'Active' : 'Inactive';
        const suggestion = existingSleeveType.isActive ? 
          `Consider deleting the active sleeve type "${existingSleeveType.name}" first, or use a different name for the restored sleeve type.` :
          `Consider deleting the inactive sleeve type "${existingSleeveType.name}" first, or use a different name for the restored sleeve type.`;
        
        setError(`❌ Cannot restore sleeve type "${sleeveType.name}". A ${status.toLowerCase()} sleeve type with this name already exists. ${suggestion}`);
        setLoading(false);
        setDeletePopup({
          isVisible: false,
          sleeveTypeId: null,
          message: "",
          isPermanentDelete: false,
          action: "delete"
        });
        return;
      }

      // Revert the sleeve type by setting deleted to false and isActive to true
      await api.put(`/api/sleeve-types/${sleeveTypeId}`, {
        name: sleeveType.name,
        description: sleeveType.description,
        isActive: true,
        deleted: false
      });

      setSuccess(`✅ Sleeve Type "${sleeveType.name}" has been restored and is now active!`);
      await fetchSleeveTypes();
    } catch (err) {
      setError(`❌ Failed to restore sleeve type "${sleeveType.name}". ${err.response?.data?.msg || 'Please try again.'}`);
    } finally {
      setLoading(false);
      setDeletePopup({
        isVisible: false,
        sleeveTypeId: null,
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
      sleeveTypeId: null,
      message: "",
      isPermanentDelete: false,
      action: "delete"
    });
  };

  // Fetch sleeve types from backend
  const fetchSleeveTypes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/sleeve-types?showInactive=true&includeDeleted=true');
      
      // Process sleeve types to ensure proper image URLs
      const processedSleeveTypes = response.data.map(sleeveType => {
        let imageUrl = sleeveType.image;
        
        // If image is a relative path, construct full URL
        if (imageUrl && !imageUrl.startsWith('http')) {
          // Check if it's a local upload path
          if (imageUrl.startsWith('/uploads/')) {
            imageUrl = `http://localhost:8080${imageUrl}`;
          }
        }
        
        return {
          ...sleeveType,
          image: imageUrl
        };
      });
      
      setSleeveTypes(processedSleeveTypes);
      setError("");
    } catch (err) {
      setError("Failed to fetch sleeve types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSleeveTypes();
  }, []);

  // Filter sleeve types based on search query and status
  const filteredSleeveTypes = useMemo(() => {
    let filtered = sleeveTypes;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(sleeveType => 
        sleeveType.name.toLowerCase().includes(query) ||
        (sleeveType.description && sleeveType.description.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    filtered = filterEntitiesByStatus(filtered, statusFilter);
    
    return filtered;
  }, [sleeveTypes, searchQuery, statusFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredSleeveTypes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSleeveTypes = filteredSleeveTypes.slice(startIndex, endIndex);

  // Card lazy loading logic
  useEffect(() => {
    if (viewMode === 'card') {
      const initialCards = filteredSleeveTypes.slice(0, 12);
      setDisplayedCards(initialCards);
      setHasMoreCards(filteredSleeveTypes.length > 12);
      setCurrentPage(1);
    }
  }, [viewMode, filteredSleeveTypes]);

  // Reset pagination when search query changes
  const resetPaginationForSearch = useCallback(() => {
    setCurrentPage(1);
    if (viewMode === 'card') {
      const initialCards = filteredSleeveTypes.slice(0, 12);
      setDisplayedCards(initialCards);
      setHasMoreCards(filteredSleeveTypes.length > 12);
    }
  }, [viewMode, filteredSleeveTypes.length]);

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
      const nextCards = filteredSleeveTypes.slice(currentCardCount, currentCardCount + 12);
      
      if (nextCards.length > 0) {
        setHasMoreCards(currentCardCount + nextCards.length < filteredSleeveTypes.length);
        return [...prevCards, ...nextCards];
      } else {
        setHasMoreCards(false);
        return prevCards;
      }
    });
  }, [filteredSleeveTypes]);

  // Reset pagination when view mode changes
  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    setCurrentPage(1);
    if (mode === 'card') {
      const initialCards = filteredSleeveTypes.slice(0, 12);
      setDisplayedCards(initialCards);
      setHasMoreCards(filteredSleeveTypes.length > 12);
    }
  }, [filteredSleeveTypes.length]);

  const handleCancel = () => {
    resetForm();
  };

  return (
    <div className="paddingAll20">
      {/* Header */}
      <PageHeader
        title="Sleeve Type Management"
        subtitle="Manage your product sleeve types and classifications"
        isEditing={!!editingId}
        editText="Edit Sleeve Type"
        createText="Add New Sleeve Type"
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
                ref={sleeveTypeNameInputRef}
                type="text"
                name="name"
                label="Sleeve Type Name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter Sleeve Type Name (e.g., Short Sleeve, Long Sleeve)"
                required={true}
              />
            </div>
          </div>
          
          <div className="makeFlex row gap10">
            <div className="fullWidth">
              <FormField
                type="file"
                name="image"
                label="Sleeve Type Image"
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
                    alt="Current sleeve type image" 
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
                placeholder="Enter Sleeve Type Description"
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
              <p className="negativeMarginTop10">Check this box to keep the sleeve type active, uncheck to mark as inactive</p>
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
                <span>{editingId ? "Update Sleeve Type" : "Add Sleeve Type"}</span>
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
                Add Another Sleeve Type
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Sleeve Types List */}
      <div className="brandsListContainer paddingAll32">
        <div className="listHeader makeFlex spaceBetween end appendBottom24">
          <div className="leftSection">
            <h2 className="listTitle font30 fontBold blackText appendBottom16">Sleeve Types ({filteredSleeveTypes.length})</h2>
            <StatusFilter
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              counts={calculateStandardStatusCounts(sleeveTypes)}
              disabled={loading}
            />
          </div>
          <div className="rightSection makeFlex end gap10">
            <SearchField
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sleeve types..."
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

        {filteredSleeveTypes.length === 0 && !loading ? (
          <div className="emptyState textCenter paddingAll60">
            <div className="emptyIcon appendBottom16">👕</div>
            <h3 className="font22 fontSemiBold grayText appendBottom8">No Sleeve Types Found</h3>
            <p className="font16 grayText">Start by adding your first sleeve type above</p>
          </div>
        ) : (
          <>
            {/* Card View */}
            {viewMode === 'card' && (
              <div className="brandsGrid">
                {displayedCards.map((sleeveType) => (
                  <EntityCard
                    key={sleeveType._id || sleeveType.id}
                    entity={sleeveType}
                    logoField="image"
                    nameField="name"
                    idField="_id"
                    onEdit={sleeveType.deleted ? undefined : handleEdit}
                    onDelete={handleDelete}
                    onRevert={sleeveType.deleted ? () => handleRevert(sleeveType._id || sleeveType.id) : undefined}
                    loading={loading}
                    imagePlaceholderColor={generateEntityColor(sleeveType._id || sleeveType.id, sleeveType.name)}
                    renderHeader={(sleeveType) => (
                      <EntityCardHeader
                        entity={sleeveType}
                        imageField="image"
                        titleField="name"
                        dateField="createdAt"
                        generateColor={generateEntityColor}
                      />
                    )}
                    renderDetails={(sleeveType) => {
                      return (
                        <>
                          <div className="brandDetail makeFlex spaceBetween alignCenter paddingTop8 paddingBottom8">
                            <span className="detailLabel font14 fontSemiBold grayText textUppercase">Sleeve Type ID:</span>
                            <span className="detailValue font14 blackText appendLeft6">{sleeveType._id || 'N/A'}</span>
                          </div>
                          <div className="brandDetail makeFlex spaceBetween alignCenter paddingTop8 paddingBottom8">
                            <span className="detailLabel font14 fontSemiBold grayText textUppercase">Name:</span>
                            <span className="detailValue font14 blackText appendLeft6">{sleeveType.name}</span>
                          </div>
                          {sleeveType.description && (
                            <div className="brandDetail makeFlex spaceBetween alignCenter paddingTop8 paddingBottom8">
                              <span className="detailLabel font14 fontSemiBold grayText textUppercase">Description:</span>
                              <span className="detailValue font14 blackText appendLeft6">{sleeveType.description}</span>
                            </div>
                          )}
                          <div className="brandDetail makeFlex spaceBetween alignCenter paddingTop8 paddingBottom8">
                            <span className="detailLabel font14 fontSemiBold grayText textUppercase">Status:</span>
                            <span className={`detailValue font14 ${sleeveType.deleted ? 'deleted' : (sleeveType.isActive ? 'greenText' : 'inactive')} appendLeft6`}>
                              {sleeveType.deleted ? 'Deleted' : (sleeveType.isActive ? 'Active' : 'Inactive')}
                            </span>
                          </div>
                        </>
                      );
                    }}
                    renderActions={(sleeveType) => (
                      <ActionButtons
                        onEdit={sleeveType.deleted ? undefined : () => handleEdit(sleeveType)}
                        onDelete={() => handleDelete(sleeveType._id || sleeveType.id)}
                        onRevert={sleeveType.deleted ? () => handleRevert(sleeveType._id || sleeveType.id) : undefined}
                        loading={loading}
                        size="normal"
                        editText="✏️ Edit"
                        deleteText={sleeveType.deleted ? "🗑️ Final Del" : "🗑️ Delete"}
                        revertText="🔄 Undelete"
                        editTitle="Edit Sleeve Type"
                        deleteTitle={sleeveType.deleted ? "Final Del" : "Delete Sleeve Type"}
                        revertTitle="Restore Sleeve Type"
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
                        <th className="tableHeader">Description</th>
                        <th className="tableHeader">Status</th>
                        <th className="tableHeader">Created</th>
                        <th className="tableHeader">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentSleeveTypes.map((sleeveType) => (
                        <tr key={sleeveType._id || sleeveType.id} className="tableRow">
                          <td className="tableCell">
                            {sleeveType.image ? (
                              <img
                                src={sleeveType.image}
                                alt={sleeveType.name}
                                className="tableImage"
                                style={{ 
                                  width: '40px', 
                                  height: '40px', 
                                  objectFit: 'cover',
                                  borderRadius: '4px'
                                }}
                                onError={(e) => {
                                  console.error('Image failed to load:', sleeveType.image);
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div 
                                className="tableImagePlaceholder"
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  backgroundColor: generateEntityColor(sleeveType._id || sleeveType.id, sleeveType.name),
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}
                              >
                                {sleeveType.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </td>
                          <td className="tableCell">
                            <span className="brandNameText">{sleeveType.name}</span>
                          </td>
                          <td className="tableCell">
                            <span className="addressText" title={sleeveType.description}>
                              {sleeveType.description ? (sleeveType.description.length > 30 ? `${sleeveType.description.substring(0, 30)}...` : sleeveType.description) : '-'}
                            </span>
                          </td>
                          <td className="tableCell">
                            <span className={`statusText ${sleeveType.deleted ? 'deleted' : (sleeveType.isActive ? 'active' : 'inactive')}`}>
                              {sleeveType.deleted ? 'Deleted' : (sleeveType.isActive ? 'Active' : 'Inactive')}
                            </span>
                          </td>
                          <td className="tableCell">
                            <span className="dateText">
                              {new Date(sleeveType.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="tableCell">
                            <div className="tableActions makeFlex gap8">
                              <ActionButtons
                                onEdit={sleeveType.deleted ? undefined : () => handleEdit(sleeveType)}
                                onDelete={() => handleDelete(sleeveType._id || sleeveType.id)}
                                onRevert={sleeveType.deleted ? () => handleRevert(sleeveType._id || sleeveType.id) : undefined}
                                loading={loading}
                                size="small"
                                editText="✏️"
                                deleteText={sleeveType.deleted ? "🗑️" : "🗑️"}
                                revertText="🔄"
                                editTitle="Edit Sleeve Type"
                                deleteTitle={sleeveType.deleted ? "Final Del" : "Delete Sleeve Type"}
                                revertTitle="Restore Sleeve Type"
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

export default SleeveTypeManager;
