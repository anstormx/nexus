import React, { useState, useCallback, useEffect } from "react";
import { Input, Popover, Modal, Select } from "antd";
import { DownOutlined, SettingOutlined } from "@ant-design/icons";
import tokenList from "../../utils/tokenList.json";
import { useAccount } from "wagmi";
import Footer from "./footer";
import abi from "../../utils/abi.json";
import { ethers } from "ethers";
import { toast } from "react-toastify";

function Swap() {
  const [slippage, setSlippage] = useState(1.0);
  const [isOpen, setIsOpen] = useState(false);
  const [changeToken, setChangeToken] = useState(null);
  const [numInputTokens, setNumInputTokens] = useState(1);
  const [inputTokens, setInputTokens] = useState([
    { token: tokenList[0], amount: "" },
  ]);
  const [outputToken, setOutputToken] = useState(tokenList[2]);
  const [outputAmount, setOutputAmount] = useState(null);
  const [contract, setContract] = useState(null);

  const { address, isConnected } = useAccount();

  // Get contract
  useEffect(() => {
    const initContract = async () => {
      if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const multiTokenSwapContract = new ethers.Contract(
          abi.implementationAddress,
          abi.abi,
          address
        );
        setContract(multiTokenSwapContract);
      }
    };

    initContract();
  }, [address]);

  const handleSwap = async () => {
    if (!contract || !isConnected) return;

    toast.info("Swapping tokens. Please wait...");

    try {
      const tokenInAddresses = inputTokens.map((input) => input.token.address);
      console.log(tokenInAddresses);

      const amountsIn = inputTokens.map((input) =>
        ethers.parseUnits(input.amount, input.token.decimals)
      );
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
          address
        );
        await tokenContract.approve(contract.address, amountsIn[i]);
      }

      // Call the swapTokens function
      const tx = await contract.swapTokens(
        tokenInAddresses,
        amountsIn,
        tokenOutAddress
      );
      await tx.wait();

      console.log("Swap successful!");
      // Reset input amounts or update UI as needed
    } catch (error) {
      console.error("Error during swap:", error);
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

  function handleNumInputTokensChange(value) {
    const newInputTokens = [...inputTokens];
    while (newInputTokens.length < value) {
      newInputTokens.push({ token: tokenList[0], amount: "" });
    }
    setNumInputTokens(value);
    setInputTokens(newInputTokens.slice(0, value));
  }

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
          className={`bg-pink-500 w-full h-[55px] text-xl text-center rounded-xl font-semibold transition duration-200 mt-1 py-3 ${
            !inputTokens.some((input) => input.amount) || !isConnected
              ? "opacity-40 cursor-not-allowed"
              : "hover:bg-pink-400 cursor-pointer"
          }`}
          onClick={handleSwap}
        >
          Swap
        </div>
      </div>

      {/* Footer */}
      <div>
        <p className="text-gray-400 text-base mt-6 text-center mb-[3%]">
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
