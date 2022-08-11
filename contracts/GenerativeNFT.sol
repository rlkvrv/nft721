//SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
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

contract GenerativeNFT is ERC721, ERC2981, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIds;

    bool public isSalesStopped;
    uint256 public totalSupply;
    string private _baseTokenUri;

    mapping(address => bool) public marketplaceWhitelist;
    mapping(address => uint256) private _balances;

    constructor(string memory baseTokenUri) ERC721("GenerativeNFT", "GNFT") {
        setTokenUri(baseTokenUri);
        _tokenIds.increment();
    }

    event Minted(uint256 tokenId, address minter);

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

    function mintNft() public payable returns (uint256) {
        uint256 newItemId = _tokenIds.current();
        _tokenIds.increment();
        totalSupply += 1;

        _mint(msg.sender, newItemId);

        emit Minted(newItemId, _msgSender());

        return newItemId;
    }

    // only for tests
    function burnNft(uint256 _tokenId) external {
        require(ownerOf(_tokenId) == _msgSender(), "Only the owner can burn NFT");

        totalSupply -= 1;
        _burn(_tokenId);
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
        // require(marketplaceWhitelist[operator], "Cannot be put up for sale on this marketplace");

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

        for (uint256 i = 1; i <= supply; i++) {
            address nftOwner = super.ownerOf(i);

            totalSupply -= 1;

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

    // endregion

    function _toString(uint256 value) internal pure returns (string memory ptr) {
        assembly {
            // The maximum value of a uint256 contains 78 digits (1 byte per digit),
            // but we allocate 128 bytes to keep the free memory pointer 32-byte word aliged.
            // We will need 1 32-byte word to store the length,
            // and 3 32-byte words to store a maximum of 78 digits. Total: 32 + 3 * 32 = 128.
            ptr := add(mload(0x40), 128)
            // Update the free memory pointer to allocate.
            mstore(0x40, ptr)

            // Cache the end of the memory to calculate the length later.
            let end := ptr

            // We write the string from the rightmost digit to the leftmost digit.
            // The following is essentially a do-while loop that also handles the zero case.
            // Costs a bit more than early returning for the zero case,
            // but cheaper in terms of deployment and overall runtime costs.
            for {
                // Initialize and perform the first pass without check.
                let temp := value
                // Move the pointer 1 byte leftwards to point to an empty character slot.
                ptr := sub(ptr, 1)
                // Write the character to the pointer. 48 is the ASCII index of '0'.
                mstore8(ptr, add(48, mod(temp, 10)))
                temp := div(temp, 10)
            } temp {
                // Keep dividing `temp` until zero.
                temp := div(temp, 10)
            } {
                // Body of the for loop.
                ptr := sub(ptr, 1)
                mstore8(ptr, add(48, mod(temp, 10)))
            }

            let length := sub(end, ptr)
            // Move the pointer 32 bytes leftwards to make room for the length.
            ptr := sub(ptr, 32)
            // Store the length.
            mstore(ptr, length)
        }
    }
}
