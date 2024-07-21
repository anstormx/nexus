import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import SwapV1 from "./swapV1.json";
import liquidity from "./liquidity.json";
import v3pool from "./v3pool.json";
import erc20 from "./dai.json";
import { decodePriceSqrt } from "./decodePrice";

function useSwapLogic() {
  const [swapContract, setSwapContract] = useState(null);
  const [liquidityContract, setLiquidityContract] = useState(null);
  const [signer, setSigner] = useState(null);
  const [loading, setLoading] = useState(false);

  const initContract = useCallback(async () => {
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
  }, []);

  const fetchPrice = useCallback(
    async (inputToken, outputToken, inputAmount) => {
      if (
        !liquidityContract ||
        !inputAmount ||
        !inputToken ||
        !outputToken ||
        !signer
      ) {
        return { formattedOutput: null, rawOutput: null };
      }

      if (inputToken.address === outputToken.address) {
        return { formattedOutput: inputAmount, rawOutput: Number(inputAmount) };
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

  const handleSwap = useCallback(async () => {
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
          console.log("Approving spending of tokens");
          console.log("Token address:", tokenInAddresses[i]);
          console.log("Amount:", amountsIn[i]);
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
  }, [swapContract, signer]);

  return {
    swapContract,
    liquidityContract,
    signer,
    loading,
    setLoading,
    fetchPrice,
    handleSwap,
    initContract,
  };
}

export default useSwapLogic;
