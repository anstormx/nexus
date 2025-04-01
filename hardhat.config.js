require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

module.exports = {
	solidity: {
		compilers: [
			{
				version: "0.7.6",
				settings: {
					optimizer: {
						enabled: true,
						runs: 200,
					},
				},
			},
		],
	},
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
	networks: {
		polAmoy: {
			url: `${process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL}`,
			accounts: [process.env.ACCOUNT_PRIVATE_KEY],
		},
	},
};
