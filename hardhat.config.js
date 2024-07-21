require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();


/** @type import('hardhat/config').HardhatUserConfig */
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
  networks: {
    polygonAmoy: {
      url: `${process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL}`,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY],
      },
  },
};
