// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LUSD is ERC20, Ownable  {
	
	struct WithdrawRequest
	{
		address from;
		uint256 amount;
		string network;
		string networkAddress;
		bool processed;
		bool accepted;
	}
	event Withdraw(uint256 id, address indexed from, uint256 amount);
	event Accepted(uint256 id, address indexed from, uint256 amount);
	event Rejected(uint256 id, address indexed from, uint256 amount);
	
	
	WithdrawRequest[] public requests; 
	
    constructor(uint256 initialSupply) ERC20("Safe Transfers USD", "LUSD") 
    {
        _mint(msg.sender, initialSupply);
    }
    
    function mint(address account, uint256 amount) external onlyOwner
    {
    	_mint(account, amount);
    }
    
    function burn(address account, uint256 amount) external onlyOwner
    {
    	_burn(account, amount);
    }
    
    function withdraw( uint256 amount, string memory network, string memory networkAddress) external
    {
        require(balanceOf(msg.sender) >= amount, "LERC20: withdraw amount exceeds balance");
    	requests.push(WithdrawRequest(msg.sender, amount, network, networkAddress, false, false));
    	emit Withdraw(requests.length-1, msg.sender, amount);
    }
    
    function accept(uint256 id) external onlyOwner
    {
    	require(id < requests.length, "LERC20: id out of range");
    	require(balanceOf(requests[id].from) >= requests[id].amount, "LERC20: withdraw amount exceeds balance");
    	requests[id].processed = true;
    	requests[id].accepted = true;
    	_burn(requests[id].from, requests[id].amount);
    	emit Accepted(id, requests[id].from, requests[id].amount);
    }
    
    function reject(uint256 id) external onlyOwner
    {
    	require(id < requests.length, "LERC20: id out of range");
    	require(balanceOf(requests[id].from) >= requests[id].amount, "LERC20: withdraw amount exceeds balance");
    	requests[id].processed = true;
    	requests[id].accepted = false;
    	emit Rejected(id, requests[id].from, requests[id].amount);
    }
    
    function requestsCount() view external returns (uint256)
    {
    	return requests.length;
    }
}
