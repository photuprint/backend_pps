import React from "react";
import AttributeManager from "../common/AttributeTemplate";

const FitTypeManager = () => (
  <AttributeManager
    attributeName="Fit Type"
    apiEndpoint="/api/fit-types"
    placeholder="e.g., Slim Fit"
  />
);

export default FitTypeManager;
