import React, { useState, useCallback, useEffect } from "react";
import { Input, Popover, Modal, Select } from "antd";
import { DownOutlined, SettingOutlined } from "@ant-design/icons";
import tokenList from "../../utils/tokenList.json";
import { useAccount } from "wagmi";
import Footer from "./footer";
import abi from "../../utils/abi.json";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { useIsMounted } from "@/hooks/useIsMounted";
import { ChainId, Token, Fetcher, Route } from "@uniswap/sdk";

require("dotenv").config();

function Swap() {
  const [isOpen, setIsOpen] = useState(false);
  const [changeToken, setChangeToken] = useState(null);
  const [numInputTokens, setNumInputTokens] = useState(1);
  const [inputTokens, setInputTokens] = useState([
    { token: tokenList[0], amount: "" },
  ]);
  const [outputToken, setOutputToken] = useState(tokenList[2]);
  const [outputAmount, setOutputAmount] = useState(null);
  const [contract, setContract] = useState(null);
  const [signer, setSigner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState({});


  const { address, isConnected } = useAccount();

  const isMounted = useIsMounted();

  // Get contract
  useEffect(() => {
    const initContract = async () => {
      if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        setSigner(signer);

        const multiTokenSwapContract = new ethers.Contract(
          abi.address,
          abi.abi,
          signer
        );
        setContract(multiTokenSwapContract);
        console.log("Contract initialized");
      }
    };

    if (isMounted) {
      initContract();
    }
  }, [isMounted]);

  // Fetch prices from Uniswap
  useEffect(() => {
    const fetchPrices = async () => {
      const tokenPrices = {};

      const USDC = new Token(ChainId.MAINNET, ethers.getAddress("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"), 6);
      console.log(USDC);

      for (let i = 0; i < 2; i++) {
        const tokenData = tokenList[i];
        console.log(tokenData);

        const tokenAddress = ethers.getAddress(tokenData.address);
        console.log(tokenAddress);
        const token = new Token(tokenData.chainId, tokenAddress, tokenData.decimals);
        try {
          const pair = await Fetcher.fetchPairData(token, USDC, signer);
          if (!pair) {
            console.error(`No pair found for ${tokenData.symbol}`);
            continue;
          }
          const route = new Route([pair], Fetcher.WETH[token.chainId]);
          tokenPrices[tokenData.symbol] = route.midPrice.toSignificant(6);
        } catch (error) {
          console.error(`Error fetching price for ${tokenData.symbol}:`, error);
        }
      }
      console.log(tokenPrices);

      // setPrices(tokenPrices);
    };

    if (isMounted) {
      fetchPrices();
    }
  }, [isMounted, signer]);

  const handleSwap = async () => {
    setLoading(true);

    if (!contract || !isConnected) {
      toast.error("Please connect your wallet first.");
      return;
    }

    toast.info("Swapping tokens. Please wait...");

    try {
      const tokenInAddresses = inputTokens.map((input) => input.token.address);
      console.log(tokenInAddresses);

      const amountsIn = inputTokens.map((input) => {
        if (!input.amount) return BigInt(0);
        return ethers.parseUnits(input.amount, input.token.decimals);
      });
      console.log(amountsIn);

      const tokenOutAddress = outputToken.address;
      console.log(tokenOutAddress);

      // Approve spending of tokens
      for (let i = 0; i < inputTokens.length; i++) {
        const tokenContract = new ethers.Contract(
          tokenInAddresses[i],
          [
            "function approve(address spender, uint256 amount) public returns (bool)",
          ],
          signer
        );

        console.log(`Approving ${inputTokens[i].token.symbol}`);

        // const approveTx = await tokenContract.approve(
        //   abi.implementationAddress,
        //   amountsIn[i]
        // );

        // await approveTx.wait();

        console.log(`Approved ${inputTokens[i].token.symbol}`);
      }

      // Call the swapTokens function
      if (contract) {

        console.log("Swapping tokens");
        console.log(tokenInAddresses);
        console.log(amountsIn);
        console.log(tokenOutAddress);

        const tx = await contract.swapTokens(
          tokenInAddresses,
          amountsIn,
          tokenOutAddress
        );
        await tx.wait();

        toast.success("Swap successful!");
        setLoading(false);
      } else {
        toast.error("Contract not found");
        setLoading(false);
      }
    } catch (error) {
      console.log("Error during swap:", error);
      setLoading(false);
    }
  };

  function openModal(index) {
    setChangeToken(index);
    setIsOpen(true);
  }

  function modifyToken(i) {
    setIsOpen(false);
    if (changeToken === "output") {
      setOutputToken(tokenList[i]);
      setOutputAmount("");
    } else {
      const newInputTokens = [...inputTokens];
      newInputTokens[changeToken] = {
        ...newInputTokens[changeToken],
        token: tokenList[i],
        amount: "",
      };
      setInputTokens(newInputTokens);
    }
  }

  function InputBox({ input, index, handleInputChange, openModal }) {
    const onChange = (e) => {
      const value = e.target.value;
      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        handleInputChange(index, value);
      }
    };

    return (
      <div>
        <div className="relative">
          <Input
            placeholder="0"
            value={input.amount}
            onChange={onChange}
            className="custom-input text-white h-24 mb-1.5 text-3xl rounded-xl placeholder:font-semibold"
          />
          <div
            className="absolute top-1/2 right-5 -translate-y-1/2 bg-zinc-950 rounded-xl flex items-center gap-1.5 font-semibold text-base px-2 cursor-pointer py-1"
            onClick={() => openModal(index)}
          >
            {input.token.symbol}
            <DownOutlined />
          </div>
        </div>
      </div>
    );
  }

  const handleInputChange = useCallback((index, value) => {
    setInputTokens((prevTokens) => {
      const newTokens = [...prevTokens];
      newTokens[index] = { ...newTokens[index], amount: value };
      return newTokens;
    });
  }, []);

  const handleNumInputTokensChange = useCallback((value) => {
    const newInputTokens = [...inputTokens];
    while (newInputTokens.length < value) {
      newInputTokens.push({ token: tokenList[0], amount: "" });
    }
    setNumInputTokens(value);
    setInputTokens(newInputTokens.slice(0, value));
  }, [inputTokens]);
  

  const settings = (
    <div className="p-4 bg-zinc-900 rounded-lg">
      <div>
        <h3>Number of Input Tokens</h3>
      </div>
      <div>
        <Select
          value={numInputTokens}
          onChange={handleNumInputTokensChange}
          style={{ width: 120 }}
        >
          {[...Array(5).keys()].map((i) => (
            <Select.Option key={i + 1} value={i + 1}>
              {i + 1}
            </Select.Option>
          ))}
        </Select>
      </div>
    </div>
  );

  if (!isMounted) return null;

  return (
    <div>
      <div className="fixed inset-0 bg-cover bg-center blur-sm z-[-1] bg-[url('https://coincodex.com/en/resources/images//admin/news/5-best-crypto-to-buy/best-crypto-to-buy-before-bitcoin-halving-2023.png:resizeboxcropjpg?1600x900')]"></div>
      <div className="text-center text-6xl font-semibold mt-[2%]">
        Swap anytime, <br /> anywhere.
      </div>

      <Modal
        open={isOpen}
        footer={null}
        onCancel={() => setIsOpen(false)}
        title="Select a token"
        className="custom-modal"
      >
        <div className="flex flex-col gap-2.5 mt-5 pt-5">
          {tokenList?.map((e, i) => {
            return (
              <div
                className="flex items-center px-4 py-2.5 hover:bg-[#18181b] cursor-pointer text-white rounded-xl transition duration-200"
                key={i}
                onClick={() => modifyToken(i)}
              >
                <div className="ml-2.5">
                  <div className="text-base font-medium">{e.name}</div>
                  <div className="text-sm font-light text-[#ababac]">
                    {e.symbol}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
      <div className="w-[28%] bg-zinc-950 rounded-3xl mx-auto p-3 mt-10">
        {/* Slippage settings */}
        <div className="flex justify-end mb-2 mr-2">
          <Popover
            content={settings}
            trigger="click"
            overlayClassName="custom-popover"
          >
            <SettingOutlined className="text-gray-300 hover:text-white transition-all duration-300 hover:rotate-90 cursor-pointer" />
          </Popover>
        </div>

        <div className="relative w-full">
          {/* Input token fields */}
          <div className="text-lg font-semibold mb-2 text-gray-300">Sell</div>
          {inputTokens.slice(0, numInputTokens).map((input, index) => (
            <InputBox
              key={index}
              type="input"
              input={input}
              index={index}
              handleInputChange={handleInputChange}
              openModal={openModal}
            />
          ))}

          {/* Output token field */}
          <div className="text-lg font-semibold mb-2 text-gray-300">Buy</div>
          <InputBox
            type="output"
            input={{ token: outputToken, amount: outputAmount }}
            index="output"
            handleInputChange={() => {}}
            openModal={openModal}
          />
        </div>

        {/* Swap button */}
        <div
          className={`flex justify-center items-center bg-pink-500 w-full h-[55px] text-xl rounded-xl font-bold transition duration-200 ${
            !inputTokens.some((input) => input.amount) || !isConnected
              ? "opacity-40 cursor-not-allowed"
              : "hover:bg-pink-400 cursor-pointer"
          }`}
          onClick={handleSwap}
          disabled={loading}
        >
          {isConnected ? "Swap" : "Connect Wallet"}
        </div>
      </div>

      {/* Footer */}
      <div>
        <p className="text-gray-400 text-base mt-6 text-center mb-[3.8%]">
          The largest onchain marketplace. Buy and sell crypto
          <br />
          on Ethereum and 7+ other chains.
        </p>
        <Footer />
      </div>
    </div>
  );
}

export default Swap;
