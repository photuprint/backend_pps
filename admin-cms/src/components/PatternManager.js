import React from "react";
import AttributeManager from "../common/AttributeTemplate";

const PatternManager = () => (
  <AttributeManager
    attributeName="Pattern"
    apiEndpoint="/api/patterns"
    placeholder="e.g., Stripes"
  />
);

export default PatternManager;
