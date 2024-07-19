// SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.24;
pragma abicoder v2;

import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';


contract MultiTokenSwap is ReentrancyGuard {
    // The Uniswap V3 SwapRouter contract
    ISwapRouter public immutable swapRouter;
    // The fee tier that will be used for the swap
    uint24 public feeTier;
    // The owner of the contract
    address public owner;

    constructor(ISwapRouter _swapRouter, uint24 _feeTier) {
        swapRouter = _swapRouter;
        feeTier = _feeTier;
        owner = msg.sender;
    }

    // This modifier is used to ensure that only the owner of the contract can call the function
    modifier onlyOwner() {
        require(msg.sender == owner, 'ONLY_OWNER');
        _;
    }

    // Events
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event FeeTierChanged(uint24 previousFeeTier, uint24 newFeeTier);
    event Swapped(address[] tokenIn, uint256[] amountsIn, address tokenOut, uint256 totalAmountOut, uint256 deadline);
    event RescueFunds(address token, uint256 amount);

    // This function is used to set the fee tier that will be used for the swap
    function setFeeTier(uint24 _feeTier) external onlyOwner {
        emit FeeTierChanged(feeTier, _feeTier);
        feeTier = _feeTier;
    }

    // This function is used to transfer the ownership of the contract to a new address
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), 'INVALID_ADDRESS');
        owner = _newOwner;
        emit OwnershipTransferred(owner, _newOwner);
    }

    // This function is used to get the balance of a token held by the contract
    function getTokenBalance(address token) external view returns (uint256) {
        require(token != address(0), 'INVALID_ADDRESS');
        return IERC20(token).balanceOf(address(this));
    }

    function swapTokens(
        address[] calldata tokenIn,
        uint256[] calldata amountsIn,
        address tokenOut,
        uint256[] calldata amountsOutMinimum,
        uint256 deadline
        ) external nonReentrant returns (uint256 totalAmountOut) {
            require(tokenIn.length == amountsIn.length, 'TOKENIN_AMOUNTIN_LENGTH_MISMATCH');
            require(tokenIn.length > 0, 'TOKENIN_AMOUNTIN_LENGTH_ZERO');
            require(block.timestamp <= deadline, "DEADLINE_EXCEEDED");

            for (uint256 i = 0; i < tokenIn.length; i++) {
                require(tokenIn[i] != address(0), 'INVALID_ADDRESS');
                require(amountsIn[i] > 0, 'INVALID_AMOUNT');

                // Transfer the specified amount of tokenIn[i] to this contract.
                TransferHelper.safeTransferFrom(tokenIn[i], msg.sender, address(this), amountsIn[i]);
                // Approve the router to spend tokenIn[i].
                TransferHelper.safeApprove(tokenIn[i], address(swapRouter), amountsIn[i]);

                // Create the params that will be used to execute the swap
                ISwapRouter.ExactInputSingleParams memory params =
                    ISwapRouter.ExactInputSingleParams({
                        tokenIn: tokenIn[i],
                        tokenOut: tokenOut,
                        fee: feeTier,
                        recipient: msg.sender,
                        deadline: deadline, //epoch
                        amountIn: amountsIn[i],
                        amountOutMinimum: amountsOutMinimum[i],
                        sqrtPriceLimitX96: 0
                    });
                
                // Execute the swap
                uint256 amountOut = swapRouter.exactInputSingle(params);
                totalAmountOut += amountOut;
            }   

        emit Swapped(tokenIn, amountsIn, tokenOut, totalAmountOut, deadline);
    }

    // This function is used to rescue any tokens that are sent to the contract by mistake
    function rescueFunds(address token, uint256 amount) external onlyOwner {
        require(token != address(0), 'INVALID_ADDRESS');
        require(amount > 0, 'INVALID_AMOUNT');
        IERC20(token).transfer(owner, amount);
        emit RescueFunds(token, amount);
    }
}