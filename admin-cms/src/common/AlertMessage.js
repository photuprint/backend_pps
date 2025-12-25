import React, { useState, useEffect, useCallback } from 'react';

const AlertMessage = ({ 
  type = 'success', // 'success' or 'error'
  message, 
  onClose, 
  autoClose = true,
  autoCloseDelay = 5000,
  className = "" 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldHide, setShouldHide] = useState(false);

  const handleClose = useCallback(() => {
    console.log('handleClose called - starting slide out animation');
    setShouldHide(true);
    
    // Wait for slide out animation to complete (300ms)
    setTimeout(() => {
      console.log('Slide out animation completed - hiding popup');
      setIsVisible(false);
      setShouldHide(false);
      // Only call onClose when the popup is actually closing
      if (onClose) {
        console.log('Calling onClose callback');
        onClose();
      }
    }, 300); // Wait for slide out animation
  }, [onClose]);

  useEffect(() => {
    console.log('AlertMessage useEffect - message:', message, 'type:', type);
    
    if (message && message.trim()) {
      console.log('Setting popup visible with slide in animation');
      setIsVisible(true);
      setShouldHide(false);
      
      // Auto close after delay
      if (autoClose) {
        console.log('Setting auto-close timer for', autoCloseDelay, 'ms');
        const timer = setTimeout(() => {
          console.log('Auto-close timer fired - starting slide out animation');
          handleClose();
        }, autoCloseDelay);
        return () => clearTimeout(timer);
      }
    } else if (isVisible && !shouldHide) {
      console.log('Message became empty, starting slide out animation');
      // If message is empty and we're not already hiding, start slide out
      handleClose();
    }
  }, [message, autoClose, autoCloseDelay, handleClose, isVisible, shouldHide]);

  console.log('AlertMessage render - message:', message, 'isVisible:', isVisible, 'shouldHide:', shouldHide);

  if (!message || !message.trim() || !isVisible) {
    console.log('AlertMessage not rendering - message:', message, 'isVisible:', isVisible);
    return null;
  }

  const alertClasses = type === 'success' ? 'alertMessageSuccess' : 'alertMessageError';
  const icon = type === 'success' ? '✓' : '✕';
  const title = type === 'success' ? 'Success!' : 'Error!';

  console.log('AlertMessage rendering popup with animation class:', shouldHide ? 'slideOut' : 'slideIn');

  return (
    <div className="alertMessageOverlay">
      <div className={`alertMessageBox ${alertClasses} ${className} ${shouldHide ? 'slideOut' : 'slideIn'}`}>
        <div className="alertMessageHeader">
          <div className="alertMessageIcon">
            {icon}
          </div>
          <div className="alertMessageTitle">
            {title}
          </div>
          <button 
            onClick={handleClose} 
            className="alertMessageCloseBtn"
            aria-label="Close alert"
          >
            ×
          </button>
        </div>
        <div className="alertMessageContent">
          {message}
        </div>
      </div>
    </div>
  );
};

export default AlertMessage; 