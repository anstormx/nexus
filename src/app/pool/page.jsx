"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { Input, Button, Select, Modal } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import Image from "next/image";
import tokenList from "../../utils/tokenList.json";
import liquidity from "../../utils/liquidity.json";
import Header from "../components/header";
import Footer from "../components/footer";
import { useIsMounted } from "@/hooks/useIsMounted";

export default function Pool() {
  const [tokenA, setTokenA] = useState(tokenList[0]);
  const [tokenB, setTokenB] = useState(tokenList[1]);
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [tickLower, setTickLower] = useState("");
  const [tickUpper, setTickUpper] = useState("");
  const [liquidityContract, setLiquidityContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [changeToken, setChangeToken] = useState(null);

  const { address, isConnected } = useAccount();

  const isMounted = useIsMounted();

  useEffect(() => {
    const initContract = async () => {
      if (typeof window.ethereum !== "undefined") {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();

          const contract = new ethers.Contract(
            liquidity.address,
            liquidity.abi,
            signer
          );
          setLiquidityContract(contract);
        }
      }
    };

    if (isMounted) {
      initContract();
    }
  }, [isMounted]);

  const handleAddLiquidity = async () => {
    setLoading(true);

    try {
      const tx = await liquidityContract.addLiquidity(
        tokenA.address,
        tokenB.address,
        ethers.parseUnits(amountA, tokenA.decimals),
        ethers.parseUnits(amountB, tokenB.decimals),
        parseInt(tickLower),
        parseInt(tickUpper)
      );

      await tx.wait();
      toast.success("Liquidity added successfully!");

      setAmountA("");
      setAmountB("");
      setTickLower("");
      setTickUpper("");
    } catch (error) {
      console.error("Error adding liquidity:", error);
      toast.error("Error adding liquidity. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openModal = useCallback((index) => {
    setChangeToken(index);
    setIsOpen(true);
  }, []);

  const modifyToken = useCallback(
    (i) => {
      setIsOpen(false);
      if (changeToken === "A") {
        setTokenA(tokenList[i]);
        setAmountA("");
      } else if (changeToken === "B") {
        setTokenB(tokenList[i]);
        setAmountB("");
      }
    },
    [changeToken]
  );

  const onlyNum = (e, setValue) => {
    const newValue = e.target.value;
    // Only allow numbers and a single decimal point
    if (/^\d*\.?\d*$/.test(newValue)) {
      setValue(newValue);
    }
  };

  if (!isMounted) return null;

  return (
    <div>
      <Header />
      {/* Token selection modal */}
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
      {/* Main content */}
      <div className="w-[28%] bg-zinc-950 rounded-3xl mx-auto p-3 mt-10">
        <h2 className="text-xl font-semibold mb-1 text-gray-300">
          Add Liquidity
        </h2>
        <InputBox
          token={tokenA}
          amount={amountA}
          setToken={setTokenA}
          setAmount={setAmountA}
          tokenType="A"
          openModal={openModal}
        />
        <InputBox
          token={tokenB}
          amount={amountB}
          setToken={setTokenB}
          setAmount={setAmountB}
          tokenType="B"
          openModal={openModal}
        />
        <Input
          placeholder="Tick Lower"
          value={tickLower}
          onChange={(e) => onlyNum(e, setTickLower)}
          className="custom-input text-white h-12 mb-1.5 text-lg rounded-xl placeholder:font-semibold"
        />
        <Input
          placeholder="Tick Upper"
          value={tickUpper}
          onChange={(e) => onlyNum(e, setTickUpper)}
          className="custom-input text-white h-12 mb-1.5 text-lg rounded-xl placeholder:font-semibold"
        />
        {/* Swap button */}
        <div
          className={`flex justify-center items-center bg-pink-500 w-full h-[55px] text-xl rounded-xl font-bold transition duration-300 ${
            !isConnected ||
            !amountA ||
            !amountB ||
            !tickLower ||
            !tickUpper ||
            loading ||
            true
              ? "opacity-40 cursor-not-allowed"
              : "hover:bg-pink-400 cursor-pointer"
          }`}
          onClick={() => {
            if (
              inputTokens.some((input) => input.amount) &&
              isConnected &&
              !loading
            ) {
              handleAddLiquidity();
            }
          }}
        >
          {isConnected ? "Add Liquidity" : "Connect Wallet"}
        </div>
      </div>
      {/* Footer */}
      <div>
        <p className="text-gray-400 text-base mt-6 text-center mb-[5.8%]">
          Provide liquidity to earn fees and rewards. Support your
          <br />
          favorite token pairs on multiple chains.
        </p>
        <div className="mt-[8%] mb-[0.5%]">
          <Footer />
        </div>
      </div>
    </div>
  );
}

function InputBox({
  token,
  amount,
  setToken,
  setAmount,
  tokenType,
  openModal,
}) {
  const onlyNum = (e) => {
    const newValue = e.target.value;
    // Only allow numbers and decimal point
    if (/^\d*\.?\d*$/.test(newValue) || newValue === "") {
      setAmount(newValue);
    }
  };

  return (
    <div className="mb-4">
      <div className="relative">
        <Input
          placeholder="0"
          value={amount}
          onChange={onlyNum}
          className="custom-input text-white h-24 mb-1.5 text-3xl rounded-xl placeholder:font-semibold"
          type="text"
          inputMode="decimal"
        />
        <div
          className="absolute top-1/2 right-5 -translate-y-1/2 bg-zinc-950 rounded-xl flex items-center gap-1.5 font-semibold text-base px-2 cursor-pointer py-1.5"
          onClick={() => openModal(tokenType)}
        >
          <Image
            src={`${token.logoURI}`}
            alt={token.symbol}
            width={24}
            height={24}
          />
          {token.symbol}
          <DownOutlined />
        </div>
      </div>
    </div>
  );
}
