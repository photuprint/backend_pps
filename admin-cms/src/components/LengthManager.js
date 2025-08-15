import React from "react";
import AttributeManager from "../common/AttributeTemplate";

const LengthManager = () => (
  <AttributeManager
    attributeName="Length"
    apiEndpoint="/api/lengths"
    placeholder="e.g., 100cm"
    type="numeric" 
    showUnit
  />
);

export default LengthManager;
