// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AevumPay} from "../contracts/AevumPay.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockTUSD8 is IERC20 {
    string public constant name = "Test USD8";
    string public constant symbol = "tUSD8";
    uint8 public constant decimals = 6;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    function mint(address to, uint256 amount) external { totalSupply += amount; balanceOf[to] += amount; emit Transfer(address(0), to, amount); }
    function transfer(address to, uint256 amount) external returns (bool) { _transfer(msg.sender, to, amount); return true; }
    function approve(address spender, uint256 amount) external returns (bool) { allowance[msg.sender][spender] = amount; emit Approval(msg.sender, spender, amount); return true; }
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender]; require(allowed >= amount, "allowance");
        if (allowed != type(uint256).max) allowance[from][msg.sender] = allowed - amount;
        _transfer(from, to, amount); return true;
    }
    function _transfer(address from, address to, uint256 amount) internal { require(balanceOf[from] >= amount, "balance"); balanceOf[from] -= amount; balanceOf[to] += amount; emit Transfer(from, to, amount); }
}

contract AevumPayTest is Test {
    MockTUSD8 token;
    AevumPay pay;
    address merchant = makeAddr("merchant");
    address payer = makeAddr("payer");
    address stranger = makeAddr("stranger");
    uint256 constant AMOUNT = 25_000_000;

    function setUp() public {
        token = new MockTUSD8();
        pay = new AevumPay(IERC20(address(token)));
        token.mint(payer, 100_000_000);
        vm.prank(payer);
        token.approve(address(pay), type(uint256).max);
    }
    function _create(uint64 expiry, address designated) internal returns (bytes32 id) {
        vm.prank(merchant);
        id = pay.createInvoice(designated, AMOUNT, expiry, keccak256("INV-001"));
    }
    function testCreateAndPayInvoice() public {
        bytes32 id = _create(uint64(block.timestamp + 1 days), address(0));
        vm.prank(payer); pay.pay(id);
        AevumPay.Invoice memory invoice = pay.getInvoice(id);
        assertEq(uint256(invoice.status), uint256(AevumPay.InvoiceStatus.Paid));
        assertEq(token.balanceOf(merchant), AMOUNT);
        assertEq(token.balanceOf(payer), 75_000_000);
    }
    function testDesignatedPayerOnly() public {
        bytes32 id = _create(uint64(block.timestamp + 1 days), payer);
        vm.prank(stranger); vm.expectRevert(AevumPay.WrongPayer.selector); pay.pay(id);
    }
    function testCannotPayTwice() public {
        bytes32 id = _create(uint64(block.timestamp + 1 days), address(0));
        vm.prank(payer); pay.pay(id);
        vm.prank(payer); vm.expectRevert(AevumPay.InvoiceNotOpen.selector); pay.pay(id);
    }
    function testInvoiceCannotBePaidAtExactExpiry() public {
        uint64 expiry = uint64(block.timestamp + 1 hours);
        bytes32 id = _create(expiry, address(0));
        vm.warp(expiry);
        vm.prank(payer); vm.expectRevert(AevumPay.InvoiceExpired.selector); pay.pay(id);
    }
    function testExpiredInvoiceCannotBePaid() public {
        uint64 expiry = uint64(block.timestamp + 1 hours);
        bytes32 id = _create(expiry, address(0));
        vm.warp(uint256(expiry) + 1);
        vm.prank(payer); vm.expectRevert(AevumPay.InvoiceExpired.selector); pay.pay(id);
    }
    function testOnlyMerchantCanCancel() public {
        bytes32 id = _create(uint64(block.timestamp + 1 days), address(0));
        vm.prank(stranger); vm.expectRevert(AevumPay.NotMerchant.selector); pay.cancelInvoice(id);
    }
    function testMerchantCanCancelOpenInvoice() public {
        bytes32 id = _create(uint64(block.timestamp + 1 days), address(0));
        vm.prank(merchant); pay.cancelInvoice(id);
        assertEq(uint256(pay.getInvoice(id).status), uint256(AevumPay.InvoiceStatus.Cancelled));
    }
}
