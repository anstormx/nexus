## NEXUS

Nexus is a web application built with Next.js and integrates with Blockchain using ethers.js. It allows users to:

* Select input and output tokens
* Enter the amount of input tokens to swap
* See the estimated amount of output tokens received (based on current market prices)
* Initiate a swap transaction (requires a connected wallet)

### Features

* Supports multiple input tokens
* Fetches price data from a liquidity pool contract
* Provides a user-friendly interface for selecting tokens and entering amounts
* Integrates with a wallet connector for signing transactions

### Dependencies

This component relies on several external libraries:

* `react`
* `next` 
* `antd` (for UI components)
* `@ant-design/icons` (for icons)
* `wagmi` (for wallet connection)
* `ethers` (for interacting with Ethereum blockchain)
* `react-toastify` (for displaying notifications)
* `next/image` (for displaying token logos)
* `bignumber.js` (for handling large numbers)

### Usage

1. Clone the repository:

```bash
git clone https://github.com/anstormx/nexus.git
```

2. Install the required dependencies:

```bash
npm i
```

3. Build and start the project:

```javascript
npm run build
npm run start
```

### Configuration

* `tokenList`: An array of objects containing token information (name, symbol, logoURI, address, decimals)
* `SwapV1`: The address of the swap contract (if using a custom contract)
* `liquidity`: The address and ABI of the liquidity pool contract
* `v3pool`: The ABI of the V3 pool contract
* `dai, link usdc, weth`: The ABI and address of minted ERC20 tokens