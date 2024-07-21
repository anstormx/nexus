import React from "react";
import { Modal } from "antd";
import Image from "next/image";

function TokenSelectionModal({ isOpen, setIsOpen, tokenList, modifyToken }) {
  return (
    <Modal
      open={isOpen}
      footer={null}
      onCancel={() => setIsOpen(false)}
      title="Select a token"
      className="custom-modal"
    >
      <div className="flex flex-col gap-2.5 mt-5 pt-5">
        {tokenList?.map((e, i) => (
          <div
            className="flex items-center px-4 py-2.5 hover:bg-[#18181b] cursor-pointer text-white rounded-xl transition duration-200"
            key={i}
            onClick={() => modifyToken(i)}
          >
            <Image
              src={`${e.logoURI}`}
              alt={e.symbol}
              width={24}
              height={24}
            />
            <div className="ml-2.5">
              <div className="text-base font-medium">{e.name}</div>
              <div className="text-sm font-light text-[#ababac]">
                {e.symbol}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export default TokenSelectionModal;