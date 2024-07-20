// SPDX-License-Identifier: MIT

pragma solidity ^0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";

contract LiquidityProvider is IERC721Receiver, ReentrancyGuard {
    IUniswapV3Factory public immutable factory;
    INonfungiblePositionManager public immutable nonfungiblePositionManager;
    uint24 public constant fee = 3000;

    // Events
    event PoolCreated(address pool);
    event LiquidityAdded(uint256 tokenId);

    constructor(address _factory, address _nonfungiblePositionManager) {
        factory = IUniswapV3Factory(_factory);
        nonfungiblePositionManager = INonfungiblePositionManager(
            _nonfungiblePositionManager
        );
    }

    /// @notice Creates a new Uniswap V3 pool for the given token pair
    /// @param tokenA Address of the first token
    /// @param tokenB Address of the second token
    /// @param sqrtPriceX96 The initial square root price of the pool as a Q64.96 value
    function createPool(
        address tokenA,
        address tokenB,
        uint160 sqrtPriceX96
    ) external nonReentrant {
        require(tokenA != tokenB, "IDENTICAL_ADDRESSES");
        require(sqrtPriceX96 > 0, "INVALID_SQRT_PRICE");
        
        address pool = factory.createPool(tokenA, tokenB, fee);
        IUniswapV3Pool(pool).initialize(sqrtPriceX96);
        emit PoolCreated(pool);
    }

    /// @notice Adds liquidity to a Uniswap V3 pool
    /// @param tokenA Address of the first token
    /// @param tokenB Address of the second token
    /// @param amountA Amount of the first token to add as liquidity
    /// @param amountB Amount of the second token to add as liquidity
    /// @param tickLower The lower tick of the position
    /// @param tickUpper The upper tick of the position
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB,
        int24 tickLower,
        int24 tickUpper
    ) external nonReentrant {
        require(amountA > 0 && amountB > 0, "INVALID_AMOUNTS");
        require(tickLower < tickUpper, "INVALID_TICK_RANGE");
        require(IERC20(tokenA).allowance(msg.sender, address(this)) >= amountA, "INSUFFICIENT_ALLOWANCE_A");
        require(IERC20(tokenB).allowance(msg.sender, address(this)) >= amountB, "INSUFFICIENT_ALLOWANCE_B");
        
        TransferHelper.safeTransferFrom(
            tokenA,
            msg.sender,
            address(this),
            amountA
        );
        TransferHelper.safeTransferFrom(
            tokenB,
            msg.sender,
            address(this),
            amountB
        );

        TransferHelper.safeApprove(
            tokenA,
            address(nonfungiblePositionManager),
            amountA
        );
        TransferHelper.safeApprove(
            tokenB,
            address(nonfungiblePositionManager),
            amountB
        );

        INonfungiblePositionManager.MintParams
            memory params = INonfungiblePositionManager.MintParams({
                token0: tokenA < tokenB ? tokenA : tokenB,
                token1: tokenA < tokenB ? tokenB : tokenA,
                fee: fee,
                tickLower: tickLower,
                tickUpper: tickUpper,
                amount0Desired: tokenA < tokenB ? amountA : amountB,
                amount1Desired: tokenA < tokenB ? amountB : amountA,
                amount0Min: 0,
                amount1Min: 0,
                recipient: msg.sender,
                deadline: block.timestamp
            });

        (uint256 tokenId, , , ) = nonfungiblePositionManager.mint(params);
        emit LiquidityAdded(tokenId);
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    /// @notice Allows the contract owner to withdraw any leftover tokens
    /// @param token Address of the token to withdraw
    /// @param amount Amount of tokens to withdraw
    function withdrawLeftoverTokens(address token, uint256 amount) external {
        TransferHelper.safeTransfer(token, msg.sender, amount);
    }
}
