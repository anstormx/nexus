// SPDX-License-Identifier: MIT

pragma solidity ^0.7.6;
pragma abicoder v2;

import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";

contract MultiTokenSwapV1 is
    Initializable,
    ReentrancyGuardUpgradeable,
    ContextUpgradeable,
    OwnableUpgradeable
{
    // The Uniswap V3 SwapRouter contract
    ISwapRouter public swapRouter;
    // The fee tier that will be used for the swap
    uint24 public feeTier;
    // Uniswap V3 supported fee tiers
    uint24 private constant LOWEST_FEE = 100; // 0.01%
    uint24 private constant LOW_FEE = 500; // 0.05%
    uint24 private constant MEDIUM_FEE = 3000; // 0.3%
    uint24 private constant HIGH_FEE = 10000; // 1%

    // Events
    event FeeTierChanged(uint24 previousFeeTier, uint24 newFeeTier);
    event Swapped(
        address[] tokenIn,
        uint256[] amountsIn,
        address tokenOut,
        uint256 totalAmountOut
    );
    event RescueFunds(address token, uint256 amount);
    event Initialized(address swapRouter, uint24 feeTier);

    // This function is used to initialize the contract
    function initialize(
        address _swapRouter,
        uint24 _feeTier
    ) public initializer {
        require(_swapRouter != address(0), "ZERO_ADDRESS_ROUTER");
        require(
            _feeTier == LOWEST_FEE ||
                _feeTier == LOW_FEE ||
                _feeTier == MEDIUM_FEE ||
                _feeTier == HIGH_FEE,
            "INVALID_FEE_TIER"
        );

        // Initialize parent contracts in correct order
        __ReentrancyGuard_init();
        __Context_init();
        __Ownable_init();

        swapRouter = ISwapRouter(_swapRouter);
        feeTier = _feeTier;
        emit Initialized(_swapRouter, _feeTier);
    }

    // This function is used to set the fee tier that will be used for the swap
    function setFeeTier(uint24 _feeTier) external onlyOwner {
        require(
            _feeTier == LOWEST_FEE ||
                _feeTier == LOW_FEE ||
                _feeTier == MEDIUM_FEE ||
                _feeTier == HIGH_FEE,
            "INVALID_FEE_TIER"
        );
        emit FeeTierChanged(feeTier, _feeTier);
        feeTier = _feeTier;
    }

    // This function is used to get the balance of a token held by the contract
    function getTokenBalance(address token) external view returns (uint256) {
        require(token != address(0), "INVALID_ADDRESS");
        return IERC20(token).balanceOf(address(this));
    }

    function swapTokens(
        address[] calldata tokenIn,
        uint256[] calldata amountsIn,
        address tokenOut
    ) external nonReentrant returns (uint256 totalAmountOut) {
        require(
            tokenIn.length == amountsIn.length,
            "TOKENIN_AMOUNTIN_LENGTH_MISMATCH"
        );
        require(tokenIn.length > 0, "TOKENIN_AMOUNTIN_LENGTH_ZERO");
        require(tokenOut != address(0), "INVALID_ADDRESS");

        for (uint256 i = 0; i < tokenIn.length; i++) {
            require(tokenIn[i] != address(0), "INVALID_ADDRESS");
            require(tokenIn[i] != tokenOut, "CANNOT_SWAP_SAME_TOKEN");
            require(amountsIn[i] > 0, "INVALID_AMOUNT");

            // Transfer the specified amount of tokenIn[i] to this contract.
            TransferHelper.safeTransferFrom(
                tokenIn[i],
                msg.sender,
                address(this),
                amountsIn[i]
            );
            // Approve the router to spend tokenIn[i].
            TransferHelper.safeApprove(
                tokenIn[i],
                address(swapRouter),
                amountsIn[i]
            );

            // Create the params that will be used to execute the swap
            ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
                .ExactInputSingleParams({
                    tokenIn: tokenIn[i],
                    tokenOut: tokenOut,
                    fee: feeTier,
                    recipient: msg.sender,
                    deadline: block.timestamp, // epoch
                    amountIn: amountsIn[i],
                    amountOutMinimum: 0,
                    sqrtPriceLimitX96: 0
                });

            // Execute the swap
            uint256 amountOut = swapRouter.exactInputSingle(params);
            totalAmountOut += amountOut;
        }

        emit Swapped(tokenIn, amountsIn, tokenOut, totalAmountOut);
    }

    // This function is used to rescue any tokens that are sent to the contract by mistake
    function rescueFunds(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "INVALID_ADDRESS");
        require(amount > 0, "INVALID_AMOUNT");
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance >= amount, "INSUFFICIENT_BALANCE");
        IERC20(token).transfer(owner(), amount);
        emit RescueFunds(token, amount);
    }
}
