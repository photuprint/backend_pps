import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import api from '../api/axios';
import { 
  PageHeader, 
  AlertMessage, 
  ViewToggle, 
  Pagination, 
  EntityCard, 
  FormField, 
  ActionButtons,
  SearchField,
  StatusFilter,
  DeleteConfirmationPopup,
  calculateStandardStatusCounts,
  filterEntitiesByStatus,
  generateEntityColor 
} from '../common';

const FitTypeManager = () => {
  const [fitTypes, setFitTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive', 'deleted'
  
  // Delete confirmation popup state
  const [deletePopup, setDeletePopup] = useState({
    isVisible: false,
    fitTypeId: null,
    message: "",
    isPermanentDelete: false,
    action: "delete" // "delete" or "revert"
  });
  
  // Refs for scroll and focus functionality
  const formRef = useRef(null);
  const fitTypeNameInputRef = useRef(null);
  
  // Pagination and lazy loading states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // For list view
  const [hasMoreCards, setHasMoreCards] = useState(true);
  const [displayedCards, setDisplayedCards] = useState([]);
  
  const initialFormData = {
    name: "",
    description: "",
    isActive: true
  };

  const [formData, setFormData] = useState(initialFormData);
  const [searchQuery, setSearchQuery] = useState(""); // Search query state

  // Fetch fit types from backend
  const fetchFitTypes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/fit-types?includeDeleted=true');
      setFitTypes(response.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch fit types");
      console.error('Error fetching fit types:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFitTypes();
  }, []);

  // Filter fit types based on search query and status - memoized to prevent infinite loops
  const filteredFitTypes = useMemo(() => {
    let filtered = fitTypes;
    
    // Apply search filter
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(fitType => 
        fitType.name.toLowerCase().includes(query) ||
        (fitType.description && fitType.description.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    filtered = filterEntitiesByStatus(filtered, statusFilter);
    
    return filtered;
  }, [fitTypes, searchQuery, statusFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredFitTypes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFitTypes = filteredFitTypes.slice(startIndex, endIndex);

  // Card lazy loading logic
  useEffect(() => {
    if (viewMode === 'card' && filteredFitTypes.length > 0) {
      const initialCards = filteredFitTypes.slice(0, 12);
      setDisplayedCards(initialCards);
      setHasMoreCards(filteredFitTypes.length > 12);
      setCurrentPage(1);
    }
  }, [filteredFitTypes, viewMode]);

  // Handle page change for list view
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle lazy loading for card view
  const handleLoadMoreCards = () => {
    const currentCardCount = displayedCards.length;
    const nextCards = filteredFitTypes.slice(currentCardCount, currentCardCount + 12);
    
    if (nextCards.length > 0) {
      setDisplayedCards([...displayedCards, ...nextCards]);
      setHasMoreCards(currentCardCount + nextCards.length < filteredFitTypes.length);
    } else {
      setHasMoreCards(false);
    }
  };

  // Reset pagination when view mode changes
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setCurrentPage(1);
    if (mode === 'card') {
      const initialCards = filteredFitTypes.slice(0, 12);
      setDisplayedCards(initialCards);
      setHasMoreCards(filteredFitTypes.length > 12);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError("Fit Type Name is required");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const fitTypeData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        isActive: formData.isActive
      };

      if (editingId) {
        // Update fit type
        await api.put(`/fit-types/${editingId}`, fitTypeData);
        setSuccess("Fit Type updated successfully!");
        resetForm(); // Clear form after successful update
      } else {
        // Create fit type
        await api.post('/fit-types', fitTypeData);
        setSuccess("Fit Type created successfully!");
        // Don't clear form after creation - allow "Add Another" button
      }

      // Refresh fit types list
      await fetchFitTypes();
      
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to save fit type");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (fitType) => {
    setFormData({
      ...initialFormData,
      name: fitType.name || "",
      description: fitType.description || "",
      isActive: fitType.isActive !== undefined ? fitType.isActive : true
    });
    setEditingId(fitType._id);
    setError("");
    setSuccess("");
    
    // Scroll to form and focus on fit type name input
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
      if (fitTypeNameInputRef.current) {
        fitTypeNameInputRef.current.focus();
      }
    }, 100);
  };

  const handleDelete = (fitTypeId) => {
    // Find the fit type to check if it's already marked as deleted
    const fitType = fitTypes.find(f => f._id === fitTypeId);
    const isAlreadyDeleted = fitType?.deleted;
    
    let message;
    let isPermanentDelete = false;
    
    if (isAlreadyDeleted) {
      message = "This fit type is already marked as deleted. Click OK to permanently remove it from the database. This action cannot be undone.";
      isPermanentDelete = true;
    } else {
      message = "This will mark the fit type as inactive and add a deleted flag. Click OK to continue.";
      isPermanentDelete = false;
    }
    
    setDeletePopup({
      isVisible: true,
      fitTypeId,
      message,
      isPermanentDelete,
      action: "delete"
    });
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    const { fitTypeId, isPermanentDelete } = deletePopup;
    const fitType = fitTypes.find(f => f._id === fitTypeId);
    
    try {
      setLoading(true);
      setSuccess(""); // Clear any existing success message
      setError(""); // Clear any existing error message
      
      if (isPermanentDelete) {
        // Permanent deletion
        await api.delete(`/fit-types/${fitTypeId}/hard`);
        setSuccess(`🗑️ Fit Type "${fitType.name}" has been permanently deleted from the database.`);
      } else {
        // Soft delete - mark as inactive and add deleted flag
        await api.delete(`/fit-types/${fitTypeId}`);
        setSuccess(`⏸️ Fit Type "${fitType.name}" has been marked as deleted and inactive.`);
      }
      
      await fetchFitTypes();
    } catch (err) {
      const action = isPermanentDelete ? "permanently delete" : "mark as deleted";
      setError(`❌ Failed to ${action} fit type "${fitType.name}". ${err.response?.data?.msg || 'Please try again.'}`);
    } finally {
      setLoading(false);
      setDeletePopup({
        isVisible: false,
        fitTypeId: null,
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
      fitTypeId: null,
      message: "",
      isPermanentDelete: false,
      action: "delete"
    });
  };

  // Revert deleted fit type
  const handleRevert = async (fitTypeId) => {
    const fitType = fitTypes.find(f => f._id === fitTypeId);
    
    if (!fitType) {
      setError("Fit type not found");
      return;
    }

    if (!fitType.deleted) {
      setError("This fit type is not deleted");
      return;
    }

    setDeletePopup({
      isVisible: true,
      fitTypeId,
      message: `Are you sure you want to restore the fit type "${fitType.name}"? This will make it active again.`,
      isPermanentDelete: false,
      action: "revert"
    });
  };

  // Handle revert confirmation
  const handleRevertConfirm = async () => {
    const { fitTypeId } = deletePopup;
    const fitType = fitTypes.find(f => f._id === fitTypeId);
    
    try {
      setLoading(true);
      setSuccess("");
      setError("");

      // Check if there's already an active or inactive fit type with the same name
      const existingFitType = fitTypes.find(f => 
        f._id !== fitTypeId && // Exclude current fit type being reverted
        f.name.toLowerCase().trim() === fitType.name.toLowerCase().trim() && // Same name
        !f.deleted // Not deleted (active or inactive)
      );

      if (existingFitType) {
        const status = existingFitType.isActive ? 'Active' : 'Inactive';
        const suggestion = existingFitType.isActive ? 
          `Consider deleting the active fit type "${existingFitType.name}" first, or use a different name for the restored fit type.` :
          `Consider deleting the inactive fit type "${existingFitType.name}" first, or use a different name for the restored fit type.`;
        
        setError(`❌ Cannot restore fit type "${fitType.name}". A ${status.toLowerCase()} fit type with this name already exists. ${suggestion}`);
        setLoading(false);
        setDeletePopup({
          isVisible: false,
          fitTypeId: null,
          message: "",
          isPermanentDelete: false,
          action: "delete"
        });
        return;
      }

      // Revert the fit type by setting deleted to false and isActive to true
      await api.put(`/fit-types/${fitTypeId}`, {
        name: fitType.name,
        description: fitType.description,
        isActive: true,
        deleted: false
      });

      setSuccess(`✅ Fit Type "${fitType.name}" has been restored and is now active!`);
      await fetchFitTypes();
    } catch (err) {
      setError(`❌ Failed to restore fit type "${fitType.name}". ${err.response?.data?.msg || 'Please try again.'}`);
    } finally {
      setLoading(false);
      setDeletePopup({
        isVisible: false,
        fitTypeId: null,
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
      fitTypeId: null,
      message: "",
      isPermanentDelete: false,
      action: "delete"
    });
  };

  const handleCancel = () => {
    resetForm();
  };

  // Get status information for display
  const getStatusInfo = (fitType) => {
    if (fitType.deleted) {
      return { text: 'Deleted', className: 'deleted' };
    }
    return fitType.isActive 
      ? { text: 'Active', className: 'active' } 
      : { text: 'Inactive', className: 'inactive' };
  };

  return (
    <div className="paddingAll20">
      {/* Header */}
      <PageHeader
        title="Fit Type Management"
        subtitle="Manage your product fit types and classifications"
        isEditing={!!editingId}
        editText="Edit Fit Type"
        createText="Add New Fit Type"
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

      {/* Fit Type Form */}
      <div className="brandFormContainer paddingAll32 appendBottom30" ref={formRef}>
        <form onSubmit={handleSubmit} className="brandForm">
          <div className="makeFlex row gap10">
            <div className="fullWidth">
              <FormField
                ref={fitTypeNameInputRef}
                type="text"
                name="name"
                label="Fit Type Name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter Fit Type Name (e.g., Slim Fit)"
                required={true}
              />
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
                placeholder="Enter Fit Type Description"
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
              <p className="negativeMarginTop10">Check this box to keep the fit type active, uncheck to mark as inactive</p>
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
                <span>{editingId ? "Update Fit Type" : "Add Fit Type"}</span>
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
                Add Another Fit Type
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Fit Types List */}
      <div className="brandsListContainer paddingAll32">
        <div className="listHeader makeFlex spaceBetween alignCenter appendBottom24">
          <div className="leftSection">
            <h2 className="listTitle font30 fontBold blackText">Fit Types ({filteredFitTypes.length})</h2>
            <StatusFilter
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              counts={calculateStandardStatusCounts(fitTypes)}
              disabled={loading}
            />
          </div>
          <div className="makeFlex alignCenter gap10">
            <SearchField
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fit types..."
              disabled={loading}
              minWidth="250px"
              onClear={() => setSearchQuery("")}
            />
            {loading && <div className="loadingIndicator grayText">Loading...</div>}
            <ViewToggle
              viewMode={viewMode}
              onViewChange={handleViewModeChange}
              disabled={loading}
            />
          </div>
        </div>

        {filteredFitTypes.length === 0 && !loading ? (
          <div className="emptyState textCenter paddingAll60">
            <div className="emptyIcon appendBottom16">👕</div>
            <h3 className="font22 fontSemiBold grayText appendBottom8">No Fit Types Found</h3>
            <p className="font16 grayText">Start by adding your first fit type above</p>
          </div>
        ) : (
          <>
            {/* Card View */}
            {viewMode === 'card' && (
              <div className="brandsGrid">
                {displayedCards.map((fitType) => {
                  const statusInfo = getStatusInfo(fitType);
                  return (
                    <EntityCard
                      key={fitType._id}
                      entity={fitType}
                      logoField="image"
                      nameField="name"
                      idField="_id"
                      onEdit={fitType.deleted ? undefined : handleEdit}
                      onDelete={handleDelete}
                      onRevert={fitType.deleted ? () => handleRevert(fitType._id) : undefined}
                      loading={loading}
                      logoPlaceholderColor={generateEntityColor(fitType._id, fitType.name)}
                      renderDetails={(fitType) => (
                        <>
                          {fitType.description && (
                            <div className="brandDetail makeFlex spaceBetween alignCenter paddingTop8 paddingBottom8">
                              <span className="detailLabel font14 fontSemiBold grayText textUppercase">Description:</span>
                              <span className="detailValue font14 darkGrayText">{fitType.description}</span>
                            </div>
                          )}
                          <div className="brandDetail makeFlex spaceBetween alignCenter paddingTop8 paddingBottom8">
                            <span className="detailLabel font14 fontSemiBold grayText textUppercase">Status:</span>
                            <span className={`detailValue font14 ${statusInfo.className === 'active' ? 'greenText' : statusInfo.className === 'deleted' ? 'redText' : 'orangeText'} appendLeft6`}>
                              {statusInfo.text}
                            </span>
                          </div>
                        </>
                      )}
                      renderActions={(fitType) => (
                        <ActionButtons
                          onEdit={fitType.deleted ? undefined : () => handleEdit(fitType)}
                          onDelete={() => handleDelete(fitType._id)}
                          onRevert={fitType.deleted ? () => handleRevert(fitType._id) : undefined}
                          loading={loading}
                          size="normal"
                          deleteText={fitType.deleted ? "🗑️ Final Del" : "🗑️ Delete"}
                          deleteTitle={fitType.deleted ? "Permanently delete this fit type" : "Mark fit type as deleted"}
                          revertText="🔄 Restore"
                          revertTitle="Restore this deleted fit type"
                        />
                      )}
                      className="brandCard"
                    />
                  );
                })}
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
                        <th className="tableHeader">Name</th>
                        <th className="tableHeader">Description</th>
                        <th className="tableHeader">Status</th>
                        <th className="tableHeader">Created</th>
                        <th className="tableHeader">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentFitTypes.map((fitType) => {
                        const statusInfo = getStatusInfo(fitType);
                        return (
                          <tr key={fitType._id} className="tableRow">
                            <td className="tableCell">
                              <span className="brandNameText">{fitType.name}</span>
                            </td>
                            <td className="tableCell">
                              <span className="addressText" title={fitType.description}>
                                {fitType.description ? (fitType.description.length > 30 ? `${fitType.description.substring(0, 30)}...` : fitType.description) : '-'}
                              </span>
                            </td>
                            <td className="tableCell">
                              <span className={`statusText ${statusInfo.className}`}>
                                {statusInfo.text}
                              </span>
                            </td>
                            <td className="tableCell">
                              <span className="dateText">
                                {new Date(fitType.createdAt).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="tableCell">
                              <div className="tableActions makeFlex gap8">
                                <ActionButtons
                                  onEdit={fitType.deleted ? undefined : () => handleEdit(fitType)}
                                  onDelete={() => handleDelete(fitType._id)}
                                  onRevert={fitType.deleted ? () => handleRevert(fitType._id) : undefined}
                                  loading={loading}
                                  size="small"
                                  editText="✏️"
                                  deleteText={fitType.deleted ? "🗑️" : "🗑️"}
                                  revertText="🔄"
                                  editTitle="Edit Fit Type"
                                  deleteTitle={fitType.deleted ? "Final Del" : "Delete Fit Type"}
                                  revertTitle="Restore Fit Type"
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
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

export default FitTypeManager;
