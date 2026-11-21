// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title AevumPay
/// @notice Minimal exact-amount invoice settlement using one configured ERC-20.
contract AevumPay is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum InvoiceStatus { None, Open, Paid, Cancelled }

    struct Invoice {
        address merchant;
        address designatedPayer;
        uint128 amount;
        uint64 expiresAt;
        InvoiceStatus status;
        bytes32 externalRef;
    }

    IERC20 public immutable paymentToken;
    uint256 private _nonce;
    mapping(bytes32 => Invoice) private _invoices;

    error ZeroAddress();
    error ZeroAmount();
    error InvalidExpiry();
    error InvoiceNotFound();
    error InvoiceNotOpen();
    error InvoiceExpired();
    error WrongPayer();
    error WrongPaymentAmount();
    error AmountTooLarge();
    error NotMerchant();

    event InvoiceCreated(bytes32 indexed invoiceId, address indexed merchant, address indexed designatedPayer, uint256 amount, uint64 expiresAt, bytes32 externalRef);
    event InvoicePaid(bytes32 indexed invoiceId, address indexed payer, address indexed merchant, uint256 amount, bytes32 externalRef);
    event InvoiceCancelled(bytes32 indexed invoiceId, address indexed merchant);

    constructor(IERC20 token_) {
        if (address(token_) == address(0)) revert ZeroAddress();
        paymentToken = token_;
    }

    function createInvoice(address designatedPayer, uint256 amount, uint64 expiresAt, bytes32 externalRef) external returns (bytes32 invoiceId) {
        if (amount == 0) revert ZeroAmount();
        if (amount > type(uint128).max) revert AmountTooLarge();
        if (expiresAt <= block.timestamp) revert InvalidExpiry();

        invoiceId = keccak256(abi.encode(block.chainid, address(this), msg.sender, _nonce++));
        _invoices[invoiceId] = Invoice(msg.sender, designatedPayer, uint128(amount), expiresAt, InvoiceStatus.Open, externalRef);
        emit InvoiceCreated(invoiceId, msg.sender, designatedPayer, amount, expiresAt, externalRef);
    }

    function pay(bytes32 invoiceId) external nonReentrant {
        Invoice storage invoice = _invoices[invoiceId];
        if (invoice.status == InvoiceStatus.None) revert InvoiceNotFound();
        if (invoice.status != InvoiceStatus.Open) revert InvoiceNotOpen();
        if (block.timestamp >= invoice.expiresAt) revert InvoiceExpired();
        if (invoice.designatedPayer != address(0) && invoice.designatedPayer != msg.sender) revert WrongPayer();

        uint256 amount = uint256(invoice.amount);
        uint256 beforeBalance = paymentToken.balanceOf(invoice.merchant);
        paymentToken.safeTransferFrom(msg.sender, invoice.merchant, amount);
        uint256 received = paymentToken.balanceOf(invoice.merchant) - beforeBalance;
        if (received != amount) revert WrongPaymentAmount();

        invoice.status = InvoiceStatus.Paid;
        emit InvoicePaid(invoiceId, msg.sender, invoice.merchant, amount, invoice.externalRef);
    }

    function cancelInvoice(bytes32 invoiceId) external {
        Invoice storage invoice = _invoices[invoiceId];
        if (invoice.status == InvoiceStatus.None) revert InvoiceNotFound();
        if (invoice.merchant != msg.sender) revert NotMerchant();
        if (invoice.status != InvoiceStatus.Open) revert InvoiceNotOpen();
        invoice.status = InvoiceStatus.Cancelled;
        emit InvoiceCancelled(invoiceId, msg.sender);
    }

    function getInvoice(bytes32 invoiceId) external view returns (Invoice memory) {
        Invoice memory invoice = _invoices[invoiceId];
        if (invoice.status == InvoiceStatus.None) revert InvoiceNotFound();
        return invoice;
    }
}
