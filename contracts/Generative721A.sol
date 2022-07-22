//SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC721A.sol";

import "hardhat/console.sol";

/*
 *
 * Royalties implementation with ERC2981
 *
 * Whitelist implementation of marketplaces
 *
 * Burning the entire collection
 *
 */

contract Generative721A is ERC721A, ERC2981, Ownable {
    bool public isSalesStopped;
    string private _baseTokenUri;

    constructor(string memory baseTokenUri) ERC721A("GenerativeNFT10K", "GNFT") {
        setTokenUri(baseTokenUri);
    }

    event Minted(uint256 quantitiy, address minter, uint256 from, uint256 to);

    event DefaultRoyaltyChanged(address indexed receiver, uint96 feeNumerator);
    event DefaultRoyaltyDeleted();
    event TokenRoyaltyAdded(uint256 tokenId, address indexed receiver, uint96 feeNumerator);
    event TokenRoyaltyDeleted(uint256 tokenId);

    event SaleStopped();
    event CollectionIsBurned(uint256 amount);

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC2981, ERC721A) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // region - Mint and burn -

    function mintNft(uint256 _quantitiy) public returns (uint256) {
        uint256 from = totalSupply() + 1;
        _safeMint(msg.sender, _quantitiy);
        uint256 to = totalSupply();
        emit Minted(_quantitiy, _msgSender(), from, to);

        return _quantitiy;
    }

    // only for tests
    function burnNft(uint256 _tokenId) external {
        require(ownerOf(_tokenId) == _msgSender(), "Only the owner can burn NFT");

        _burn(_tokenId);
    }

    function _startTokenId() internal view virtual override returns (uint256) {
        return 1;
    }

    // endregion

    // region - Token URI -

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenUri;
    }

    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        require(_exists(_tokenId), "ERC721Metadata: URI query for nonexistent token");

        if (isSalesStopped) {
            revert("ERC721Metadata: URI query for nonexistent token");
        }

        return bytes(_baseTokenUri).length > 0 ? string(abi.encodePacked(_baseTokenUri, _toString(_tokenId), ".json")) : "";
    }

    function setTokenUri(string memory baseTokenUri_) public onlyOwner {
        _baseTokenUri = baseTokenUri_;
    }

    // endregion

    // region - Royalties -

    // Сan be set in the constructor
    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);

        emit DefaultRoyaltyChanged(receiver, feeNumerator);
    }

    /*
     * Optional
     */
    function deleteDefaultRoyalty() external onlyOwner {
        _deleteDefaultRoyalty();

        emit DefaultRoyaltyDeleted();
    }

    /*
     * Optional
     */
    function setTokenRoyalty(
        uint256 tokenId,
        address receiver,
        uint96 feeNumerator
    ) external onlyOwner {
        _setTokenRoyalty(tokenId, receiver, feeNumerator);

        emit TokenRoyaltyAdded(tokenId, receiver, feeNumerator);
    }

    /*
     * Optional
     */
    function resetTokenRoyalty(uint256 tokenId) external onlyOwner {
        _resetTokenRoyalty(tokenId);

        emit TokenRoyaltyDeleted(tokenId);
    }

    // endregion

    // region - Burning the entire collection -

    function stopSelling() external onlyOwner {
        isSalesStopped = true;
        _burnAll();

        emit SaleStopped();
    }

    function _burnAll() private {
        uint256 supply = totalSupply();

        for (uint256 i = 1; i <= supply; i++) {
            address nftOwner = super.ownerOf(i);

            emit Transfer(nftOwner, address(0), i);
        }

        emit CollectionIsBurned(supply);
    }

    // endregion

    // region - Public methods that are needed in case the collection is burned -

    function balanceOf(address owner) public view override returns (uint256) {
        if (isSalesStopped) return 0;

        return super.balanceOf(owner);
    }

    function ownerOf(uint256 tokenId) public view override returns (address) {
        if (isSalesStopped) {
            revert("ERC721: owner query for nonexistent token");
        }

        return super.ownerOf(tokenId);
    }

    function getApproved(uint256 tokenId) public view override returns (address) {
        if (isSalesStopped) {
            revert("ERC721: approved query for nonexistent token");
        }

        return super.getApproved(tokenId);
    }

    function isApprovedForAll(address owner, address operator) public view override returns (bool) {
        if (isSalesStopped) return false;

        return super.isApprovedForAll(owner, operator);
    }

    function totalSupply() public view override returns (uint256) {
        if (isSalesStopped) return 0;

        return super.totalSupply();
    }

    // endregion
}
