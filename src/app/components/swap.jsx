import React, { useState, useCallback, useEffect } from "react";
import { Popover } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { useAccount } from "wagmi";
import { toast } from "react-toastify";
import Image from "next/image";
import tokenList from "../../utils/tokenList.json";
import { useIsMounted } from "@/hooks/useIsMounted";
import Footer from "./footer";
import TokenSelectionModal from "./tokenSelection";
import InputBox from "./inputBox";
import SwapSettings from "./swapSettings";
import SwapButton from "./swapButton";
import useSwapLogic from "../../utils/useSwapLogic";

function Swap() {
  const [isOpen, setIsOpen] = useState(false);
  const [changeToken, setChangeToken] = useState(null);
  const [numInputTokens, setNumInputTokens] = useState(1);
  const [inputTokens, setInputTokens] = useState([
    { token: tokenList[0], amount: "" },
  ]);
  const [outputToken, setOutputToken] = useState(tokenList[2]);
  const [outputAmount, setOutputAmount] = useState(null);

  const { address, isConnected } = useAccount();
  const isMounted = useIsMounted();

  const {
    swapContract,
    liquidityContract,
    signer,
    loading,
    setLoading,
    fetchPrice,
    handleSwap,
    initContract,
  } = useSwapLogic();

  useEffect(() => {
    if (isMounted) {
      initContract();
    }
  }, [isMounted, initContract]);

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

      if (liquidityContract) {
        let totalRawOutput = 0;
        for (let i = 0; i < inputTokens.length; i++) {
          if (inputTokens[i].token.address === outputToken.address) {
            totalRawOutput += Number(
              i === index ? value : inputTokens[i].amount || "0"
            );
          } else {
            const result = await fetchPrice(
              inputTokens[i].token,
              outputToken,
              i === index ? value : inputTokens[i].amount || "0"
            );
            if (result && result.rawOutput !== null) {
              totalRawOutput += result.rawOutput;
            }
          }
        }
        const formattedTotalOutput = Number(
          totalRawOutput.toFixed(6)
        ).toString();
        setOutputAmount(formattedTotalOutput);
      } else {
        setOutputAmount(null);
      }
    },
    [inputTokens, outputToken, liquidityContract, fetchPrice]
  );

  const handleNumInputTokensChange = useCallback(
    async (value) => {
      const newInputTokens = [...inputTokens];
      while (newInputTokens.length < value) {
        newInputTokens.push({ token: tokenList[0], amount: "" });
      }
      setNumInputTokens(value);
      setInputTokens(newInputTokens.slice(0, value));

      // Recalculate total output
      let totalRawOutput = 0;
      for (let i = 0; i < value; i++) {
        const { rawOutput } = await fetchPrice(
          newInputTokens[i].token,
          outputToken,
          newInputTokens[i].amount || "0"
        );
        if (rawOutput !== null) {
          totalRawOutput += rawOutput;
        }
      }
      const formattedTotalOutput = Number(totalRawOutput.toFixed(6)).toString();
      setOutputAmount(formattedTotalOutput);
    },
    [inputTokens, outputToken, fetchPrice]
  );

  if (!isMounted) return null;

  return (
    <div>
      {/* Background and title */}
      <div className="fixed inset-0 bg-cover bg-center blur-sm z-[-1] bg-[url('https://coincodex.com/en/resources/images//admin/news/5-best-crypto-to-buy/best-crypto-to-buy-before-bitcoin-halving-2023.png:resizeboxcropjpg?1600x900')] animate-background-move"></div>
      <div className="text-center text-6xl font-semibold mt-[2%]">
        Swap anytime, <br /> anywhere.
      </div>

      <TokenSelectionModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        tokenList={tokenList}
        modifyToken={modifyToken}
      />

      <div className="w-[28%] bg-zinc-950 rounded-3xl mx-auto p-3 mt-10">
        <div className="flex flex-row w-full justify-between">
          <div className="text-xl font-semibold mb-1 text-gray-300">Sell</div>
          <div>
            <Popover
              content={
                <SwapSettings
                  numInputTokens={numInputTokens}
                  handleNumInputTokensChange={handleNumInputTokensChange}
                />
              }
              trigger="click"
              overlayClassName="custom-popover"
            >
              <SettingOutlined className="text-gray-300 hover:text-white transition-all duration-300 hover:rotate-90 cursor-pointer" />
            </Popover>
          </div>
        </div>

        <div className="relative w-full">
          {inputTokens.slice(0, numInputTokens).map((input, index) => (
            <InputBox
              key={index}
              input={input}
              index={index}
              handleInputChange={handleInputChange}
              openModal={openModal}
            />
          ))}

          <div className="text-xl font-semibold mb-1 text-gray-300">Buy</div>
          <InputBox
            input={{ token: outputToken, amount: outputAmount }}
            index="output"
            handleInputChange={() => {}}
            openModal={openModal}
          />
        </div>

        <SwapButton
          inputTokens={inputTokens}
          isConnected={isConnected}
          loading={loading}
          handleSwap={handleSwap}
        />
      </div>

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

export default Swap;
