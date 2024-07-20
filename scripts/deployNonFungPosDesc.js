const fs = require("fs");
const { ethers } = require("hardhat");
const contract = require("@uniswap/v3-periphery/artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json");

const linkLibraries = ({ bytecode, linkReferences }, libraries) => {
  Object.keys(linkReferences).forEach((fileName) => {
    Object.keys(linkReferences[fileName]).forEach((contractName) => {
      if (!libraries.hasOwnProperty(contractName)) {
        throw new Error(`Missing link library name ${contractName}`);
      }
      const address = ethers
        .getAddress(libraries[contractName])
        .toLowerCase()
        .slice(2);
      linkReferences[fileName][contractName].forEach(({ start, length }) => {
        const start2 = 2 + start * 2;
        const length2 = length * 2;
        bytecode = bytecode
          .slice(0, start2)
          .concat(address)
          .concat(bytecode.slice(start2 + length2, bytecode.length));
      });
    });
  });
  return bytecode;
};

async function main() {
  const linkedBytecode = linkLibraries(
    {
      bytecode: contract.bytecode,
      linkReferences: contract.linkReferences,
    },
    {
      NFTDescriptor: "0xff6dd472749B858b9265F0a471DB66C39B03421c",
    }
  );

  const NonfungibleTokenPositionDescriptor = await ethers.getContractFactory(
    contract.abi,
    linkedBytecode
  );

  // WETH address on Polygon Amoy
  const WETH9 = "0x53180AfA0de66EFe024D38B8715D1d48c1B3c1B7";

  // Native currency label (MATIC for Polygon)
  const nativeCurrencyLabelBytes = ethers.encodeBytes32String("MATIC");

  // Deploy the contract with both arguments
  const nonfungibleTokenPositionDescriptor =
    await NonfungibleTokenPositionDescriptor.deploy(
      WETH9,
      nativeCurrencyLabelBytes
    );

  await nonfungibleTokenPositionDescriptor.waitForDeployment();

  const deployedAddress = await nonfungibleTokenPositionDescriptor.getAddress();

  const data = {
    address: deployedAddress,
    abi: contract.abi,
  };

  //This writes the ABI and address to json file
  fs.writeFileSync(
    "./src/utils/nonfungibleTokenPositionDescriptor.json",
    JSON.stringify(data)
  );

  console.log(
    `NonfungibleTokenPositionDescriptor deployed to: ${deployedAddress}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
