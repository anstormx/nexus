import React from "react";
import { Input } from "antd";
import { DownOutlined } from "@ant-design/icons";
import Image from "next/image";

function InputBox({ input, index, handleInputChange, openModal }) {
  const handleLocalChange = (e) => {
    const newValue = e.target.value;
    handleInputChange(index, newValue);
  };

  return (
    <div>
      <div className="relative">
        <Input
          placeholder="0"
          value={input.amount}
          onChange={handleLocalChange}
          className="custom-input text-white h-24 mb-1.5 text-3xl rounded-xl placeholder:font-semibold"
        />
        <div
          className="absolute top-1/2 right-5 -translate-y-1/2 bg-zinc-950 rounded-xl flex items-center gap-1.5 font-semibold text-base px-2 cursor-pointer py-1.5"
          onClick={() => openModal(index)}
        >
          <Image
            src={`${input.token.logoURI}`}
            alt={input.token.symbol}
            width={24}
            height={24}
          />
          {input.token.symbol}
          <DownOutlined />
        </div>
      </div>
    </div>
  );
}

export default InputBox;