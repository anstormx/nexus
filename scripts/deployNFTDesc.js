const fs = require('fs');
const { ethers } = require("hardhat");
const contract = require('@uniswap/v3-periphery/artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json');
async function main() {
    const NFTDescriptor = await ethers.getContractFactory(contract.abi, contract.bytecode);

    // Deploy the contract
    const nftDescriptor = await NFTDescriptor.deploy();

    await nftDescriptor.waitForDeployment();

    const deployedAddress = await nftDescriptor.getAddress();

    const data = {
        address: deployedAddress,
        abi: JSON.parse(NFTDescriptor.interface.formatJson())
    }

    //This writes the ABI and address to json file
    fs.writeFileSync('./src/utils/nftDescriptor.json', JSON.stringify(data));

    console.log(`NFTDescriptor deployed to: ${deployedAddress}`);
}

main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});
