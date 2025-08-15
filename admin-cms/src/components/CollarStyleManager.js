import React from "react";
import AttributeManager from "../common/AttributeTemplate";

const CollarStyleManager = () => (
  <AttributeManager
    attributeName="Collar Style"
    apiEndpoint="/api/collar-styles"
    placeholder="e.g., Mandarin Collar"
  />
);

export default CollarStyleManager;
