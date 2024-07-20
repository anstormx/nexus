const fs = require('fs');
const { ethers } = require("hardhat");

async function main() {
    const Token = await ethers.getContractFactory("LINK");

    // Deploy the contract
    const token = await Token.deploy();

    await token.waitForDeployment();

    const deployedAddress = await token.getAddress();

    const data = {
        address: deployedAddress,
        abi: JSON.parse(Token.interface.formatJson())
    }

    //This writes the ABI and address to json file
    fs.writeFileSync('./src/utils/link.json', JSON.stringify(data));

    console.log(`Token deployed to: ${deployedAddress}`);
}

main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});
