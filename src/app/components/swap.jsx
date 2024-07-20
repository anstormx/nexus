import React, { useState, useEffect } from "react";
import { Input, Popover, Radio, Modal, message, Select } from "antd";
import {
  ArrowDownOutlined,
  DownOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import tokenList from "../../utils/tokenList.json";
import axios from "axios";
import {
  useAccount,
  useSendTransaction,
  useWaitForTransaction,
  WagmiProvider,
} from "wagmi";
import { Token, Fetcher, Route } from "@uniswap/sdk";
import Footer from "./footer";

function Swap() {
  const [messageApi, contextHolder] = message.useMessage();
  const [slippage, setSlippage] = useState(1.0);
  const [tokenOneAmount, setTokenOneAmount] = useState(null);
  const [tokenTwoAmount, setTokenTwoAmount] = useState(null);
  const [tokenOne, setTokenOne] = useState(tokenList[0]);
  const [tokenTwo, setTokenTwo] = useState(tokenList[1]);
  const [isOpen, setIsOpen] = useState(false);
  const [changeToken, setChangeToken] = useState(1);
  const [prices, setPrices] = useState(null);
  const [txDetails, setTxDetails] = useState({
    to: null,
    data: null,
    value: null,
  });
  const [numInputTokens, setNumInputTokens] = useState(1);
  const [inputTokens, setInputTokens] = useState([
    { token: tokenList[0], amount: null },
  ]);
  const [outputToken, setOutputToken] = useState(tokenList[2]);
  const [outputAmount, setOutputAmount] = useState(null);

  const { address, isConnected } = useAccount();

  const { data, sendTransaction } = useSendTransaction({
    request: {
      from: address,
      to: String(txDetails.to),
      data: String(txDetails.data),
      value: String(txDetails.value),
    },
  });

  // const { isLoading, isSuccess } = useWaitForTransaction({
  //   hash: data?.hash,
  // })

  function handleSlippageChange(e) {
    setSlippage(e.target.value);
  }

  function changeAmount(e) {
    setTokenOneAmount(e.target.value);
    if (e.target.value && prices) {
      setTokenTwoAmount((e.target.value * prices.ratio).toFixed(2));
    } else {
      setTokenTwoAmount(null);
    }
  }

  function switchTokens() {
    setPrices(null);
    setTokenOneAmount(null);
    setTokenTwoAmount(null);
    const one = tokenOne;
    const two = tokenTwo;
    setTokenOne(two);
    setTokenTwo(one);
    fetchPrices(two.address, one.address);
  }

  function openModal(index) {
    setChangeToken(index);
    setIsOpen(true);
  }

  function modifyToken(i) {
    setPrices(null);
    if (changeToken === 'output') {
      setOutputToken(tokenList[i]);
      setOutputAmount(null);
    } else {
      const newInputTokens = [...inputTokens];
      newInputTokens[changeToken] = { ...newInputTokens[changeToken], token: tokenList[i], amount: null };
      setInputTokens(newInputTokens);
    }
    setIsOpen(false);
    fetchPrices();
  }

  async function fetchPrices() {
    try {
      const prices = await Promise.all(
        inputTokens.slice(0, numInputTokens).map(async (input) => {
          const tokenIn = new Token(1, input.token.address, 18);
          const tokenOut = new Token(1, outputToken.address, 18);
          const pair = await Fetcher.fetchPairData(tokenIn, tokenOut);
          const route = new Route([pair], tokenIn);
          return {
            ratio: route.midPrice.toSignificant(6),
            price: route.midPrice.invert().toSignificant(6),
          };
        })
      );
      setPrices(prices);
    } catch (error) {
      console.error("Error fetching prices:", error);
      setPrices(null);
    }
  }

  async function Swap() {
    const allowance = await axios.get(
      `https://api.1inch.io/v5.0/1/approve/allowance?tokenAddress=${tokenOne.address}&walletAddress=${address}`
    );
    if (allowance.data.allowance === "0") {
      const approve = await axios.get(
        `https://api.1inch.io/v5.0/1/approve/transaction?tokenAddress=${tokenOne.address}`
      );
      setTxDetails(approve.data);
      console.log("not approved");
      return;
    }
    const tx = await axios.get(
      `https://api.1inch.io/v5.0/1/swap?fromTokenAddress=${
        tokenOne.address
      }&toTokenAddress=${tokenTwo.address}&amount=${tokenOneAmount.padEnd(
        tokenOne.decimals + tokenOneAmount.length,
        "0"
      )}&fromAddress=${address}&slippage=${slippage}`
    );
    let decimals = Number(`1E${tokenTwo.decimals}`);
    setTokenTwoAmount((Number(tx.data.toTokenAmount) / decimals).toFixed(2));
    setTxDetails(tx.data.tx);
  }

  function InputBox({ type, input, index, handleInputChange, openModal }) {
    return (
      <div className="mb-4">
        <div className="text-lg font-semibold mb-2 text-gray-300">
          {type === "input" ? "Sell" : "Buy"}
        </div>
        <div className="relative">
          <Input
            placeholder="0"
            value={input.amount}
            onChange={(e) => handleInputChange(index, e.target.value)}
            className="custom-input text-white h-24 mb-1.5 text-3xl rounded-xl placeholder-gray-600 placeholder:font-semibold"
          />
          <div
            className="absolute top-1/2 right-5 transform -translate-y-1/2 bg-zinc-950 rounded-xl flex items-center gap-1.5 font-semibold text-base pr-2 cursor-pointer"
            onClick={() => openModal(index)}
          >
            <img
              src={input.token.logoURI}
              alt={`asset${index + 1}Logo`}
              className="h-8 w-8 ml-1.5"
            />
            {input.token.symbol}
            <DownOutlined />
          </div>
        </div>
      </div>
    );
  }

  function handleNumInputTokensChange(value) {
    setNumInputTokens(value);

    // Adjust the inputTokens array based on the new number of input tokens
    if (value > inputTokens.length) {
      // Add new tokens
      const newTokens = [...inputTokens];
      for (let i = inputTokens.length; i < value; i++) {
        newTokens.push({
          token: tokenList[i % tokenList.length],
          amount: null,
        });
      }
      setInputTokens(newTokens);
    } else if (value < inputTokens.length) {
      // Remove excess tokens
      setInputTokens(inputTokens.slice(0, value));
    }
  }

  function handleInputChange(index, value) {
    const newInputTokens = [...inputTokens];
    newInputTokens[index] = { ...newInputTokens[index], amount: value };
    setInputTokens(newInputTokens);

    // Update output amount based on the new input
    if (value && prices && prices[index]) {
      const newOutputAmount = (
        parseFloat(value) * parseFloat(prices[index].ratio)
      ).toFixed(2);
      setOutputAmount(newOutputAmount);
    } else {
      setOutputAmount(null);
    }
  }

  useEffect(() => {
    fetchPrices();
  }, [inputTokens, outputToken, numInputTokens]);

  useEffect(() => {
    if (txDetails.to && isConnected) {
      sendTransaction();
    }
  }, [txDetails]);

  // useEffect(()=>{

  //   messageApi.destroy();

  //   if(isLoading){
  //     messageApi.open({
  //       type: 'loading',
  //       content: 'Transaction is Pending...',
  //       duration: 0,
  //     })
  //   }

  // },[isLoading])

  // useEffect(()=>{
  //   messageApi.destroy();
  //   if(isSuccess){
  //     messageApi.open({
  //       type: 'success',
  //       content: 'Transaction Successful',
  //       duration: 1.5,
  //     })
  //   }else if(txDetails.to){
  //     messageApi.open({
  //       type: 'error',
  //       content: 'Transaction Failed',
  //       duration: 1.50,
  //     })
  //   }

  // },[isSuccess])

  const settings = (
    <div className="p-4 bg-zinc-900 rounded-lg">
      <div className="mb-2">
        <h3>Slippage Tolerance</h3>
      </div>
      <div className="mb-4">
        <Radio.Group value={slippage} onChange={handleSlippageChange}>
          <Radio.Button value={0.5}>0.5%</Radio.Button>
          <Radio.Button value={1}>1.0%</Radio.Button>
          <Radio.Button value={1.5}>1.5%</Radio.Button>
        </Radio.Group>
      </div>
      <div>
        <h3>Number of Input Tokens</h3>
      </div>
      <div>
        <Select
          value={numInputTokens}
          onChange={handleNumInputTokensChange}
          style={{ width: 120 }}
        >
          <Select.Option value={1}>1</Select.Option>
          <Select.Option value={2}>2</Select.Option>
          <Select.Option value={3}>3</Select.Option>
          <Select.Option value={4}>4</Select.Option>
          <Select.Option value={5}>5</Select.Option>
        </Select>
      </div>
    </div>
  );

  return (
    <div>
      <div className="fixed inset-0 bg-cover bg-center blur-sm z-[-1] bg-[url('https://coincodex.com/en/resources/images//admin/news/5-best-crypto-to-buy/best-crypto-to-buy-before-bitcoin-halving-2023.png:resizeboxcropjpg?1600x900')]"></div>
      <div className="text-center text-6xl font-semibold mt-[4%]">
        Swap anytime, <br /> anywhere.
      </div>

      {contextHolder}

      <Modal
        open={isOpen}
        footer={null}
        onCancel={() => setIsOpen(false)}
        title="Select a token"
        className="border-2 border-[#3a4157]"
      >
        <div className="flex flex-col gap-2.5 mt-5 border-t border-[#363e54] pt-5">
          {tokenList?.map((e, i) => {
            return (
              <div
                className="flex items-center px-5 py-2.5 hover:bg-[#1f2639] cursor-pointer"
                key={i}
                onClick={() => modifyToken(i)}
              >
                <img src={e.logoURI} alt={e.symbol} className="h-9 w-9" />
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
          className={`flex justify-center items-center bg-pink-500 w-full h-[55px] text-xl rounded-xl font-bold transition-colors duration-300 mt-2 ${
            !inputTokens.some((input) => input.amount) || !isConnected
              ? "opacity-40 cursor-not-allowed"
              : "hover:bg-[#3b4874] cursor-pointer"
          }`}
          onClick={Swap}
        >
          Swap
        </div>
      </div>
      <p className="text-gray-400 text-base mt-6 text-center mb-[5%]">
        The largest onchain marketplace. Buy and sell crypto
        <br />
        on Ethereum and 7+ other chains.
      </p>
      <Footer />
    </div>
  );
}

export default Swap;
