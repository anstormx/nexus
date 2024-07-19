// SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.24;
pragma abicoder v2;

import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';


contract MultiTokenSwap is ReentrancyGuard {
    ISwapRouter public immutable swapRouter;
    uint24 public feeTier;
    address public owner = msg.sender;

    constructor(ISwapRouter _swapRouter, uint24 _feeTier) {
        swapRouter = _swapRouter;
        feeTier = _feeTier;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, 'ONLY_OWNER');
        _;
    }

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    event FeeTierChanged(uint24 previousFeeTier, uint24 newFeeTier);

    event Swapped(address[] tokenIn, uint256[] amountsIn, address tokenOut, uint256 amountOutMinimum, uint256 totalAmountOut);

    event RescueFunds(address token, uint256 amount);


    function setFeeTier(uint24 _feeTier) external onlyOwner {
        emit FeeTierChanged(feeTier, _feeTier);
        feeTier = _feeTier;
    }

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
        uint256 amountOutMinimum
        ) external nonReentrant returns (uint256 totalAmountOut) {
            require(tokenIn.length == amountsIn.length, 'TOKENIN_AMOUNTIN_LENGTH_MISMATCH');
            require(tokenIn.length > 0, 'TOKENIN_AMOUNTIN_LENGTH_ZERO');

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
                        deadline: block.timestamp,
                        amountIn: amountsIn[i],
                        amountOutMinimum: 0,
                        sqrtPriceLimitX96: 0
                    });
                
                // Execute the swap
                uint256 amountOut = swapRouter.exactInputSingle(params);

                // Add the output amount to the total amount out
                totalAmountOut += amountOut;
            }   
        
        // Check that the amount out is greater than the minimum amount out
        require(totalAmountOut >= amountOutMinimum, 'INSUFFICIENT_OUTPUT_AMOUNT');

        emit Swapped(tokenIn, amountsIn, tokenOut, amountOutMinimum, totalAmountOut);
    }

    // This function is used to rescue any tokens that are sent to the contract by mistake
    function rescueFunds(address token, uint256 amount) external onlyOwner {
        require(token != address(0), 'INVALID_ADDRESS');
        require(amount > 0, 'INVALID_AMOUNT');
        IERC20(token).transfer(owner, amount);
        event RescueFunds(token, amount);
    }
}