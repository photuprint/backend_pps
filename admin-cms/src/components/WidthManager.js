import React from "react";
import AttributeManager from "../common/AttributeTemplate";

const WidthManager = () => (
  <AttributeManager
    attributeName="Width"
    apiEndpoint="/api/widths"
    placeholder="e.g., 30cm"
    type="numeric" 
    showUnit
  />
);

export default WidthManager;
