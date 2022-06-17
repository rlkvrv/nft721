//SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

contract Start {
    address public owner;

    constructor() {
        owner = msg.sender;
    }
}
