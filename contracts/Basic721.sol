//SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Basic721 is ERC721URIStorage, Ownable {
    uint256 private tokenCounter;
    string public baseTokenURI;

    constructor(string memory _baseTokenURI) ERC721("BaseNFT", "BNFT") {
        baseTokenURI = _baseTokenURI;
    }

    function mintNft(string memory _tokenURI) external returns (uint256) {
        _safeMint(msg.sender, tokenCounter);
        _setTokenURI(tokenCounter, _tokenURI);
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
