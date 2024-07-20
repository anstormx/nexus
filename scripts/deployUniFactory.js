const fs = require('fs');
const { ethers } = require("hardhat");
const contract = require('@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json');

async function main() {
    const Factory = await ethers.getContractFactory(contract.abi, contract.bytecode);

    // Deploy the contract
    const factory = await Factory.deploy();

    await factory.waitForDeployment();

    const deployedAddress = await factory.getAddress();

    console.log(`Factory deployed to: ${deployedAddress}`);
}

main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});
