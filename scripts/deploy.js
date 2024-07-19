const hre = require("hardhat");
const fs = require("fs");


async function main() {
    const MultiTokenSwap = await hre.ethers.getContractFactory("MultiTokenSwap");
    const multiTokenSwap = await MultiTokenSwap.deploy(
        "0xE592427A0AEce92De3Edee1F18E0157C05861564", // Uniswap V3 SwapRouter address on Polygon
        3000 // Default fee tier
    );

    await multiTokenSwap.waitForDeployment();

    const deployedAddress = await multiTokenSwap.getAddress();

    const data = {
        address: deployedAddress,
        abi: JSON.parse(multiTokenSwap.interface.formatJson())
    }

    //This writes the ABI and address to json file
    fs.writeFileSync('./src/utils/abi.json', JSON.stringify(data));

    console.log(
        `MultiTokenSwap contract deployed to: ${deployedAddress}`
    );
}

main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});
