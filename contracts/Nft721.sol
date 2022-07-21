//SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/*
 *
 * Royalties implementation with ERC2981
 *
 * Whitelist implementation of marketplaces
 *
 * Burning the entire collection
 *
 */

contract Nft721 is ERC721URIStorage, ERC2981, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIds;

    bool public isSalesStopped;
    uint256 baseNftPrice = 1 ether;
    uint256 public totalSupply;

    mapping(address => bool) public marketplaceWhitelist;
    mapping(address => uint256) private _balances;

    constructor() ERC721("Nft721", "NFT") {}

    event Minted(uint256 tokenId, string tokenUri, address minter);

    event DefaultRoyaltyChanged(address indexed receiver, uint96 feeNumerator);
    event DefaultRoyaltyDeleted();
    event TokenRoyaltyAdded(uint256 tokenId, address indexed receiver, uint96 feeNumerator);
    event TokenRoyaltyDeleted(uint256 tokenId);

    event MarketplaceAddedToWhiteList(address indexed operator);
    event RemovedFromMarketplaceWhitelist(address indexed operator);
    event MarketplaceBatchAddedToWhiteList(address[] indexed operator);

    event SaleStopped();
    event CollectionIsBurned(uint256 amount);

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC2981, ERC721) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // region - Mint and burn -

    function mintNft(string memory _tokenURI) public payable returns (uint256) {
        require(msg.value == baseNftPrice, "The cost of nft is equal to one ether");

        _balances[_msgSender()] += msg.value;

        uint256 newItemId = _tokenIds.current();
        _tokenIds.increment();
        totalSupply += 1;

        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, _tokenURI);

        emit Minted(newItemId, _tokenURI, _msgSender());

        return newItemId;
    }

    // only for tests
    function burnNft(uint256 _tokenId) external {
        require(ownerOf(_tokenId) == _msgSender(), "Only the owner can burn NFT");

        totalSupply -= 1;
        _burn(_tokenId);
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

    // region - Marketplace whitelist -

    function addToWhitelist(address operator) external onlyOwner {
        marketplaceWhitelist[operator] = true;

        emit MarketplaceAddedToWhiteList(operator);
    }

    function addBatchToWhitelist(address[] calldata operators) external onlyOwner {
        for (uint256 i; i < operators.length; i++) {
            marketplaceWhitelist[operators[i]] = true;
        }

        emit MarketplaceBatchAddedToWhiteList(operators);
    }

    function removeFromWhitelist(address operator) external onlyOwner {
        marketplaceWhitelist[operator] = false;
        super.setApprovalForAll(operator, false);

        emit RemovedFromMarketplaceWhitelist(operator);
    }

    function setApprovalForAll(address operator, bool approved) public override {
        require(marketplaceWhitelist[operator], "Cannot be put up for sale on this marketplace");

        super.setApprovalForAll(operator, approved);
    }

    // endregion

    // region - Burning the entire collection -

    function stopSelling() external onlyOwner {
        isSalesStopped = true;
        _burnAll();

        emit SaleStopped();
    }

    function _burnAll() private {
        uint256 supply = totalSupply;

        for (uint256 i; i < supply; i++) {
            address nftOwner = super.ownerOf(i);
            uint256 userBalance = _balances[nftOwner];

            _balances[nftOwner] = 0;
            totalSupply -= 1;

            (bool success, ) = nftOwner.call{value: userBalance}("");
            require(success, "Transfer failed");

            emit Transfer(nftOwner, address(0), i);
        }

        emit CollectionIsBurned(totalSupply);
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

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (isSalesStopped) {
            revert("ERC721Metadata: URI query for nonexistent token");
        }

        return super.tokenURI(tokenId);
    }

    // endregion
}
