const { ethers } = require("hardhat");
const {
	address: LIQUIDITY_PROVIDER_ADDRESS,
} = require("../src/utils/liquidityProvider.json");
const { address: DAI_ADDRESS } = require("../src/utils/tokenABI/DAI.json");
const { address: USDC_ADDRESS } = require("../src/utils/tokenABI/USDC.json");
const { address: LINK_ADDRESS } = require("../src/utils/tokenABI/LINK.json");
const { address: WETH_ADDRESS } = require("../src/utils/tokenABI/WETH.json");
const {
	address: WMATIC_ADDRESS,
} = require("../src/utils/tokenABI/WMATIC.json");
const { address: WBTC_ADDRESS } = require("../src/utils/tokenABI/WBTC.json");

const tokens = [
	{ address: WBTC_ADDRESS, symbol: "WBTC", decimals: 8, usdPrice: 82000 },
	{ address: WETH_ADDRESS, symbol: "WETH", decimals: 18, usdPrice: 1800 },
	{ address: LINK_ADDRESS, symbol: "LINK", decimals: 18, usdPrice: 15 },
	{ address: WMATIC_ADDRESS, symbol: "WMATIC", decimals: 18, usdPrice: 0.2 },
	{ address: DAI_ADDRESS, symbol: "DAI", decimals: 18, usdPrice: 1 },
	{ address: USDC_ADDRESS, symbol: "USDC", decimals: 6, usdPrice: 1 },
];

const tokenPairs = [];

for (let i = 0; i < tokens.length; i++) {
	for (let j = i + 1; j < tokens.length; j++) {
		const token0 = tokens[i];
		const token1 = tokens[j];

		let amount0, amount1;

		if (token0.usdPrice >= token1.usdPrice) {
			amount0 = 1;
			amount1 = token0.usdPrice / token1.usdPrice;
			// Round amount1 to make it more readable
			amount1 = Math.round(amount1 * 100) / 100;
		} else {
			amount1 = 1;
			amount0 = token1.usdPrice / token0.usdPrice;
			// Round amount0 to make it more readable
			amount0 = Math.round(amount0 * 100) / 100;
		}

		// For WBTC (8 decimals), provide smaller amount due to high value
		if (token0.symbol === "WBTC") {
			amount0 = 0.01;
		}
		if (token1.symbol === "WBTC") {
			amount1 = 0.01;
		}

		// For stablecoins and low-value tokens, provide larger amounts
		if (token0.usdPrice <= 1) {
			amount0 = 1000;
		}
		if (token1.usdPrice <= 1) {
			amount1 = 1000;
		}

		tokenPairs.push({
			tokens: [token0.address, token1.address],
			symbols: [token0.symbol, token1.symbol],
			amounts: [amount0, amount1],
			decimals: [token0.decimals, token1.decimals],
		});
	}
}

// Function to check if token balance is sufficient and mint more if needed
async function ensureTokenBalance(tokenContract, tokenSymbol, tokenDecimals, requiredAmount, account) {
	const balance = await tokenContract.balanceOf(account);
	
	console.log(`Current ${tokenSymbol} balance: ${ethers.formatUnits(balance, tokenDecimals)}`);
	
	if (balance < requiredAmount * BigInt(2)) {
		const amountToMint = requiredAmount * BigInt(10);
		
		console.log(`Minting ${ethers.formatUnits(amountToMint, tokenDecimals)} ${tokenSymbol} tokens...`);
		
		try {
			const amountNumber = Number(ethers.formatUnits(amountToMint, tokenDecimals));
			const tx = await tokenContract.faucet(account, amountNumber);
			await tx.wait();
			console.log(`Successfully minted ${tokenSymbol} tokens.`);
			
			const newBalance = await tokenContract.balanceOf(account);
			console.log(`New ${tokenSymbol} balance: ${ethers.formatUnits(newBalance, tokenDecimals)}`);
		} catch (error) {
			console.error(`Error minting ${tokenSymbol} tokens:`, error.message);
		}
	}
}

