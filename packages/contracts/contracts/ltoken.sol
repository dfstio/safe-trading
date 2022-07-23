// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LERC20 is ERC20Permit, Ownable  {
	
    constructor(string memory name_, string memory symbol_, uint256 initialSupply) 
    	ERC20(name_, symbol_) 
    	ERC20Permit(name_)
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

	struct DepositRequest
	{
		address from;
		uint256 amount;
		uint256 paymentMethod;
		bool processed;
		bool accepted;
	}
	
	struct WithdrawRequest
	{
		address from;
		uint256 amount;
		uint256 paymentMethod;
		bool processed;
		bool accepted;
	}
	
	uint256 public unprocessedDeposits;
	uint256 public unprocessedWithdraws;
	
	DepositRequest[]  public depositRequests; 
	WithdrawRequest[] public withdrawRequests; 
	
	event Deposit(uint256 indexed id, address indexed from, uint256 amount, uint256 indexed paymentMethod);
	event DepositAccepted(uint256 indexed id, address indexed from, uint256 amount, uint256 indexed paymentMethod);
	event DepositRejected(uint256 indexed id, address indexed from, uint256 amount, uint256 indexed paymentMethod);
	
	event Withdraw(uint256 indexed id, address indexed from, uint256 amount, uint256 indexed paymentMethod);
	event WithdrawAccepted(uint256 indexed id, address indexed from, uint256 amount, uint256 indexed paymentMethod);
	event WithdrawRejected(uint256 indexed id, address indexed from, uint256 amount, uint256 indexed paymentMethod);

       
    function withdraw( uint256 amount, uint256 paymentMethod) external
    {
        require(balanceOf(msg.sender) >= amount, "LERC20 withdraw: withdraw amount exceeds balance");
    	withdrawRequests.push(WithdrawRequest(msg.sender, amount, paymentMethod, false, false));
    	unprocessedWithdraws++;
    	emit Withdraw(withdrawRequests.length-1, msg.sender, amount, paymentMethod);
    }
    
    function acceptWithdrow(uint256 id) external onlyOwner
    {
    	require(id < withdrawRequests.length, "LERC20 acceptWithdrow: id is out of range");
    	require(balanceOf(withdrawRequests[id].from) >= withdrawRequests[id].amount, "LERC20: withdraw amount exceeds balance");
    	withdrawRequests[id].processed = true;
    	withdrawRequests[id].accepted = true;
    	_burn(withdrawRequests[id].from, withdrawRequests[id].amount);
    	unprocessedWithdraws--;
    	emit WithdrawAccepted(id, withdrawRequests[id].from, withdrawRequests[id].amount, withdrawRequests[id].paymentMethod);
    }
    
    function rejectWithdrow(uint256 id) external onlyOwner
    {
    	require(id < withdrawRequests.length, "LERC20 rejectWithdrow: id is out of range");
     	withdrawRequests[id].processed = true;
    	withdrawRequests[id].accepted = false;
    	unprocessedWithdraws--;
    	emit WithdrawRejected(id, withdrawRequests[id].from, withdrawRequests[id].amount, withdrawRequests[id].paymentMethod);
    }
    
    function withdrawRequestsCount() view external returns (uint256)
    {
    	return withdrawRequests.length;
    }
    
    function deposit( uint256 amount, uint256 paymentMethod) external
    {
    	depositRequests.push(DepositRequest(msg.sender, amount, paymentMethod, false, false));
    	unprocessedDeposits++;
    	emit Deposit(depositRequests.length-1, msg.sender, amount, paymentMethod);
    }
    
    function acceptDeposit(uint256 id) external onlyOwner
    {
    	require(id < depositRequests.length, "LERC20 acceptDeposit: id is out of range");
    	depositRequests[id].processed = true;
    	depositRequests[id].accepted = true;
    	_mint(depositRequests[id].from, depositRequests[id].amount);
    	unprocessedDeposits--;
    	emit DepositAccepted(id, depositRequests[id].from, depositRequests[id].amount, depositRequests[id].paymentMethod);
    }
    
    function rejectDeposit(uint256 id) external onlyOwner
    {
    	require(id < depositRequests.length, "LERC20 rejectDeposit: id is out of range");
    	depositRequests[id].processed = true;
    	depositRequests[id].accepted = false;
    	unprocessedDeposits--;
    	emit DepositRejected(id, depositRequests[id].from, depositRequests[id].amount, depositRequests[id].paymentMethod);
    }
    
    function depositRequestsCount() view external returns (uint256)
    {
    	return depositRequests.length;
    }
}
