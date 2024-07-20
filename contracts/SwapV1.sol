// SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.24;
pragma abicoder v2;

import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract MultiTokenSwapV1 is
    Initializable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable
{
    // The Uniswap V3 SwapRouter contract
    ISwapRouter public swapRouter;
    // The fee tier that will be used for the swap
    uint24 public feeTier;

    // Events
    event FeeTierChanged(uint24 previousFeeTier, uint24 newFeeTier);
    event Swapped(
        address[] tokenIn,
        uint256[] amountsIn,
        address tokenOut,
        uint256 totalAmountOut
    );
    event RescueFunds(address token, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // This function is used to initialize the contract
    function initialize(
        address _swapRouter,
        uint24 _feeTier
    ) public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        swapRouter = ISwapRouter(_swapRouter);
        feeTier = _feeTier;
    }

    // This function is used to upgrade the contract
    function _authorizeUpgrade(address) internal override onlyOwner {}

    // This function is used to set the fee tier that will be used for the swap
    function setFeeTier(uint24 _feeTier) external onlyOwner {
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
                    deadline: block.timestamp, //epoch
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
        IERC20(token).transfer(owner(), amount);
        emit RescueFunds(token, amount);
    }
}
