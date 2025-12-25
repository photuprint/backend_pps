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

const ColorManager = () => {
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive', 'deleted'
  
  // Delete confirmation popup state
  const [deletePopup, setDeletePopup] = useState({
    isVisible: false,
    colorId: null,
    message: "",
    isPermanentDelete: false,
    action: "delete" // "delete" or "revert"
  });
  
  // Refs for scroll and focus functionality
  const formRef = useRef(null);
  const colorNameInputRef = useRef(null);
  
  // Pagination and lazy loading states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // For list view
  const [hasMoreCards, setHasMoreCards] = useState(true);
  const [displayedCards, setDisplayedCards] = useState([]);
  
  const initialFormData = {
    name: "",
    code: "",
    image: null,
    isActive: false
  };

  const [formData, setFormData] = useState(initialFormData);
  const [currentImageUrl, setCurrentImageUrl] = useState(null); // Track current image URL separately
  const [searchQuery, setSearchQuery] = useState(""); // Search query state

  // Fetch colors from backend
  const fetchColors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/colors?showInactive=true&includeDeleted=true');
      setColors(response.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch colors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColors();
  }, []);

  // Filter colors based on search query and status - memoized to prevent infinite loops
  const filteredColors = useMemo(() => {
    let filtered = colors;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(color => 
        color.name.toLowerCase().includes(query) ||
        (color.code && color.code.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    filtered = filterEntitiesByStatus(filtered, statusFilter);
    
    return filtered;
  }, [colors, searchQuery, statusFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredColors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentColors = filteredColors.slice(startIndex, endIndex);

  // Card lazy loading logic
  useEffect(() => {
    if (viewMode === 'card' && filteredColors.length > 0) {
      const initialCards = filteredColors.slice(0, 12);
      setDisplayedCards(initialCards);
      setHasMoreCards(filteredColors.length > 12);
      setCurrentPage(1);
    }
  }, [filteredColors, viewMode]);

  // Reset pagination when search query changes
  useEffect(() => {
    setCurrentPage(1);
    if (viewMode === 'card') {
      const initialCards = filteredColors.slice(0, 12);
      setDisplayedCards(initialCards);
      setHasMoreCards(filteredColors.length > 12);
    }
  }, [searchQuery, viewMode, filteredColors]);

  // Handle page change for list view
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle lazy loading for card view
  const handleLoadMoreCards = () => {
    const currentCardCount = displayedCards.length;
    const nextCards = filteredColors.slice(currentCardCount, currentCardCount + 12);
    
    if (nextCards.length > 0) {
      setDisplayedCards([...displayedCards, ...nextCards]);
      setHasMoreCards(currentCardCount + nextCards.length < filteredColors.length);
    } else {
      setHasMoreCards(false);
    }
  };

  // Reset pagination when view mode changes
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setCurrentPage(1);
    if (mode === 'card') {
      const initialCards = filteredColors.slice(0, 12);
      setDisplayedCards(initialCards);
      setHasMoreCards(filteredColors.length > 12);
    }
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
    // Don't clear success message here - let AlertMessage handle it
    // setSuccess("");
  };

  // Clear form after successful operations
  const clearForm = () => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError("Color Name is required");
      return;
    }

    if (!formData.code.trim()) {
      setError("Color Code is required");
      return;
    }

    try {
      setLoading(true);
      setSuccess(""); // Clear any existing success message
      setError(""); // Clear any existing error message

      let colorData;
      
      if (formData.image) {
        // Use FormData for file upload (new image selected)
        colorData = new FormData();
        colorData.append('name', formData.name.trim());
        colorData.append('code', formData.code.trim());
        colorData.append('isActive', formData.isActive ? 'true' : 'false');
        colorData.append('image', formData.image);
      } else if (editingId && currentImageUrl) {
        // Use JSON for update without image change (keep existing image)
        colorData = {
          name: formData.name.trim(),
          code: formData.code.trim(),
          isActive: formData.isActive
        };
      } else {
        // Use JSON for new color without image
        colorData = {
          name: formData.name.trim(),
          code: formData.code.trim(),
          isActive: formData.isActive
        };
      }

      if (editingId) {
        // Update color
        await api.put(`/colors/${editingId}`, colorData);
        const action = formData.image ? "updated with new image" : "updated successfully";
        setSuccess(`Color "${formData.name.trim()}" ${action}!`);
      } else {
        // Create color
        await api.post('/colors', colorData);
        const action = formData.image ? "created with image" : "created successfully";
        setSuccess(`Color "${formData.name.trim()}" ${action}!`);
      }

      // Refresh colors list
      await fetchColors();
      // Don't call resetForm() here - let AlertMessage handle the lifecycle
      clearFileInput(); // Clear file input after successful upload
      
    } catch (err) {
      const action = editingId ? "update" : "create";
      setError(err.response?.data?.msg || `Failed to ${action} color. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (color) => {
    setFormData({
      ...initialFormData,
      name: color.name || "",
      code: "#000000", // Always set to black when editing
      image: null, // Reset image field for new file selection
      isActive: true // Always set to active when editing
    });
    setCurrentImageUrl(color.image || null); // Store current image URL separately
    setEditingId(color._id);
    setError("");
    setSuccess("");
    
    // Scroll to form and focus on color name input
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
      if (colorNameInputRef.current) {
        colorNameInputRef.current.focus();
      }
    }, 100);
  };

  const handleDelete = (colorId) => {
    // Find the color to check if it's already marked as deleted
    const color = colors.find(c => c._id === colorId);
    const isAlreadyDeleted = color?.deleted;
    
    let message;
    let isPermanentDelete = false;
    
    if (isAlreadyDeleted) {
      message = "This color is already marked as deleted. Click OK to permanently remove it from the database. This action cannot be undone.";
      isPermanentDelete = true;
    } else {
      message = "This will mark the color as inactive and add a deleted flag. Click OK to continue.";
      isPermanentDelete = false;
    }
    
    setDeletePopup({
      isVisible: true,
      colorId,
      message,
      isPermanentDelete,
      action: "delete"
    });
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    const { colorId, isPermanentDelete } = deletePopup;
    const color = colors.find(c => c._id === colorId);
    
    try {
      setLoading(true);
      setSuccess(""); // Clear any existing success message
      setError(""); // Clear any existing error message
      
      if (isPermanentDelete) {
        // Permanent deletion
        await api.delete(`/colors/${colorId}/hard`);
        setSuccess(`🗑️ Color "${color.name}" has been permanently deleted from the database.`);
      } else {
        // Soft delete - mark as inactive and add deleted flag
        await api.delete(`/colors/${colorId}`);
        setSuccess(`⏸️ Color "${color.name}" has been marked as deleted and inactive.`);
      }
      
      await fetchColors();
    } catch (err) {
      const action = isPermanentDelete ? "permanently delete" : "mark as deleted";
      setError(`❌ Failed to ${action} color "${color.name}". ${err.response?.data?.msg || 'Please try again.'}`);
    } finally {
      setLoading(false);
      setDeletePopup({
        isVisible: false,
        colorId: null,
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
      colorId: null,
      message: "",
      isPermanentDelete: false,
      action: "delete"
    });
  };

  // Revert deleted color
  const handleRevert = async (colorId) => {
    const color = colors.find(c => c._id === colorId);
    
    if (!color) {
      setError("Color not found");
      return;
    }

    if (!color.deleted) {
      setError("This color is not deleted");
      return;
    }

    setDeletePopup({
      isVisible: true,
      colorId,
      message: `Are you sure you want to restore the color "${color.name}"? This will make it active again.`,
      isPermanentDelete: false,
      action: "revert"
    });
  };

  // Handle revert confirmation
  const handleRevertConfirm = async () => {
    const { colorId } = deletePopup;
    const color = colors.find(c => c._id === colorId);
    
    try {
      setLoading(true);
      setSuccess("");
      setError("");

      // Check if there's already an active or inactive color with the same name
      const existingColor = colors.find(c => 
        c._id !== colorId && // Exclude current color being reverted
        c.name.toLowerCase().trim() === color.name.toLowerCase().trim() && // Same name
        !c.deleted // Not deleted (active or inactive)
      );

      if (existingColor) {
        const status = existingColor.isActive ? 'Active' : 'Inactive';
        const suggestion = existingColor.isActive ? 
          `Consider deleting the active color "${existingColor.name}" first, or use a different name for the restored color.` :
          `Consider deleting the inactive color "${existingColor.name}" first, or use a different name for the restored color.`;
        
        setError(`❌ Cannot restore color "${color.name}". A ${status.toLowerCase()} color with this name already exists. ${suggestion}`);
        setLoading(false);
        setDeletePopup({
          isVisible: false,
          colorId: null,
          message: "",
          isPermanentDelete: false,
          action: "delete"
        });
        return;
      }

      // Revert the color by setting deleted to false and isActive to true
      await api.put(`/colors/${colorId}`, {
        name: color.name,
        code: color.code,
        isActive: true,
        deleted: false
      });

      setSuccess(`✅ Color "${color.name}" has been restored and is now active!`);
      await fetchColors();
    } catch (err) {
      setError(`❌ Failed to restore color "${color.name}". ${err.response?.data?.msg || 'Please try again.'}`);
    } finally {
      setLoading(false);
      setDeletePopup({
        isVisible: false,
        colorId: null,
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
      colorId: null,
      message: "",
      isPermanentDelete: false,
      action: "delete"
    });
  };

  const handleCancel = () => {
    resetForm();
  };

  // Get status information for display
  const getStatusInfo = (color) => {
    if (color.deleted) {
      return { text: 'Deleted', className: 'deleted' };
    }
    return color.isActive 
      ? { text: 'Active', className: 'active' } 
      : { text: 'Inactive', className: 'inactive' };
  };

  return (
    <div className="paddingAll20">
      {/* Header */}
      <PageHeader
        title="Color Management"
        subtitle="Manage your product colors and variants"
        isEditing={!!editingId}
        editText="Edit Color"
        createText="Add New Color"
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

      {/* Color Form */}
      <div className="brandFormContainer paddingAll32 appendBottom30" ref={formRef}>
        <form onSubmit={handleSubmit} className="brandForm">
          <div className="makeFlex row gap10">
            <div className="fullWidth">
              <FormField
                ref={colorNameInputRef}
                type="text"
                name="name"
                label="Color Name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter Color Name (e.g., Black)"
                required={true}
              />
            </div>
          </div>

          <div className="makeFlex row gap10">
            <div className="fullWidth">
              <FormField
                type="text"
                name="code"
                label="Color Code"
                value={formData.code}
                onChange={handleChange}
                placeholder="Enter Color Code (e.g., #000000)"
                required={true}
                info="Type hex color code manually (e.g., #000000 for black)"
              />
            </div>
          </div>

          <div className="makeFlex row gap10">
            <div className="fullWidth">
              {editingId && currentImageUrl ? (
                // Show current image info when editing
                <div className="currentImageInfo">
                  <label className="formLabel appendBottom8">Current Image</label>
                  <div className="currentImageDisplay makeFlex alignCenter gap12">
                    <img 
                      src={currentImageUrl} 
                      alt="Current color image" 
                      className="currentImagePreview"
                      style={{ 
                        width: '60px', 
                        height: '60px', 
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '2px solid #e5e7eb'
                      }}
                      onError={(e) => {
                        console.error('Current image failed to load:', currentImageUrl);
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="currentImageDetails">
                      <p className="font14 fontSemiBold blackText">Current image is set</p>
                      <p className="font12 grayText">Upload a new file to replace it</p>
                    </div>
                  </div>
                  <FormField
                    type="file"
                    name="image"
                    label="Replace Image (Optional)"
                    onChange={handleChange}
                    accept="image/*"
                    info="Upload a new image to replace the current image"
                  />
                </div>
              ) : (
                // Show file input for new colors
                <FormField
                  type="file"
                  name="image"
                  label="Color Image (Optional)"
                  onChange={handleChange}
                  accept="image/*"
                  info="Upload an image to represent this color variant"
                />
              )}
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
              <p className="negativeMarginTop10">Check this box to keep the color active, uncheck to mark as inactive</p>
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
                <span>{editingId ? "Update Color" : "Add Color"}</span>
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
                Add Another Color
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Colors List */}
      <div className="brandsListContainer paddingAll32">
        <div className="listHeader makeFlex spaceBetween alignCenter appendBottom24">
          <div className="leftSection">
            <h2 className="listTitle font30 fontBold blackText">Colors ({filteredColors.length})</h2>
            <StatusFilter
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              counts={calculateStandardStatusCounts(colors)}
              disabled={loading}
            />
          </div>
          <div className="rightSection makeFlex alignCenter gap10">
            <SearchField
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search colors..."
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

        {filteredColors.length === 0 && !loading ? (
          <div className="emptyState textCenter paddingAll60">
            <div className="emptyIcon appendBottom16">🎨</div>
            <h3 className="font22 fontSemiBold grayText appendBottom8">No Colors Found</h3>
            <p className="font16 grayText">Start by adding your first color above</p>
          </div>
        ) : (
          <>
            {/* Card View */}
            {viewMode === 'card' && (
              <div className="brandsGrid">
                {displayedCards.map((color) => {
                  const statusInfo = getStatusInfo(color);
                  return (
                    <EntityCard
                      key={color._id}
                      entity={color}
                      logoField="image"
                      nameField="name"
                      idField="_id"
                      onEdit={color.deleted ? undefined : handleEdit}
                      onDelete={handleDelete}
                      onRevert={color.deleted ? () => handleRevert(color._id) : undefined}
                      loading={loading}
                      imagePlaceholderColor={color.code || generateEntityColor(color._id, color.name)}
                      renderHeader={(color) => (
                        <EntityCardHeader
                          entity={color}
                          imageField="image"
                          titleField="name"
                          dateField="createdAt"
                          generateColor={generateEntityColor}
                        />
                      )}
                      renderDetails={(color) => (
                        <>
                          <div className="brandDetail makeFlex spaceBetween alignCenter paddingTop8 paddingBottom8">
                            <span className="detailLabel font14 fontSemiBold grayText textUppercase">Color ID:</span>
                            <span className="detailValue font14 blackText appendLeft6">{color._id || 'N/A'}</span>
                          </div>
                          <div className="brandDetail makeFlex spaceBetween alignCenter paddingTop8 paddingBottom8">
                            <span className="detailLabel font14 fontSemiBold grayText textUppercase">Name:</span>
                            <span className="detailValue font14 blackText appendLeft6">{color.name}</span>
                          </div>
                          <div className="brandDetail makeFlex spaceBetween alignCenter paddingTop8 paddingBottom8">
                            <span className="detailLabel font14 fontSemiBold grayText textUppercase">Code:</span>
                            <span className="detailValue font14 blackText appendLeft6">{color.code}</span>
                          </div>
                          <div className="brandDetail makeFlex spaceBetween alignCenter paddingTop8 paddingBottom8">
                            <span className="detailLabel font14 fontSemiBold grayText textUppercase">Status:</span>
                            <span className={`detailValue font14 ${statusInfo.className === 'active' ? 'greenText' : statusInfo.className === 'deleted' ? 'redText' : 'orangeText'} appendLeft6`}>
                              {statusInfo.text}
                            </span>
                          </div>
                        </>
                      )}
                      renderActions={(color) => (
                        <ActionButtons
                          onEdit={color.deleted ? undefined : () => handleEdit(color)}
                          onDelete={() => handleDelete(color._id)}
                          onRevert={color.deleted ? () => handleRevert(color._id) : undefined}
                          loading={loading}
                          size="normal"
                          deleteText={color.deleted ? "🗑️ Final Del" : "🗑️ Delete"}
                          deleteTitle={color.deleted ? "Permanently delete this color" : "Mark color as deleted"}
                          revertText="🔄 Restore"
                          revertTitle="Restore this deleted color"
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
                        <th className="tableHeader">Color</th>
                        <th className="tableHeader">Name</th>
                        <th className="tableHeader">Code</th>
                        <th className="tableHeader">Status</th>
                        <th className="tableHeader">Created</th>
                        <th className="tableHeader">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentColors.map((color) => {
                        const statusInfo = getStatusInfo(color);
                        return (
                          <tr key={color._id} className="tableRow">
                            <td className="tableCell">
                              <span className="colorCodeText">{color.code}</span>
                            </td>
                            <td className="tableCell">
                              <span className="brandNameText">{color.name}</span>
                            </td>
                            <td className="tableCell">
                              <span className="brandIdText">{color.code}</span>
                            </td>
                            <td className="tableCell">
                              <span className={`statusText ${statusInfo.className}`}>
                                {statusInfo.text}
                              </span>
                            </td>
                            <td className="tableCell">
                              <span className="dateText">
                                {new Date(color.createdAt).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="tableCell">
                              <div className="tableActions makeFlex gap8">
                                <ActionButtons
                                  onEdit={color.deleted ? undefined : () => handleEdit(color)}
                                  onDelete={() => handleDelete(color._id)}
                                  onRevert={color.deleted ? () => handleRevert(color._id) : undefined}
                                  loading={loading}
                                  size="small"
                                  editText="✏️"
                                  deleteText={color.deleted ? "🗑️" : "🗑️"}
                                  revertText="🔄"
                                  editTitle="Edit Color"
                                  deleteTitle={color.deleted ? "Final Del" : "Delete Color"}
                                  revertTitle="Restore Color"
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

export default ColorManager;
