const fs = require('fs');
const { ethers } = require("hardhat");
const contract = require('@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json'); 

async function main() {
    const NonfungiblePositionManager = await ethers.getContractFactory(contract.abi, contract.bytecode);

    // Deploy the contract
    const nonfungiblePositionManager = await NonfungiblePositionManager.deploy(
        "0xad3dAd15E634bAF2Da50ad7FD9407aa5E5068678", // Uniswap V3 Factory address on Polygon
        "0x53180AfA0de66EFe024D38B8715D1d48c1B3c1B7", // WETH address on Polygon
        "0x486b4Fa4fAA3d1934593B68350c0e11AB31640dD" // NonfungibleTokenPositionDescriptor address on Polygon
    );

    await nonfungiblePositionManager.waitForDeployment();

    const deployedAddress = await nonfungiblePositionManager.getAddress();

    const data = {
        address: deployedAddress,
        abi: JSON.parse(NonfungiblePositionManager.interface.formatJson())
    }

    //This writes the ABI and address to json file
    fs.writeFileSync('./src/utils/nonfungiblePositionManager.json', JSON.stringify(data));

    console.log(`NonfungiblePositionManager deployed to: ${deployedAddress}`);
}

main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});
