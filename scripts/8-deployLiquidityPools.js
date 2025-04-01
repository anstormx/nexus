const { ethers } = require("hardhat");
const {
	address: liquidityProviderAddress,
} = require("../src/utils/liquidityProvider.json");
const {
	address: WMATIC_ADDRESS,
} = require("../src/utils/tokenABI/WMATIC.json");
const { address: WBTC_ADDRESS } = require("../src/utils/tokenABI/WBTC.json");
const { address: DAI_ADDRESS } = require("../src/utils/tokenABI/DAI.json");
const { address: USDC_ADDRESS } = require("../src/utils/tokenABI/USDC.json");
const { address: LINK_ADDRESS } = require("../src/utils/tokenABI/LINK.json");
const { address: WETH_ADDRESS } = require("../src/utils/tokenABI/WETH.json");

const bn = require("bignumber.js");
bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 });

function encodePriceSqrt(reserve1, reserve0) {
	const numerator = new bn(reserve1.toString());
	const denominator = new bn(reserve0.toString());
	const ratio = numerator.div(denominator);
	const sqrtRatio = ratio.sqrt();
	const sqrtPriceX96 = sqrtRatio.times(new bn(2).pow(96));
	return BigInt(sqrtPriceX96.toFixed(0));
}

async function createPool(liquidityProvider, token0, token1, price) {
	console.log(`Creating pool for ${token0}/${token1}...`);
	await liquidityProvider.createPool(token0, token1, price);
	console.log(`Pool created successfully for ${token0}/${token1}.`);
}

async function main() {
	const [deployer] = await ethers.getSigners();

	console.log("liquidityProviderAddress", liquidityProviderAddress);
	console.log("WBTC_ADDRESS", WBTC_ADDRESS);
	console.log("DAI_ADDRESS", DAI_ADDRESS);
	console.log("USDC_ADDRESS", USDC_ADDRESS);
	console.log("LINK_ADDRESS", LINK_ADDRESS);
	console.log("WETH_ADDRESS", WETH_ADDRESS);
	console.log("WMATIC_ADDRESS", WMATIC_ADDRESS);

	const liquidityProvider = await ethers.getContractAt(
		"LiquidityProvider",
		liquidityProviderAddress,
		deployer
	);

	const tokens = [
		{ address: WBTC_ADDRESS, symbol: "WBTC", usdPrice: 82000 },
		{ address: WETH_ADDRESS, symbol: "WETH", usdPrice: 1800 },
		{ address: LINK_ADDRESS, symbol: "LINK", usdPrice: 15 },
		{ address: WMATIC_ADDRESS, symbol: "WMATIC", usdPrice: 0.2 },
		{ address: DAI_ADDRESS, symbol: "DAI", usdPrice: 1 },
		{ address: USDC_ADDRESS, symbol: "USDC", usdPrice: 1 },
	];

	const allPricePairs = [];

	for (let i = 0; i < tokens.length; i++) {
		for (let j = i + 1; j < tokens.length; j++) {
			const token0 = tokens[i];
			const token1 = tokens[j];

			const ratio = [token0.usdPrice, token1.usdPrice];

			allPricePairs.push({
				tokens: [token0.address, token1.address],
				symbols: [token0.symbol, token1.symbol],
				ratio: ratio,
			});
		}
	}

	console.log(`Generated ${allPricePairs.length} token pairs to create.`);

	// Create all pools
	for (const pair of allPricePairs) {
		console.log(
			`Creating pool for ${pair.symbols[0]}/${pair.symbols[1]} with ratio ${pair.ratio[0]}:${pair.ratio[1]}`
		);
        
		const price = encodePriceSqrt(pair.ratio[0], pair.ratio[1]);
		await createPool(
			liquidityProvider,
			pair.tokens[0],
			pair.tokens[1],
			price
		);

		console.log(`Pool created successfully for ${pair.symbols[0]}/${pair.symbols[1]}`);
		console.log("--------------------------------");
	}

	console.log("All pools created successfully.");
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
