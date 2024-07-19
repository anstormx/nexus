require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    polygonAmoy: {
      url: `${process.env.POLYGON_AMOY_RPC_URL}`,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY],
      },
  },
};
