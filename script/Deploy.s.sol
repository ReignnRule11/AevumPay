// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Script} from "forge-std/Script.sol";
import {AevumPay} from "../contracts/AevumPay.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
contract Deploy is Script {
    function run() external returns (AevumPay deployed) {
        address token = vm.envAddress("TUSD8_ADDRESS");
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);
        deployed = new AevumPay(IERC20(token));
        vm.stopBroadcast();
    }
}
