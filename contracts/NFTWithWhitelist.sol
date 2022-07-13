//SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTWithWhitelist is ERC721URIStorage, ERC2981, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIds;

    address[] public marketplaceWhitelist;

    constructor() ERC721("Test MP Whitelist", "TM") {
        _setDefaultRoyalty(msg.sender, 222);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC2981, ERC721) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function addToWhitelist(address operator) external onlyOwner {
        marketplaceWhitelist.push(operator);
    }

    function removeFromWhitelist(address operator) external onlyOwner {
        for (uint256 i; i < marketplaceWhitelist.length; i++) {
            if (operator == marketplaceWhitelist[i]) {
                marketplaceWhitelist[i] = marketplaceWhitelist[marketplaceWhitelist.length - 1];
                marketplaceWhitelist.pop();
                break;
            }
        }
    }

    function setApprovalForAll(address operator, bool approved) public override {
        bool isWhitelisted;
        for (uint256 i; i < marketplaceWhitelist.length; i++) {
            if (operator == marketplaceWhitelist[i]) {
                isWhitelisted = true;
                break;
            }
        }
        require(isWhitelisted, "Cannot be put up for sale on this marketplace");

        super.setApprovalForAll(operator, approved);
    }

    /// @notice create a new token
    /// @param tokenURI : token URI
    function mintNft(string memory tokenURI) public returns (uint256) {
        //set a new token id for the token to be minted
        uint256 newItemId = _tokenIds.current();
        _tokenIds.increment();

        _mint(msg.sender, newItemId); //mint the token
        _setTokenURI(newItemId, tokenURI); //generate the URI

        //return token ID
        return newItemId;
    }
}
