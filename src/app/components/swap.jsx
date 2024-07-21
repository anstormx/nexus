import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Input, Popover, Modal, Select } from "antd";
import { DownOutlined, SettingOutlined } from "@ant-design/icons";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import Image from "next/image";

import tokenList from "../../utils/tokenList.json";
import SwapV1 from "../../utils/SwapV1.json";
import liquidity from "../../utils/liquidity.json";
import erc20 from "../../utils/dai.json";
import { useIsMounted } from "@/hooks/useIsMounted";
import Footer from "./footer";

function Swap() {
  const [isOpen, setIsOpen] = useState(false);
  const [changeToken, setChangeToken] = useState(null);
  const [numInputTokens, setNumInputTokens] = useState(1);
  const [inputTokens, setInputTokens] = useState([
    { token: tokenList[0], amount: "" },
  ]);
  const [outputToken, setOutputToken] = useState(tokenList[2]);
  const [outputAmount, setOutputAmount] = useState(null);
  const [swapContract, setSwapContract] = useState(null);
  const [liquidityContract, setLiquidityContract] = useState(null);
  const [signer, setSigner] = useState(null);
  const [loading, setLoading] = useState(false);

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
          setSigner(signer);

          const multiTokenSwapContract = new ethers.Contract(
            SwapV1.address,
            SwapV1.abi,
            signer
          );
          setSwapContract(multiTokenSwapContract);

          const liquidityContract = new ethers.Contract(
            liquidity.address,
            liquidity.abi,
            signer
          );
          setLiquidityContract(liquidityContract);
        }
      }
    };

    if (isMounted) {
      initContract();
    }
  }, [isMounted]);

  // Fetch price of output token
  const fetchPrice = useCallback(
    async (inputToken, outputToken, inputAmount) => {
      if (!swapContract) return;

      try {
        const inputTokenAddress = ethers.getAddress(inputToken.address);
        const outputTokenAddress = ethers.getAddress(outputToken.address);
        const amountIn = ethers.parseUnits(inputAmount, inputToken.decimals);

        const quotedAmountOut = await swapContract.getAmountOut(
          inputTokenAddress,
          outputTokenAddress,
          amountIn
        );

        // const price = 1000000000000 * inputAmount;

        return ethers.formatUnits(quotedAmountOut, outputToken.decimals);
      } catch (error) {
        toast.error("Error fetching price. Please try again.");
        console.log("Error fetching price:", error);
        return null;
      }
    },
    [swapContract]
  );

  const handleSwap = async () => {
    setLoading(true);

    if (!swapContract || !isConnected) {
      toast.error("Please connect your wallet first.");
      setLoading(false);
      return;
    }

    toast.info("Swapping tokens. Please wait...");

    try {
      const tokenInAddresses = inputTokens.map((input) =>
        ethers.getAddress(input.token.address)
      );

      const amountsIn = inputTokens.map((input) => {
        if (!input.amount) return BigInt(0);
        return ethers.parseUnits(input.amount, input.token.decimals);
      });

      // Check balances
      for (let i = 0; i < inputTokens.length; i++) {
        const tokenContract = new ethers.Contract(
          tokenInAddresses[i],
          erc20.abi,
          signer
        );

        try {
          const balance = await tokenContract.balanceOf(address);
          const decimals = await tokenContract.decimals();
          const symbol = await tokenContract.symbol();

          if (amountsIn[i] === BigInt(0)) {
            toast.error(`Please enter an amount for ${symbol}`);
            setLoading(false);
            return;
          }
    
          const amountIn = ethers.parseUnits(inputTokens[i].amount, decimals)

          if (balance < amountIn) {
            toast.error(
              `Insufficient balance for ${inputTokens[i].token.symbol}`
            );
            setLoading(false);
            return;
          } else {
            toast.success(`Sufficient balance of ${inputTokens[i].token.symbol}`);
          }
        } catch (error) {
          toast.error(`Insufficient balance for ${inputTokens[i].token.symbol}`);
          console.log(`Error checking balance of ${inputTokens[i].token.symbol}:`, error);
          setLoading(false);
          return;
        }
      }

      const tokenOutAddress = ethers.getAddress(outputToken.address);

      // Approve spending of tokens
      for (let i = 0; i < inputTokens.length; i++) {
        const tokenContract = new ethers.Contract(
          tokenInAddresses[i],
          [
            "function approve(address spender, uint256 amount) public returns (bool)",
          ],
          signer
        );

        try {
          const approveTx = await tokenContract.approve(
            SwapV1.address,
            amountsIn[i],
            { gasLimit: ethers.parseUnits("500000", "wei") }
          );
          await approveTx.wait();
        } catch (error) {
          console.log(`Error approving ${inputTokens[i].token.symbol}:`, error);
          toast.error(
            `Error approving ${inputTokens[i].token.symbol}. Please try again.`
          );
          setLoading(false);
          return;
        }
      }
      console.log("Approved spending of tokens");

      // Call the swapTokens function
      const tx = await swapContract.swapTokens(
        tokenInAddresses,
        amountsIn,
        tokenOutAddress,
        { gasLimit: ethers.parseUnits("500000", "wei") }
      );
      await tx.wait();

      toast.success("Swap successful!");

      // Reset input amounts
      setInputTokens((prevTokens) =>
        prevTokens.map((token) => ({ ...token, amount: "" }))
      );
      setOutputAmount(null);
    } catch (error) {
      console.error("Error during swap:", error);
      toast.error("Error during swap. Please try again.");
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
      if (changeToken === "output") {
        setOutputToken(tokenList[i]);
        setOutputAmount("");
      } else {
        setInputTokens((prevTokens) => {
          const newTokens = [...prevTokens];
          newTokens[changeToken] = {
            ...newTokens[changeToken],
            token: tokenList[i],
            amount: "",
          };
          return newTokens;
        });
      }
    },
    [changeToken]
  );

  const handleInputChange = useCallback(
    async (index, value) => {
      setInputTokens((prevTokens) => {
        const newTokens = [...prevTokens];
        newTokens[index] = { ...newTokens[index], amount: value };
        return newTokens;
      });

      if (value && liquidityContract) {
        const price = await fetchPrice(
          inputTokens[index].token,
          outputToken,
          value
        );
        setOutputAmount(price);
      } else {
        setOutputAmount(null);
      }
    },
    [inputTokens, outputToken, liquidityContract, fetchPrice]
  );

  const handleNumInputTokensChange = useCallback(
    (value) => {
      const newInputTokens = [...inputTokens];
      while (newInputTokens.length < value) {
        newInputTokens.push({ token: tokenList[0], amount: "" });
      }
      setNumInputTokens(value);
      setInputTokens(newInputTokens.slice(0, value));
    },
    [inputTokens]
  );

  const settings = useMemo(
    () => (
      <div>
        <div className="mb-2 text-white">Number of Input Tokens</div>
        <div>
          <Select
            value={numInputTokens}
            onChange={handleNumInputTokensChange}
            style={{ width: "50%" }}
          >
            {[...Array(4).keys()].map((i) => (
              <Select.Option key={i + 1} value={i + 1}>
                {i + 1}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>
    ),
    [numInputTokens, handleNumInputTokensChange]
  );

  if (!isMounted) return null;

  return (
    <div>
      {/* Background and title */}
      <div className="fixed inset-0 bg-cover bg-center blur-sm z-[-1] bg-[url('https://coincodex.com/en/resources/images//admin/news/5-best-crypto-to-buy/best-crypto-to-buy-before-bitcoin-halving-2023.png:resizeboxcropjpg?1600x900')] animate-background-move"></div>{" "}
      <div className="text-center text-6xl font-semibold mt-[2%]">
        Swap anytime, <br /> anywhere.
      </div>
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
      {/* Main swap interface */}
      <div className="w-[28%] bg-zinc-950 rounded-3xl mx-auto p-3 mt-10">
        {/* Slippage settings */}
        <div className="flex flex-row w-full justify-between">
          <div className="text-xl font-semibold mb-1 text-gray-300">Sell</div>
          <div>
            <Popover
              content={settings}
              trigger="click"
              overlayClassName="custom-popover"
            >
              <SettingOutlined className="text-gray-300 hover:text-white transition-all duration-300 hover:rotate-90 cursor-pointer" />
            </Popover>
          </div>
        </div>

        <div className="relative w-full">
          {/* Input token fields */}
          {inputTokens.slice(0, numInputTokens).map((input, index) => (
            <InputBox
              key={index}
              input={input}
              index={index}
              handleInputChange={handleInputChange}
              openModal={openModal}
            />
          ))}

          {/* Output token field */}
          <div className="text-xl font-semibold mb-1 text-gray-300">Buy</div>
          <InputBox
            input={{ token: outputToken, amount: outputAmount }}
            index="output"
            handleInputChange={() => {}}
            openModal={openModal}
          />
        </div>

        {/* Swap button */}
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
      </div>
      {/* Footer */}
      <div>
        <p className="text-gray-400 text-base mt-6 text-center mb-[5.8%]">
          The largest onchain marketplace. Buy and sell crypto
          <br />
          on Ethereum and 7+ other chains.
        </p>
        <Footer />
      </div>
    </div>
  );
}

function InputBox({ input, index, handleInputChange, openModal }) {
  const [localAmount, setLocalAmount] = useState(input.amount);

  const handleLocalChange = (e) => {
    const newValue = e.target.value;
    setLocalAmount(newValue);
  };

  const handleBlur = () => {
    handleInputChange(index, localAmount);
  };

  useEffect(() => {
    setLocalAmount(input.amount);
  }, [input.amount]);

  return (
    <div>
      <div className="relative">
        <Input
          placeholder="0"
          value={localAmount}
          onChange={handleLocalChange}
          onBlur={handleBlur}
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

export default Swap;
