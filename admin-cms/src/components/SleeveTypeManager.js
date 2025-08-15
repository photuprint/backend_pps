import React from "react";
import AttributeManager from "../common/AttributeTemplate";

const SleeveTypeManager = () => (
  <AttributeManager
    attributeName="Sleeve Type"
    apiEndpoint="/api/sleeve-types"
    placeholder="e.g., Short Sleeve"
  />
);

export default SleeveTypeManager;
