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

const PatternManager = () => {
  const [patterns, setPatterns] = useState([]);
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
    patternId: null,
    message: "",
    isPermanentDelete: false,
    action: "delete" // "delete" or "revert"
  });
  
  // Refs for scroll and focus functionality
  const formRef = useRef(null);
  const patternNameInputRef = useRef(null);
  
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

  // Validate pattern name for duplicates
  const validatePatternName = (name) => {
    if (!name || !name.trim()) {
      return { isValid: false, error: "Pattern Name is required" };
    }
    
    // Check for duplicate names only against active, non-deleted patterns (excluding current pattern being edited)
    const existingPattern = patterns.find(pattern => 
      pattern.name.toLowerCase().trim() === name.toLowerCase().trim() && 
      pattern._id !== editingId &&
      pattern.isActive === true && // Only check against active patterns
      !pattern.deleted // Exclude deleted patterns
    );
    
    if (existingPattern) {
      return { isValid: false, error: "Pattern name already exists" };
    }
    
    return { isValid: true, error: "" };
  };

  // Validate and Add / Update Pattern
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate pattern name
    const nameValidation = validatePatternName(formData.name);
    if (!nameValidation.isValid) {
      setError(nameValidation.error);
      return;
    }

    try {
      setLoading(true);
      setSuccess(""); // Clear any existing success message
      setError(""); // Clear any existing error message

      let patternData;
      
      if (formData.image) {
        // Use FormData for file upload
        patternData = new FormData();
        patternData.append('name', formData.name.trim());
        patternData.append('description', formData.description.trim() || '');
        patternData.append('isActive', formData.isActive ? 'true' : 'false');
        patternData.append('image', formData.image);
      } else {
        // Use JSON for better boolean handling
        patternData = {
          name: formData.name.trim(),
          description: formData.description.trim() || '',
          isActive: formData.isActive
        };
      }

      if (editingId) {
        // Update pattern
        await api.put(`/patterns/${editingId}`, patternData);
        setSuccess(`✅ Pattern "${formData.name.trim()}" has been updated successfully!`);
        resetForm(); // Clear form after successful update
      } else {
        // Create pattern
        await api.post('/patterns', patternData);
        setSuccess(`✅ Pattern "${formData.name.trim()}" has been created successfully!`);
        // Don't clear form after creation - allow "Add Another" button
      }

      // Refresh patterns list
      await fetchPatterns();
      // Don't call resetForm() here - let AlertMessage handle the lifecycle
      
    } catch (err) {
      if (err.response?.data?.msg === 'Pattern name already exists') {
        setError("❌ Pattern name already exists. Please choose a different name.");
      } else {
        setError(`❌ Failed to ${editingId ? 'update' : 'create'} pattern. ${err.response?.data?.msg || 'Please try again.'}`);
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

  // Edit pattern
  const handleEdit = (pattern) => {
    setFormData({
      ...initialFormData,
      name: pattern.name || "",
      description: pattern.description || "",
      image: pattern.image || null, // Preserve existing image
      isActive: pattern.isActive !== undefined ? pattern.isActive : false
    });
    setEditingId(pattern._id || pattern.id);
    setError("");
    setSuccess("");
    
    // Scroll to form and focus on pattern name input
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
      if (patternNameInputRef.current) {
        patternNameInputRef.current.focus();
      }
    }, 100);
  };

  // Delete pattern
  const handleDelete = async (patternId) => {
    // Find the pattern to check if it's already marked as deleted
    const pattern = patterns.find(p => p._id === patternId);
    const isAlreadyDeleted = pattern?.deleted;
    
    let message;
    let isPermanentDelete = false;
    
    if (isAlreadyDeleted) {
      message = "This pattern is already marked as deleted. Click OK to permanently remove it from the database. This action cannot be undone.";
      isPermanentDelete = true;
    } else {
      message = "This will mark the pattern as inactive and add a deleted flag. Click OK to continue.";
      isPermanentDelete = false;
    }
    
    setDeletePopup({
      isVisible: true,
      patternId,
      message,
      isPermanentDelete,
      action: "delete"
    });
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    const { patternId, isPermanentDelete } = deletePopup;
    const pattern = patterns.find(p => p._id === patternId);
    
    try {
      setLoading(true);
      setSuccess(""); // Clear any existing success message
      setError(""); // Clear any existing error message
      
      if (isPermanentDelete) {
        // Permanent deletion
        await api.delete(`/patterns/${patternId}/hard`);
        setSuccess(`🗑️ Pattern "${pattern.name}" has been permanently deleted from the database.`);
      } else {
        // Soft delete - mark as inactive and add deleted flag
        await api.delete(`/patterns/${patternId}`);
        setSuccess(`⏸️ Pattern "${pattern.name}" has been marked as deleted and inactive.`);
      }
      
      await fetchPatterns();
    } catch (err) {
      const action = isPermanentDelete ? "permanently delete" : "mark as deleted";
      setError(`❌ Failed to ${action} pattern "${pattern.name}". ${err.response?.data?.msg || 'Please try again.'}`);
    } finally {
      setLoading(false);
      setDeletePopup({
        isVisible: false,
        patternId: null,
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
      patternId: null,
      message: "",
      isPermanentDelete: false,
      action: "delete"
    });
  };

  // Revert deleted pattern
  const handleRevert = async (patternId) => {
    const pattern = patterns.find(p => p._id === patternId);
    
    if (!pattern) {
      setError("Pattern not found");
      return;
    }

    if (!pattern.deleted) {
      setError("This pattern is not deleted");
      return;
    }

    setDeletePopup({
      isVisible: true,
      patternId,
      message: `Are you sure you want to restore the pattern "${pattern.name}"? This will make it active again.`,
      isPermanentDelete: false,
      action: "revert"
    });
  };

  // Handle revert confirmation
  const handleRevertConfirm = async () => {
    const { patternId } = deletePopup;
    const pattern = patterns.find(p => p._id === patternId);
    
    try {
      setLoading(true);
      setSuccess("");
      setError("");

      // Check if there's already an active or inactive pattern with the same name
      const existingPattern = patterns.find(p => 
        p._id !== patternId && // Exclude current pattern being reverted
        p.name.toLowerCase().trim() === pattern.name.toLowerCase().trim() && // Same name
        !p.deleted // Not deleted (active or inactive)
      );

      if (existingPattern) {
        const status = existingPattern.isActive ? 'Active' : 'Inactive';
        const suggestion = existingPattern.isActive ? 
          `Consider deleting the active pattern "${existingPattern.name}" first, or use a different name for the restored pattern.` :
          `Consider deleting the inactive pattern "${existingPattern.name}" first, or use a different name for the restored pattern.`;
        
        setError(`❌ Cannot restore pattern "${pattern.name}". A ${status.toLowerCase()} pattern with this name already exists. ${suggestion}`);
        setLoading(false);
        setDeletePopup({
          isVisible: false,
          patternId: null,
          message: "",
          isPermanentDelete: false,
          action: "delete"
        });
        return;
      }

      // Revert the pattern by setting deleted to false and isActive to true
      await api.put(`/patterns/${patternId}`, {
        name: pattern.name,
        description: pattern.description,
        isActive: true,
        deleted: false
      });

      setSuccess(`✅ Pattern "${pattern.name}" has been restored and is now active!`);
      await fetchPatterns();
    } catch (err) {
      setError(`❌ Failed to restore pattern "${pattern.name}". ${err.response?.data?.msg || 'Please try again.'}`);
    } finally {
      setLoading(false);
      setDeletePopup({
        isVisible: false,
        patternId: null,
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
      patternId: null,
      message: "",
      isPermanentDelete: false,
      action: "delete"
    });
  };

  // Fetch patterns from backend
  const fetchPatterns = async () => {
    try {
      setLoading(true);
      const response = await api.get('/patterns?includeDeleted=true');
      
      // Process patterns to ensure proper image URLs
      const processedPatterns = response.data.map(pattern => {
        let imageUrl = pattern.image;
        
        // If image is a relative path, construct full URL
        if (imageUrl && !imageUrl.startsWith('http')) {
          // Check if it's a local upload path
          if (imageUrl.startsWith('/uploads/')) {
            imageUrl = `http://localhost:8080${imageUrl}`;
          }
        }
        
        return {
          ...pattern,
          image: imageUrl
        };
      });
      
      setPatterns(processedPatterns);
      setError("");
    } catch (err) {
      setError("Failed to fetch patterns");
      console.error('Error fetching patterns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatterns();
  }, []);

  // Filter patterns based on search query and status
  const filteredPatterns = useMemo(() => {
    let filtered = patterns;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(pattern => 
        pattern.name.toLowerCase().includes(query) ||
        (pattern.description && pattern.description.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    filtered = filterEntitiesByStatus(filtered, statusFilter);
    
    return filtered;
  }, [patterns, searchQuery, statusFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredPatterns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPatterns = filteredPatterns.slice(startIndex, endIndex);

  // Card lazy loading logic
  useEffect(() => {
    if (viewMode === 'card') {
      const initialCards = filteredPatterns.slice(0, 12);
      setDisplayedCards(initialCards);
      setHasMoreCards(filteredPatterns.length > 12);
      setCurrentPage(1);
    }
  }, [viewMode, filteredPatterns]);

  // Reset pagination when search query changes
  const resetPaginationForSearch = useCallback(() => {
    setCurrentPage(1);
    if (viewMode === 'card') {
      const initialCards = filteredPatterns.slice(0, 12);
      setDisplayedCards(initialCards);
      setHasMoreCards(filteredPatterns.length > 12);
    }
  }, [viewMode, filteredPatterns.length]);

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
      const nextCards = filteredPatterns.slice(currentCardCount, currentCardCount + 12);
      
      if (nextCards.length > 0) {
        setHasMoreCards(currentCardCount + nextCards.length < filteredPatterns.length);
        return [...prevCards, ...nextCards];
      } else {
        setHasMoreCards(false);
        return prevCards;
      }
    });
  }, [filteredPatterns]);

  // Reset pagination when view mode changes
  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    setCurrentPage(1);
    if (mode === 'card') {
      const initialCards = filteredPatterns.slice(0, 12);
      setDisplayedCards(initialCards);
      setHasMoreCards(filteredPatterns.length > 12);
    }
  }, [filteredPatterns.length]);

  const handleCancel = () => {
    resetForm();
  };

  return (
    <div className="paddingAll20">
      {/* Header */}
      <PageHeader
        title="Pattern Management"
        subtitle="Manage your product patterns and classifications"
        isEditing={!!editingId}
        editText="Edit Pattern"
        createText="Add New Pattern"
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
                ref={patternNameInputRef}
                type="text"
                name="name"
                label="Pattern Name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter Pattern Name (e.g., Stripes)"
                required={true}
              />
            </div>
          </div>
          
          <div className="makeFlex row gap10">
            <div className="fullWidth">
              <FormField
                type="file"
                name="image"
                label="Pattern Image"
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
                    alt="Current pattern image" 
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
                placeholder="Enter Pattern Description"
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
              <p className="negativeMarginTop10">Check this box to keep the pattern active, uncheck to mark as inactive</p>
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
                <span>{editingId ? "Update Pattern" : "Add Pattern"}</span>
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
                Add Another Pattern
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Patterns List */}
      <div className="brandsListContainer paddingAll32">
        <div className="listHeader makeFlex spaceBetween end appendBottom24">
          <div className="leftSection">
            <h2 className="listTitle font30 fontBold blackText appendBottom16">Patterns ({filteredPatterns.length})</h2>
            <StatusFilter
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              counts={calculateStandardStatusCounts(patterns)}
              disabled={loading}
            />
          </div>
          <div className="rightSection makeFlex end gap10">
            <SearchField
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patterns..."
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

        {filteredPatterns.length === 0 && !loading ? (
          <div className="emptyState textCenter paddingAll60">
            <div className="emptyIcon appendBottom16">🎨</div>
            <h3 className="font22 fontSemiBold grayText appendBottom8">No Patterns Found</h3>
            <p className="font16 grayText">Start by adding your first pattern above</p>
          </div>
        ) : (
          <>
            {/* Card View */}
            {viewMode === 'card' && (
              <div className="brandsGrid">
                {displayedCards.map((pattern) => (
                  <EntityCard
                    key={pattern._id || pattern.id}
                    entity={pattern}
                    logoField="image"
                    nameField="name"
                    idField="_id"
                    onEdit={pattern.deleted ? undefined : handleEdit}
                    onDelete={handleDelete}
                    onRevert={pattern.deleted ? () => handleRevert(pattern._id || pattern.id) : undefined}
                    loading={loading}
                    imagePlaceholderColor={generateEntityColor(pattern._id || pattern.id, pattern.name)}
                    renderHeader={(pattern) => (
                      <EntityCardHeader
                        entity={pattern}
                        imageField="image"
                        titleField="name"
                        dateField="createdAt"
                        generateColor={generateEntityColor}
                      />
                    )}
                    renderDetails={(pattern) => {
                      return (
                        <>
                          <div className="brandDetail makeFlex spaceBetween alignCenter paddingTop8 paddingBottom8">
                            <span className="detailLabel font14 fontSemiBold grayText textUppercase">Pattern ID:</span>
                            <span className="detailValue font14 blackText appendLeft6">{pattern._id || 'N/A'}</span>
                          </div>
                          <div className="brandDetail makeFlex spaceBetween alignCenter paddingTop8 paddingBottom8">
                            <span className="detailLabel font14 fontSemiBold grayText textUppercase">Name:</span>
                            <span className="detailValue font14 blackText appendLeft6">{pattern.name}</span>
                          </div>
                          {pattern.description && (
                            <div className="brandDetail makeFlex spaceBetween alignCenter paddingTop8 paddingBottom8">
                              <span className="detailLabel font14 fontSemiBold grayText textUppercase">Description:</span>
                              <span className="detailValue font14 blackText appendLeft6">{pattern.description}</span>
                            </div>
                          )}
                          <div className="brandDetail makeFlex spaceBetween alignCenter paddingTop8 paddingBottom8">
                            <span className="detailLabel font14 fontSemiBold grayText textUppercase">Status:</span>
                            <span className={`detailValue font14 ${pattern.deleted ? 'deleted' : (pattern.isActive ? 'greenText' : 'inactive')} appendLeft6`}>
                              {pattern.deleted ? 'Deleted' : (pattern.isActive ? 'Active' : 'Inactive')}
                            </span>
                          </div>
                        </>
                      );
                    }}
                    renderActions={(pattern) => (
                      <ActionButtons
                        onEdit={pattern.deleted ? undefined : () => handleEdit(pattern)}
                        onDelete={() => handleDelete(pattern._id || pattern.id)}
                        onRevert={pattern.deleted ? () => handleRevert(pattern._id || pattern.id) : undefined}
                        loading={loading}
                        size="normal"
                        editText="✏️ Edit"
                        deleteText={pattern.deleted ? "🗑️ Final Del" : "🗑️ Delete"}
                        revertText="🔄 Undelete"
                        editTitle="Edit Pattern"
                        deleteTitle={pattern.deleted ? "Final Del" : "Delete Pattern"}
                        revertTitle="Restore Pattern"
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
                      {currentPatterns.map((pattern) => (
                        <tr key={pattern._id || pattern.id} className="tableRow">
                          <td className="tableCell">
                            {pattern.image ? (
                              <img
                                src={pattern.image}
                                alt={pattern.name}
                                className="tableImage"
                                style={{ 
                                  width: '40px', 
                                  height: '40px', 
                                  objectFit: 'cover',
                                  borderRadius: '4px'
                                }}
                                onError={(e) => {
                                  console.error('Image failed to load:', pattern.image);
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div 
                                className="tableImagePlaceholder"
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  backgroundColor: generateEntityColor(pattern._id || pattern.id, pattern.name),
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}
                              >
                                {pattern.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </td>
                          <td className="tableCell">
                            <span className="brandNameText">{pattern.name}</span>
                          </td>
                          <td className="tableCell">
                            <span className="addressText" title={pattern.description}>
                              {pattern.description ? (pattern.description.length > 30 ? `${pattern.description.substring(0, 30)}...` : pattern.description) : '-'}
                            </span>
                          </td>
                          <td className="tableCell">
                            <span className={`statusText ${pattern.deleted ? 'deleted' : (pattern.isActive ? 'active' : 'inactive')}`}>
                              {pattern.deleted ? 'Deleted' : (pattern.isActive ? 'Active' : 'Inactive')}
                            </span>
                          </td>
                          <td className="tableCell">
                            <span className="dateText">
                              {new Date(pattern.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="tableCell">
                            <div className="tableActions makeFlex gap8">
                              <ActionButtons
                                onEdit={pattern.deleted ? undefined : () => handleEdit(pattern)}
                                onDelete={() => handleDelete(pattern._id || pattern.id)}
                                onRevert={pattern.deleted ? () => handleRevert(pattern._id || pattern.id) : undefined}
                                loading={loading}
                                size="small"
                                editText="✏️"
                                deleteText={pattern.deleted ? "🗑️" : "🗑️"}
                                revertText="🔄"
                                editTitle="Edit Pattern"
                                deleteTitle={pattern.deleted ? "Final Del" : "Delete Pattern"}
                                revertTitle="Restore Pattern"
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

export default PatternManager;
