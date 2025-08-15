import React from "react";
import AttributeManager from "../common/AttributeTemplate";

const HeightManager = () => (
  <AttributeManager
    attributeName="Height"
    apiEndpoint="/api/heights"
    placeholder="e.g., 50cm"
    type="numeric" 
    showUnit
  />
);

export default HeightManager;
