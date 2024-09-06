import { useState, useCallback, useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import Image from "next/image";
import bn from "bignumber.js";
import { motion } from "framer-motion";
import { ChevronDown, Settings } from "lucide-react";
import tokenList from "../../utils/tokenList.json";
import SwapV1 from "../../utils/swapV1.json";
import liquidity from "../../utils/liquidity.json";
import v3pool from "../../utils/v3poolABI.json";
import erc20 from "../../utils/dai.json";
import { useIsMounted } from "@/hooks/useIsMounted";
import Footer from "../components/footer";

export default function Swap() {
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
  const [showSettings, setShowSettings] = useState(false);

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

  function decodePriceSqrt(sqrtPriceX96) {
    bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 });
    const price = new bn(sqrtPriceX96.toString());
    const squaredPrice = price.times(price);
    const denominator = new bn(2).pow(192);
    return squaredPrice.div(denominator).toNumber();
  }

  // Fetch price of output token
  const fetchPrice = useCallback(
    async (inputToken, outputToken, inputAmount) => {
      if (
        !liquidityContract ||
        !inputAmount ||
        !inputToken ||
        !outputToken ||
        !signer
      ) {
        return null;
      }

      if (inputToken.address === outputToken.address) {
        return inputAmount;
      }

      try {
        const inputTokenAddress = ethers.getAddress(inputToken.address);
        const outputTokenAddress = ethers.getAddress(outputToken.address);

        // Get pool address using the factory from the LiquidityProvider contract
        const factory = await liquidityContract.factory();
        const factoryContract = new ethers.Contract(
          factory,
          ["function getPool(address,address,uint24) view returns (address)"],
          signer
        );

        // Get pool address
        const poolAddress = await factoryContract.getPool(
          inputTokenAddress,
          outputTokenAddress,
          3000
        );

        console.log("Pool address:", poolAddress);

        // Get pool contract
        const poolContract = new ethers.Contract(poolAddress, v3pool, signer);

        const [sqrtPriceX96] = await poolContract.slot0();

        const price = decodePriceSqrt(sqrtPriceX96);

        console.log("Price:", price.toString());

        // Determine if we need to invert the price based on token order
        const isInputToken0 =
          inputTokenAddress.toLowerCase() < outputTokenAddress.toLowerCase();
        const adjustedPrice = isInputToken0 ? price : 1 / price;

        // Calculate the output amount
        const inputAmountDecimal = parseFloat(inputAmount);
        const outputAmount = inputAmountDecimal * adjustedPrice;

        console.log("Input amount:", inputAmount);
        console.log("Adjusted price:", adjustedPrice);

        const formattedOutput = outputAmount.toFixed(6);

        console.log("Output amount:", formattedOutput);

        return { formattedOutput, rawOutput: outputAmount };
      } catch (error) {
        toast.error("Error fetching price. Please try again.");
        console.log("Error fetching price:", error);
        return null;
      }
    },
    [signer, liquidityContract]
  );

  const handleSwap = async () => {
    setLoading(true);

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

          const amountIn = ethers.parseUnits(inputTokens[i].amount, decimals);

          if (balance < amountIn) {
            toast.error(
              `Insufficient balance for ${inputTokens[i].token.symbol}`
            );
            setLoading(false);
            return;
          } else {
            toast.success(
              `Sufficient balance of ${inputTokens[i].token.symbol}`
            );
          }
        } catch (error) {
          toast.error(
            `Insufficient balance for ${inputTokens[i].token.symbol}`
          );
          console.log(
            `Error checking balance of ${inputTokens[i].token.symbol}:`,
            error
          );
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
          console.log("Approving spending of token for", inputTokens[i].token);
          const approveTx = await tokenContract.approve(
            SwapV1.address,
            amountsIn[i],
            { gasLimit: ethers.parseUnits("500000", "wei") }
          );
          await approveTx.wait();

          toast.success(`Approved spending of ${inputTokens[i].token.symbol}`);
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
            if (result !== null && result.rawOutput !== undefined) {
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
  
  const settings = useMemo(
    () => (
      <div className="px-4 py-2 bg-zinc-800 rounded-lg mb-4">
        <div className="mb-4">
          <label
            className="block text-sm font-medium mb-2 mt-2"
            htmlFor="num-tokens"
          >
            Number of Input Tokens
          </label>
          <select
            id="num-tokens"
            value={numInputTokens}
            onChange={(e) =>
              handleNumInputTokensChange(parseInt(e.target.value))
            }
            className="w-full bg-zinc-700 text-white rounded-md px-3 py-2"
          >
            {[1, 2, 3].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
      </div>
    ),
    [numInputTokens, handleNumInputTokensChange]
  );

  if (!isMounted) return null;

  return (
    <div>
      <div className="container mx-auto px-4 py-16">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-6xl font-bold text-center mb-12 bg-gradient-to-r from-pink-500 to-yellow-500 text-transparent bg-clip-text"
        >
          Swap anytime, anywhere.
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-md mx-auto bg-zinc-900 rounded-3xl p-6 shadow-lg"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Swap</h2>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-gray-300 hover:text-white transition-all duration-300 hover:rotate-90 cursor-pointer"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>

          {showSettings && settings}

          {inputTokens.slice(0, numInputTokens).map((input, index) => (
            <InputBox
              key={index}
              input={input}
              index={index}
              handleInputChange={handleInputChange}
              openModal={openModal}
            />
          ))}

          <InputBox
            input={{ token: outputToken, amount: outputAmount }}
            index="output"
            handleInputChange={() => {}}
            openModal={openModal}
            isOutput
          />

          <button
            className={`w-full mt-6 py-3 px-4 rounded-lg font-semibold ${
              !inputTokens.some((input) => input.amount) ||
              !isConnected ||
              loading
                ? "bg-pink-500/50 cursor-not-allowed"
                : "bg-pink-500 hover:bg-pink-600 transition-colors"
            }`}
            disabled={
              !inputTokens.some((input) => input.amount) ||
              !isConnected ||
              loading
            }
            onClick={handleSwap}
          >
            {isConnected
              ? loading
                ? "Swapping..."
                : "Swap"
              : "Connect Wallet"}
          </button>
        </motion.div>

        <p className="text-gray-400 text-base mt-12 text-center">
          The largest onchain marketplace. Buy and sell crypto
          <br />
          on Ethereum and 7+ other chains.
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

function InputBox({
  input,
  index,
  handleInputChange,
  openModal,
  isOutput = false,
}) {
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-2">
        <label className="text-sm font-medium text-gray-400">
          {isOutput ? "You receive" : "You pay"}
        </label>
        {!isOutput && (
          <span className="text-sm text-gray-400">Balance: 0.00</span>
        )}
      </div>
      <div className="flex items-center bg-zinc-800 rounded-lg p-2">
        <input
          type="text"
          inputMode="decimal"
          placeholder="0"
          value={input.amount}
          onChange={(e) => handleInputChange(index, e.target.value)}
          className="bg-transparent border-none text-2xl w-full focus:outline-none"
          disabled={isOutput}
        />
        <button
          className="ml-2 flex items-center bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded-lg transition-colors"
          onClick={() => openModal(index)}
        >
          <Image
            src={input.token.logoURI}
            alt={input.token.symbol}
            width={24}
            height={24}
            className="mr-2"
          />
          <span>{input.token.symbol}</span>
          <ChevronDown className="ml-2 h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
