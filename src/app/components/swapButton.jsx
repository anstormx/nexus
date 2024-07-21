import React from "react";

function SwapButton({ inputTokens, isConnected, loading, handleSwap }) {
  return (
    <div
      className={`flex justify-center items-center bg-pink-500 w-full h-[55px] text-xl rounded-xl font-bold transition duration-200 ${
        !inputTokens.some((input) => input.amount) ||
        !isConnected ||
        loading
          ? "opacity-40 cursor-not-allowed"
          : "hover:bg-pink-400 cursor-pointer"
      }`}
      onClick={() => {
        if (
          inputTokens.some((input) => input.amount) &&
          isConnected &&
          !loading
        ) {
          handleSwap();
        }
      }}
    >
      {isConnected ? "Swap" : "Connect Wallet"}
    </div>
  );
}

export default SwapButton;