async function main() {
	const [deployer] = await ethers.getSigners();

	console.log("liquidityProviderAddress", LIQUIDITY_PROVIDER_ADDRESS);
	console.log("WBTC_ADDRESS", WBTC_ADDRESS);
	console.log("WETH_ADDRESS", WETH_ADDRESS);
	console.log("LINK_ADDRESS", LINK_ADDRESS);
	console.log("WMATIC_ADDRESS", WMATIC_ADDRESS);
	console.log("DAI_ADDRESS", DAI_ADDRESS);
	console.log("USDC_ADDRESS", USDC_ADDRESS);

	const liquidityProvider = await ethers.getContractAt(
		"LiquidityProvider",
		LIQUIDITY_PROVIDER_ADDRESS,
		deployer
	);

	console.log(
		`Generated ${tokenPairs.length} token pairs for liquidity provision.`
	);

	for (const pair of tokenPairs) {
		console.log("--------------------------------");
        
		let [token0Address, token1Address] = pair.tokens;
		let [symbol0, symbol1] = pair.symbols;
		let [amount0, amount1] = pair.amounts;
		let [decimals0, decimals1] = pair.decimals;

		// Sort tokens according to Uniswap's requirement (token0 < token1)
		if (token0Address > token1Address) {
			[token0Address, token1Address] = [token1Address, token0Address];
			[symbol0, symbol1] = [symbol1, symbol0];
			[amount0, amount1] = [amount1, amount0];
			[decimals0, decimals1] = [decimals1, decimals0];
		}

		// Get token contracts with the correct signer
		const token0Contract = await ethers.getContractAt(
			symbol0, // Use actual contract name instead of IERC20 interface
			token0Address,
			deployer
		);
		const token1Contract = await ethers.getContractAt(
			symbol1, // Use actual contract name instead of IERC20 interface
			token1Address,
			deployer
		);

		console.log(`Adding liquidity for ${symbol0}/${symbol1} pair...`);

		// Convert amounts to Wei for calculations and comparisons
		const amount0Wei = ethers.parseUnits(
			amount0.toString(),
			decimals0
		);
		const amount1Wei = ethers.parseUnits(
			amount1.toString(),
			decimals1
		);

		// Ensure we have enough tokens for liquidity
		await ensureTokenBalance(token0Contract, symbol0, decimals0, amount0Wei, deployer.address);
		await ensureTokenBalance(token1Contract, symbol1, decimals1, amount1Wei, deployer.address);

		// Approve tokens directly to the LiquidityProvider contract
		// From the contract we can see it expects approvals to itself
		console.log(`Approving ${symbol0} for ${ethers.formatUnits(amount0Wei, decimals0)}...`);
		await token0Contract.approve(LIQUIDITY_PROVIDER_ADDRESS, amount0Wei);
		
		console.log(`Approving ${symbol1} for ${ethers.formatUnits(amount1Wei, decimals1)}...`);
		await token1Contract.approve(LIQUIDITY_PROVIDER_ADDRESS, amount1Wei);

		// Use wider tick range for better liquidity coverage
		const tickLower = -887220;
		const tickUpper = 887220;

		try {
			console.log(`Calling addLiquidity with: 
				token0: ${symbol0} (${token0Address})
				token1: ${symbol1} (${token1Address})
				amount0: ${ethers.formatUnits(amount0Wei, decimals0)} (${amount0Wei})
				amount1: ${ethers.formatUnits(amount1Wei, decimals1)} (${amount1Wei})
				tickLower: ${tickLower}
				tickUpper: ${tickUpper}
			`);
			
			const tx = await liquidityProvider.addLiquidity(
				token0Address,
				token1Address,
				amount0Wei,
				amount1Wei,
				tickLower,
				tickUpper,
				{ gasLimit: 5000000 }
			);
			console.log("Transaction hash:", tx.hash);
			const receipt = await tx.wait();
			console.log("Transaction was mined in block", receipt.blockNumber);
			console.log(
				`Liquidity added to ${symbol0}/${symbol1} pool successfully.`
			);

			// Check updated balances
			const newBalance0 = await token0Contract.balanceOf(deployer.address);
			const newBalance1 = await token1Contract.balanceOf(deployer.address);
			console.log(
				`New ${symbol0} balance: ${ethers.formatUnits(
					newBalance0,
					decimals0
				)}`
			);
			console.log(
				`New ${symbol1} balance: ${ethers.formatUnits(
					newBalance1,
					decimals1
				)}`
			);
		} catch (error) {
			console.error(
				`Error adding liquidity for ${symbol0}/${symbol1}:`,
				error.message
			);
		}
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
