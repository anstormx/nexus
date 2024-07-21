import React from "react";
import { Select } from "antd";

function SwapSettings({ numInputTokens, handleNumInputTokensChange }) {
  return (
    <div>
      <div className="mb-2 text-white">Number of Input Tokens</div>
      <div>
        <Select
          value={numInputTokens}
          onChange={handleNumInputTokensChange}
          style={{ width: "50%" }}
        >
          {[...Array(3).keys()].map((i) => (
            <Select.Option key={i + 1} value={i + 1}>
              {i + 1}
            </Select.Option>
          ))}
        </Select>
      </div>
    </div>
  );
}

export default SwapSettings;