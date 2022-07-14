//SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "erc721a/contracts/ERC721A.sol";

contract Basic721A is ERC721A {
    uint256 private tokenCounter;
    string public baseTokenURI;

    constructor(string memory _baseTokenURI) ERC721A("Base721A", "BNFT") {
        baseTokenURI = _baseTokenURI;
    }

    function mintNft(uint256 quantity) external returns (uint256) {
        _safeMint(msg.sender, quantity);
        tokenCounter = tokenCounter + 1;
        return tokenCounter;
    }

    function burnNft(uint256 _tokenId) external {
        _burn(_tokenId);
    }

    function getTokenCounter() external view returns (uint256) {
        return tokenCounter;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }
}
