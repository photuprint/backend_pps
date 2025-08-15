import React from "react";
import AttributeManager from "../common/AttributeTemplate";

const CountryOfOriginManager = () => (
  <AttributeManager
    attributeName="Country of Origin"
    apiEndpoint="/api/countries"
    placeholder="e.g., India"
  />
);

export default CountryOfOriginManager;
