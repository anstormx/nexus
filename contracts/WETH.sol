// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WETH is ERC20 {
    constructor() ERC20("Wrapped Ether", "WETH") { 
        // Mint 1,000,000 WETH tokens
        _mint(msg.sender, 1000000 * 10**decimals());
    }
}