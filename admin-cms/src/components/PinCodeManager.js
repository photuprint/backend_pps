import React from "react";
import AttributeManager from "../common/AttributeTemplate";

const PinCodeManager = () => (
  <AttributeManager
    attributeName="Pin Code"
    apiEndpoint="/api/pin-codes"
    placeholder="e.g., 110001"
    type="numeric"
  />
);

export default PinCodeManager;
