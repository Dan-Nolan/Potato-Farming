// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./ITokenFaucet.sol";

contract Stake is ERC20 {
    address tokenFaucet;
    constructor(uint256 initialSupply, address _tokenFaucet) ERC20("Stake", "STK") {
        tokenFaucet = _tokenFaucet;
        _mint(msg.sender, initialSupply);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override virtual {
        ITokenFaucet(tokenFaucet).beforeTokenTransfer(from, to, amount, address(this));
    }
}
