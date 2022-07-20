//SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTExperimental is ERC721URIStorage, ERC2981, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIds;

    address[] public marketplaceWhitelist;
    bool isSalesStopped;
    uint256 public totalSupply;

    constructor() ERC721("Experimental NFT", "EX") {
        _setDefaultRoyalty(msg.sender, 222);
    }

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

    function mintNft(string memory _tokenURI) public returns (uint256) {
        uint256 newItemId = _tokenIds.current();
        _tokenIds.increment();
        totalSupply++;

        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, _tokenURI);

        return newItemId;
    }

    // only for tests
    function burnNft(uint256 _tokenId) external {
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
        marketplaceWhitelist.push(operator);

        emit MarketplaceAddedToWhiteList(operator);
    }

    function addBatchToWhitelist(address[] calldata operators) external onlyOwner {
        for (uint256 i; i < operators.length; i++) {
            marketplaceWhitelist.push(operators[i]);
        }

        emit MarketplaceBatchAddedToWhiteList(operators);
    }

    function removeFromWhitelist(address operator) external onlyOwner {
        for (uint256 i; i < marketplaceWhitelist.length; i++) {
            if (operator == marketplaceWhitelist[i]) {
                marketplaceWhitelist[i] = marketplaceWhitelist[marketplaceWhitelist.length - 1];
                marketplaceWhitelist.pop();
                super.setApprovalForAll(operator, false); // TODO
                break;
            }
        }

        emit RemovedFromMarketplaceWhitelist(operator);
    }

    function setApprovalForAll(address operator, bool approved) public override {
        bool isWhitelisted;
        for (uint256 i; i < marketplaceWhitelist.length; i++) {
            if (operator == marketplaceWhitelist[i]) {
                isWhitelisted = true;
                break;
            }
        }
        require(isWhitelisted && approved, "Cannot be put up for sale on this marketplace"); //TODO

        super.setApprovalForAll(operator, approved);
    }

    // endregion

    // region - Collection is not sold out -

    function stopSelling() external onlyOwner {
        isSalesStopped = true;
        _burnAll();

        emit SaleStopped();
    }

    function _burnAll() private {
        for (uint256 i; i < totalSupply; i++) {
            emit Transfer(super.ownerOf(i), address(0), i);
        }

        emit CollectionIsBurned(totalSupply);
    }

    // endregion

    // region - Public methods that are needed in case the collection is not sold out -

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
