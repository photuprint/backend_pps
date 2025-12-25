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

const MaterialManager = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);
  const initialFormData = {
    type: "",
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
    materialId: null,
    message: "",
    isPermanentDelete: false,
    action: "delete" // "delete" or "revert"
  });
  
  // Refs for scroll and focus functionality
  const formRef = useRef(null);
  const materialNameInputRef = useRef(null);
  
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

  // Validate material name for duplicates
  const validateMaterialName = (name) => {
    if (!name || !name.trim()) {
      return { isValid: false, error: "Material Name is required" };
    }
    
    // Check for duplicate names only against active, non-deleted materials (excluding current material being edited)
    const existingMaterial = materials.find(material => 
      material.name.toLowerCase().trim() === name.toLowerCase().trim() && 
      material._id !== editingId &&
      material.isActive === true && // Only check against active materials
      !material.deleted // Exclude deleted materials
    );
    
    if (existingMaterial) {
      return { isValid: false, error: "Material name already exists" };
    }
    
    return { isValid: true, error: "" };
  };

  // Validate and Add / Update Material
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate material name
    const nameValidation = validateMaterialName(formData.name);
    if (!nameValidation.isValid) {
      setError(nameValidation.error);
      return;
    }

    if (!formData.type.trim()) {
      setError("Material Type is required");
      return;
    }

    try {
      setLoading(true);
      setSuccess(""); // Clear any existing success message
      setError(""); // Clear any existing error message

      let materialData;
      
      if (formData.image) {
        // Use FormData for file upload
        materialData = new FormData();
        materialData.append('type', formData.type.trim());
        materialData.append('name', formData.name.trim());
        materialData.append('description', formData.description.trim() || '');
        materialData.append('isActive', formData.isActive ? 'true' : 'false');
        materialData.append('image', formData.image);
      } else {
        // Use JSON for better boolean handling
        materialData = {
          type: formData.type.trim(),
          name: formData.name.trim(),
          description: formData.description.trim() || '',
          isActive: formData.isActive
        };
      }

      if (editingId) {
        // Update material
        await api.put(`/materials/${editingId}`, materialData);
        setSuccess(`✅ Material "${formData.name.trim()}" has been updated successfully!`);
        resetForm(); // Clear form after successful update
      } else {
        // Create material
        await api.post('/materials', materialData);
        setSuccess(`✅ Material "${formData.name.trim()}" has been created successfully!`);
        // Don't clear form after creation - allow "Add Another" button
      }

      // Refresh materials list
      await fetchMaterials();
      // Don't call resetForm() here - let AlertMessage handle the lifecycle
      
    } catch (err) {
      if (err.response?.data?.msg === 'Material name already exists') {
        setError("❌ Material name already exists. Please choose a different name.");
      } else {
        setError(`❌ Failed to ${editingId ? 'update' : 'create'} material. ${err.response?.data?.msg || 'Please try again.'}`);
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

  // Edit material
  const handleEdit = (material) => {
    setFormData({
      ...initialFormData,
      type: material.type || "",
      name: material.name || "",
      description: material.description || "",
      image: material.image || null, // Preserve existing image
      isActive: material.isActive !== undefined ? material.isActive : false
    });
    setEditingId(material._id || material.id);
    setError("");
    setSuccess("");
    
    // Scroll to form and focus on material name input
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
      if (materialNameInputRef.current) {
        materialNameInputRef.current.focus();
      }
    }, 100);
  };

  // Delete material
  const handleDelete = async (materialId) => {
    // Find the material to check if it's already marked as deleted
    const material = materials.find(m => m._id === materialId);
    const isAlreadyDeleted = material?.deleted;
    
    let message;
    let isPermanentDelete = false;
    
    if (isAlreadyDeleted) {
      message = "This material is already marked as deleted. Click OK to permanently remove it from the database. This action cannot be undone.";
      isPermanentDelete = true;
    } else {
      message = "This will mark the material as inactive and add a deleted flag. Click OK to continue.";
      isPermanentDelete = false;
    }
    
    setDeletePopup({
      isVisible: true,
      materialId,
      message,
      isPermanentDelete,
      action: "delete"
    });
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    const { materialId, isPermanentDelete } = deletePopup;
    const material = materials.find(m => m._id === materialId);
    
    try {
      setLoading(true);
      setSuccess(""); // Clear any existing success message
      setError(""); // Clear any existing error message
      
      if (isPermanentDelete) {
        // Permanent deletion
        await api.delete(`/materials/${materialId}/hard`);
        setSuccess(`🗑️ Material "${material.name}" has been permanently deleted from the database.`);
      } else {
        // Soft delete - mark as inactive and add deleted flag
        await api.delete(`/materials/${materialId}`);
        setSuccess(`⏸️ Material "${material.name}" has been marked as deleted and inactive.`);
      }
      
      await fetchMaterials();
    } catch (err) {
      const action = isPermanentDelete ? "permanently delete" : "mark as deleted";
      setError(`❌ Failed to ${action} material "${material.name}". ${err.response?.data?.msg || 'Please try again.'}`);
    } finally {
      setLoading(false);
      setDeletePopup({
        isVisible: false,
        materialId: null,
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
      materialId: null,
      message: "",
      isPermanentDelete: false,
      action: "delete"
    });
  };

  // Revert deleted material
  const handleRevert = async (materialId) => {
    const material = materials.find(m => m._id === materialId);
    
    if (!material) {
      setError("Material not found");
      return;
    }

    if (!material.deleted) {
      setError("This material is not deleted");
      return;
    }

    setDeletePopup({
      isVisible: true,
      materialId,
      message: `Are you sure you want to restore the material "${material.name}"? This will make it active again.`,
      isPermanentDelete: false,
      action: "revert"
    });
  };

  // Handle revert confirmation
  const handleRevertConfirm = async () => {
    const { materialId } = deletePopup;
    const material = materials.find(m => m._id === materialId);
    
    try {
      setLoading(true);
      setSuccess("");
      setError("");

      // Check if there's already an active or inactive material with the same name
      const existingMaterial = materials.find(m => 
        m._id !== materialId && // Exclude current material being reverted
        m.name.toLowerCase().trim() === material.name.toLowerCase().trim() && // Same name
        !m.deleted // Not deleted (active or inactive)
      );

      if (existingMaterial) {
        const status = existingMaterial.isActive ? 'Active' : 'Inactive';
        const suggestion = existingMaterial.isActive ? 
          `Consider deleting the active material "${existingMaterial.name}" first, or use a different name for the restored material.` :
          `Consider deleting the inactive material "${existingMaterial.name}" first, or use a different name for the restored material.`;
        
        setError(`❌ Cannot restore material "${material.name}". A ${status.toLowerCase()} material with this name already exists. ${suggestion}`);
        setLoading(false);
        setDeletePopup({
          isVisible: false,
          materialId: null,
          message: "",
          isPermanentDelete: false,
          action: "delete"
        });
        return;
      }

      // Revert the material by setting deleted to false and isActive to true
      await api.put(`/materials/${materialId}`, {
        type: material.type,
        name: material.name,
        description: material.description,
        isActive: true,
        deleted: false
      });

      setSuccess(`✅ Material "${material.name}" has been restored and is now active!`);
      await fetchMaterials();
    } catch (err) {
      setError(`❌ Failed to restore material "${material.name}". ${err.response?.data?.msg || 'Please try again.'}`);
    } finally {
      setLoading(false);
      setDeletePopup({
        isVisible: false,
        materialId: null,
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
      materialId: null,
      message: "",
      isPermanentDelete: false,
      action: "delete"
    });
  };

  // Fetch materials from backend
  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await api.get('/materials?includeDeleted=true');
      
      // Process materials to ensure proper image URLs
      const processedMaterials = response.data.map(material => {
        let imageUrl = material.image;
        
        // If image is a relative path, construct full URL
        if (imageUrl && !imageUrl.startsWith('http')) {
          // Check if it's a local upload path
          if (imageUrl.startsWith('/uploads/')) {
            imageUrl = `http://localhost:8080${imageUrl}`;
          }
        }
        
        return {
          ...material,
          image: imageUrl
        };
      });
      
      setMaterials(processedMaterials);
      setError("");
    } catch (err) {
      setError("Failed to fetch materials");
      console.error('Error fetching materials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // Filter materials based on search query and status
  const filteredMaterials = useMemo(() => {
    let filtered = materials;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(material => 
        material.name.toLowerCase().includes(query) ||
        material.type.toLowerCase().includes(query) ||
        (material.description && material.description.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    filtered = filterEntitiesByStatus(filtered, statusFilter);
    
    return filtered;
  }, [materials, searchQuery, statusFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMaterials = filteredMaterials.slice(startIndex, endIndex);

  // Card lazy loading logic
  useEffect(() => {
    if (viewMode === 'card') {
      const initialCards = filteredMaterials.slice(0, 12);
      setDisplayedCards(initialCards);
      setHasMoreCards(filteredMaterials.length > 12);
      setCurrentPage(1);
    }
  }, [viewMode, filteredMaterials]);

  // Reset pagination when search query changes
  const resetPaginationForSearch = useCallback(() => {
    setCurrentPage(1);
    if (viewMode === 'card') {
      const initialCards = filteredMaterials.slice(0, 12);
      setDisplayedCards(initialCards);
      setHasMoreCards(filteredMaterials.length > 12);
    }
  }, [viewMode, filteredMaterials.length]);

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
      const nextCards = filteredMaterials.slice(currentCardCount, currentCardCount + 12);
      
      if (nextCards.length > 0) {
        setHasMoreCards(currentCardCount + nextCards.length < filteredMaterials.length);
        return [...prevCards, ...nextCards];
      } else {
        setHasMoreCards(false);
        return prevCards;
      }
    });
  }, [filteredMaterials]);

  // Reset pagination when view mode changes
  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    setCurrentPage(1);
    if (mode === 'card') {
      const initialCards = filteredMaterials.slice(0, 12);
      setDisplayedCards(initialCards);
      setHasMoreCards(filteredMaterials.length > 12);
    }
  }, [filteredMaterials.length]);

  const handleCancel = () => {
    resetForm();
  };

  return (
    <div className="paddingAll20">
      {/* Header */}
      <PageHeader
        title="Material Management"
        subtitle="Manage your product materials and classifications"
        isEditing={!!editingId}
        editText="Edit Material"
        createText="Add New Material"
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
                type="text"
                name="type"
                label="Material Type"
                value={formData.type}
                onChange={handleChange}
                placeholder="Enter Material Type (e.g., Paper, Canvas, Metal)"
                required={true}
              />
            </div>
          </div>
          
          <div className="makeFlex row gap10">
            <div className="fullWidth">
              <FormField
                ref={materialNameInputRef}
                type="text"
                name="name"
                label="Material Name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter Material Name (e.g., Premium Glossy Paper)"
                required={true}
              />
            </div>
          </div>
          
          <div className="makeFlex row gap10">
            <div className="fullWidth">
              <FormField
                type="file"
                name="image"
                label="Material Image"
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
                    alt="Current material image" 
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
                placeholder="Enter Material Description"
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
              <p className="negativeMarginTop10">Check this box to keep the material active, uncheck to mark as inactive</p>
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
                <span>{editingId ? "Update Material" : "Add Material"}</span>
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
                Add Another Material
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Materials List */}
      <div className="brandsListContainer paddingAll32">
        <div className="listHeader makeFlex spaceBetween end appendBottom24">
          <div className="leftSection">
            <h2 className="listTitle font30 fontBold blackText appendBottom16">Materials ({filteredMaterials.length})</h2>
            <StatusFilter
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              counts={calculateStandardStatusCounts(materials)}
              disabled={loading}
            />
          </div>
          <div className="rightSection makeFlex end gap10">
            <SearchField
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search materials..."
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

        {filteredMaterials.length === 0 && !loading ? (
          <div className="emptyState textCenter paddingAll60">
            <div className="emptyIcon appendBottom16">🧱</div>
            <h3 className="font22 fontSemiBold grayText appendBottom8">No Materials Found</h3>
            <p className="font16 grayText">Start by adding your first material above</p>
          </div>
        ) : (
          <>
            {/* Card View */}
            {viewMode === 'card' && (
              <div className="brandsGrid">
                {displayedCards.map((material) => (
                  <EntityCard
                    key={material._id || material.id}
                    entity={material}
                    logoField="image"
                    nameField="name"
                    idField="_id"
                    onEdit={material.deleted ? undefined : handleEdit}
                    onDelete={handleDelete}
                    onRevert={material.deleted ? () => handleRevert(material._id || material.id) : undefined}
                    loading={loading}
                    imagePlaceholderColor={generateEntityColor(material._id || material.id, material.name)}
                    renderHeader={(material) => (
                      <EntityCardHeader
                        entity={material}
                        imageField="image"
                        titleField="name"
                        dateField="createdAt"
                        generateColor={generateEntityColor}
                      />
                    )}
                    renderDetails={(material) => {
                      return (
                        <>
                          <div className="brandDetail makeFlex spaceBetween alignCenter paddingTop8 paddingBottom8">
                            <span className="detailLabel font14 fontSemiBold grayText textUppercase">Material ID:</span>
                            <span className="detailValue font14 blackText appendLeft6">{material._id || 'N/A'}</span>
                          </div>
                          <div className="brandDetail makeFlex spaceBetween alignCenter paddingTop8 paddingBottom8">
                            <span className="detailLabel font14 fontSemiBold grayText textUppercase">Type:</span>
                            <span className="detailValue font14 blackText appendLeft6">{material.type}</span>
                          </div>
                          <div className="brandDetail makeFlex spaceBetween alignCenter paddingTop8 paddingBottom8">
                            <span className="detailLabel font14 fontSemiBold grayText textUppercase">Name:</span>
                            <span className="detailValue font14 blackText appendLeft6">{material.name}</span>
                          </div>
                          {material.description && (
                            <div className="brandDetail makeFlex spaceBetween alignCenter paddingTop8 paddingBottom8">
                              <span className="detailLabel font14 fontSemiBold grayText textUppercase">Description:</span>
                              <span className="detailValue font14 blackText appendLeft6">{material.description}</span>
                            </div>
                          )}
                          <div className="brandDetail makeFlex spaceBetween alignCenter paddingTop8 paddingBottom8">
                            <span className="detailLabel font14 fontSemiBold grayText textUppercase">Status:</span>
                            <span className={`detailValue font14 ${material.deleted ? 'deleted' : (material.isActive ? 'greenText' : 'inactive')} appendLeft6`}>
                              {material.deleted ? 'Deleted' : (material.isActive ? 'Active' : 'Inactive')}
                            </span>
                          </div>
                        </>
                      );
                    }}
                    renderActions={(material) => (
                      <ActionButtons
                        onEdit={material.deleted ? undefined : () => handleEdit(material)}
                        onDelete={() => handleDelete(material._id || material.id)}
                        onRevert={material.deleted ? () => handleRevert(material._id || material.id) : undefined}
                        loading={loading}
                        size="normal"
                        editText="✏️ Edit"
                        deleteText={material.deleted ? "🗑️ Final Del" : "🗑️ Delete"}
                        revertText="🔄 Undelete"
                        editTitle="Edit Material"
                        deleteTitle={material.deleted ? "Final Del" : "Delete Material"}
                        revertTitle="Restore Material"
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
                        <th className="tableHeader">Type</th>
                        <th className="tableHeader">Name</th>
                        <th className="tableHeader">Description</th>
                        <th className="tableHeader">Status</th>
                        <th className="tableHeader">Created</th>
                        <th className="tableHeader">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentMaterials.map((material) => (
                        <tr key={material._id || material.id} className="tableRow">
                          <td className="tableCell">
                            {material.image ? (
                              <img
                                src={material.image}
                                alt={material.name}
                                className="tableImage"
                                style={{ 
                                  width: '40px', 
                                  height: '40px', 
                                  objectFit: 'cover',
                                  borderRadius: '4px'
                                }}
                                onError={(e) => {
                                  console.error('Image failed to load:', material.image);
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div 
                                className="tableImagePlaceholder"
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  backgroundColor: generateEntityColor(material._id || material.id, material.name),
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}
                              >
                                {material.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </td>
                          <td className="tableCell">
                            <span className="brandNameText">{material.type}</span>
                          </td>
                          <td className="tableCell">
                            <span className="brandNameText">{material.name}</span>
                          </td>
                          <td className="tableCell">
                            <span className="addressText" title={material.description}>
                              {material.description ? (material.description.length > 30 ? `${material.description.substring(0, 30)}...` : material.description) : '-'}
                            </span>
                          </td>
                          <td className="tableCell">
                            <span className={`statusText ${material.deleted ? 'deleted' : (material.isActive ? 'active' : 'inactive')}`}>
                              {material.deleted ? 'Deleted' : (material.isActive ? 'Active' : 'Inactive')}
                            </span>
                          </td>
                          <td className="tableCell">
                            <span className="dateText">
                              {new Date(material.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="tableCell">
                            <div className="tableActions makeFlex gap8">
                              <ActionButtons
                                onEdit={material.deleted ? undefined : () => handleEdit(material)}
                                onDelete={() => handleDelete(material._id || material.id)}
                                onRevert={material.deleted ? () => handleRevert(material._id || material.id) : undefined}
                                loading={loading}
                                size="small"
                                editText="✏️"
                                deleteText={material.deleted ? "🗑️" : "🗑️"}
                                revertText="🔄"
                                editTitle="Edit Material"
                                deleteTitle={material.deleted ? "Final Del" : "Delete Material"}
                                revertTitle="Restore Material"
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

export default MaterialManager;
