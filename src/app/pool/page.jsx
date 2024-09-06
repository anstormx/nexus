"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { toast } from "react-toastify";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronDown, Settings } from "lucide-react";
import tokenList from "../../utils/tokenList.json";
import liquidity from "../../utils/liquidity.json";
import Header from "../components/header";
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
    if (/^\d*\.?\d*$/.test(newValue)) {
      setValue(newValue);
    }
  };

  if (!isMounted) return null;

  return (
    <div>
      <Header />
      <div className="container mx-auto px-4 py-16">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-6xl font-bold text-center mb-12 bg-gradient-to-r from-pink-500 to-yellow-500 text-transparent bg-clip-text"
        >
          Add Liquidity
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-md mx-auto bg-zinc-900 rounded-3xl p-6 shadow-lg"
        >
          <h2 className="text-2xl font-semibold mb-6">Provide Liquidity</h2>

          <InputBox
            token={tokenA}
            amount={amountA}
            setAmount={setAmountA}
            tokenType="A"
            openModal={openModal}
          />
          <InputBox
            token={tokenB}
            amount={amountB}
            setAmount={setAmountB}
            tokenType="B"
            openModal={openModal}
          />
          <input
            placeholder="Tick Lower"
            value={tickLower}
            onChange={(e) => onlyNum(e, setTickLower)}
            className="w-full bg-zinc-800 text-white h-12 mb-4 text-lg rounded-xl placeholder:text-gray-400 px-4 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <input
            placeholder="Tick Upper"
            value={tickUpper}
            onChange={(e) => onlyNum(e, setTickUpper)}
            className="w-full bg-zinc-800 text-white h-12 mb-4 text-lg rounded-xl placeholder:text-gray-400 px-4 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />

          <button
            className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition duration-300 ${
              !isConnected ||
              !amountA ||
              !amountB ||
              !tickLower ||
              !tickUpper ||
              loading
                ? "bg-pink-500/50 cursor-not-allowed"
                : "bg-pink-500 hover:bg-pink-600"
            }`}
            onClick={handleAddLiquidity}
            disabled={
              !isConnected ||
              !amountA ||
              !amountB ||
              !tickLower ||
              !tickUpper ||
              loading
            }
          >
            {isConnected
              ? loading
                ? "Adding Liquidity..."
                : "Add Liquidity"
              : "Connect Wallet"}
          </button>
        </motion.div>

        <p className="text-gray-400 text-base mt-12 text-center">
          Provide liquidity to earn fees and rewards. Support your
          <br />
          favorite token pairs on multiple chains.
        </p>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-lg p-6 w-96">
            <h3 className="text-xl font-semibold mb-4">Select a token</h3>
            <div className="max-h-96 overflow-y-auto">
              {tokenList.map((token, i) => (
                <button
                  key={i}
                  className="w-full flex items-center p-2 hover:bg-zinc-700 rounded-lg transition-colors"
                  onClick={() => modifyToken(i)}
                >
                  <Image
                    src={token.logoURI}
                    alt={token.symbol}
                    width={24}
                    height={24}
                    className="mr-2"
                  />
                  <span>{token.name}</span>
                  <span className="ml-auto text-gray-400">{token.symbol}</span>
                </button>
              ))}
            </div>
            <button
              className="mt-4 w-full bg-zinc-700 hover:bg-zinc-600 py-2 rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InputBox({ token, amount, setAmount, tokenType, openModal }) {
  const onlyNum = (e) => {
    const newValue = e.target.value;
    if (/^\d*\.?\d*$/.test(newValue) || newValue === "") {
      setAmount(newValue);
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center bg-zinc-800 rounded-xl p-4">
        <input
          placeholder="0"
          value={amount}
          onChange={onlyNum}
          className="bg-transparent text-white text-3xl w-full focus:outline-none"
          type="text"
          inputMode="decimal"
        />
        <button
          className="flex items-center bg-zinc-700 hover:bg-zinc-600 px-3 py-2 rounded-lg transition-colors"
          onClick={() => openModal(tokenType)}
        >
          <Image
            src={token.logoURI}
            alt={token.symbol}
            width={24}
            height={24}
            className="mr-2"
          />
          <span>{token.symbol}</span>
          <ChevronDown className="ml-2 h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
