import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import tokenList from "../../utils/tokenList.json";
import WETH from "../../utils/tokenABI/WETH.json";
import WMATIC from "../../utils/tokenABI/WMATIC.json";
import USDC from "../../utils/tokenABI/USDC.json";
import DAI from "../../utils/tokenABI/DAI.json";
import LINK from "../../utils/tokenABI/LINK.json";
import WBTC from "../../utils/tokenABI/WBTC.json";
import { useIsMounted } from "@/hooks/useIsMounted";

const tokenABIs = {
	WETH: WETH.abi,
	WMATIC: WMATIC.abi,
	USDC: USDC.abi,
	DAI: DAI.abi,
	LINK: LINK.abi,
	WBTC: WBTC.abi,
};

export default function Faucet() {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedToken, setSelectedToken] = useState(tokenList[0]);
	const [amount, setAmount] = useState("");
	const [signer, setSigner] = useState(null);
	const [loading, setLoading] = useState(false);
	const [tokenBalances, setTokenBalances] = useState({});
	const { address, isConnected } = useAccount();
	const isMounted = useIsMounted();

	useEffect(() => {
		const initContract = async () => {
			if (typeof window.ethereum !== "undefined") {
				const provider = new ethers.BrowserProvider(window.ethereum);
				const signer = await provider.getSigner();
				setSigner(signer);
			}
		};

		initContract();
	}, []);

	useEffect(() => {
		const fetchBalances = async () => {
			if (address && signer) {
				await fetchTokenBalances(signer, address);
			} else {
				setTokenBalances({});
			}
		};

		fetchBalances();
	}, [address, signer]);

	const fetchTokenBalances = async (signer, userAddress) => {
		const balances = {};
		for (const token of tokenList) {
			const tokenContract = new ethers.Contract(
				token.address,
				tokenABIs[token.symbol],
				signer
			);
			try {
				const balance = await tokenContract.balanceOf(userAddress);
				balances[token.address] = ethers.formatUnits(
					balance,
					token.decimals
				);
			} catch (error) {
				console.error(
					`Error fetching balance for ${token.symbol}:`,
					error
				);
				balances[token.address] = "Error";
			}
		}
		setTokenBalances(balances);
	};

	const validateAmount = (value) => {
		if (!value) return false;
		const num = parseFloat(value);
		if (isNaN(num) || num <= 0) return false;
		return true;
	};

	const handleAmountChange = (e) => {
		const value = e.target.value;
		// Only allow numbers and decimal point
		if (value === "" || /^\d*\.?\d*$/.test(value)) {
			setAmount(value);
		}
	};

	const mintTokens = async () => {
		if (!signer || !address) {
			toast.error("Please connect your wallet first");
			return;
		}

		if (!validateAmount(amount)) {
			toast.error(`Please enter a valid amount`);
			return;
		}

		setLoading(true);
		try {
			const tokenContract = new ethers.Contract(
				selectedToken.address,
				tokenABIs[selectedToken.symbol],
				signer
			);

			// Call the mint function
			const tx = await tokenContract.faucet(address, amount);
			await tx.wait();

			toast.success(
				`Successfully minted ${amount} ${selectedToken.symbol}`
			);

			// Reset amount and refresh balances
			setAmount("");
			await fetchTokenBalances(signer, address);
		} catch (error) {
			console.error(`Error minting ${selectedToken.symbol}:`, error);
			
			// Handle specific error cases
			if (error.message.includes("insufficient funds")) {
				toast.error("Insufficient funds for gas");
			} else if (error.message.includes("user rejected")) {
				toast.error("Transaction rejected by user");
			} else if (error.message.includes("network")) {
				toast.error("Network error. Please try again");
			} else {
				toast.error(
					`Error minting ${selectedToken.symbol}. Please try again.`
				);
			}
		} finally {
			setLoading(false);
		}
	};

	const openModal = () => {
		setIsOpen(true);
	};

	const modifyToken = (i) => {
		setSelectedToken(tokenList[i]);
		setIsOpen(false);
	};

	if (!isMounted) return null;

	return (
		<div className="container mx-auto px-4 py-16">
			<motion.h1
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8 }}
				className="text-6xl font-bold text-center mb-12 bg-gradient-to-r from-pink-500 to-yellow-500 text-transparent bg-clip-text"
			>
				Test Token Faucet
			</motion.h1>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8, delay: 0.2 }}
				className="max-w-md mx-auto bg-zinc-900 rounded-3xl p-6 shadow-lg"
			>
				<div className="mb-4">
					<div className="flex justify-between mb-2">
						<label className="text-sm font-medium text-gray-400">
							Select Token to Mint
						</label>
						<span className="text-sm text-gray-400">
							{isConnected
								? `Balance: ${
										tokenBalances[selectedToken.address]
											? Number(
													tokenBalances[
														selectedToken.address
													]
											  ).toFixed(3)
											: "Loading..."
								  }`
								: ""}
						</span>
					</div>
					<div className="flex items-center bg-zinc-800 rounded-lg p-2">
						<button
							className="w-full flex items-center justify-between bg-zinc-700 hover:bg-zinc-600 px-3 py-2 rounded-lg transition-colors"
							onClick={openModal}
						>
							<div className="flex items-center">
								<Image
									src={selectedToken.logoURI}
									alt={selectedToken.symbol}
									width={24}
									height={24}
									className="mr-2"
								/>
								<span>{selectedToken.symbol}</span>
							</div>
							<ChevronDown className="h-4 w-4" />
						</button>
					</div>
				</div>

				<div className="mb-4">
					<label className="text-sm font-medium text-gray-400 block mb-2">
						Amount to Mint
					</label>
					<div className="flex items-center bg-zinc-800 rounded-lg p-2">
						<input
							type="text"
							inputMode="decimal"
							placeholder="0"
							value={amount}
							onChange={handleAmountChange}
							className="bg-transparent border-none text-2xl w-full focus:outline-none"
						/>
					</div>
				</div>

				<button
					onClick={mintTokens}
					disabled={
						!isConnected ||
						loading ||
						!amount ||
						parseFloat(amount) <= 0
					}
					className={`w-full py-3 px-4 rounded-lg font-semibold ${
						!isConnected ||
						loading ||
						!amount ||
						parseFloat(amount) <= 0
							? "bg-pink-500/50 cursor-not-allowed"
							: "bg-pink-500 hover:bg-pink-600 transition-colors"
					}`}
				>
					{isConnected
						? loading
							? "Minting..."
							: "Mint Tokens"
						: "Connect Wallet"}
				</button>
			</motion.div>

			<p className="text-gray-400 text-base mt-12 text-center">
				Mint test tokens for free to try out the swap functionality.
				<br />
				Enter the amount you want to mint and click the button.
			</p>

			{isOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-zinc-800 rounded-lg p-6 w-96">
						<h3 className="text-xl font-semibold mb-4">
							Select a token
						</h3>
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
									<span className="ml-auto text-gray-400">
										{token.symbol}
									</span>
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
