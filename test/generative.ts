import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import {
  GenerativeNFT, GenerativeNFT__factory as GenerativeNFTFactory,
} from '../typechain-types';
import { toWei } from './shared/utils';

describe('GenerativeNFT', () => {
  let generativeNft: GenerativeNFT;
  let owner: SignerWithAddress;
  let operator: SignerWithAddress;
  let operator2: SignerWithAddress;
  let user: SignerWithAddress;
  let user2: SignerWithAddress;
  let creator: SignerWithAddress;
  let uniqCreator: SignerWithAddress;
  let mockUri: string;
  let zeroAddress: string;

  before(async () => {
    [owner, operator, operator2, user, user2, creator, uniqCreator] = await ethers.getSigners();

    mockUri = 'https://nftstorage.link/ipfs/bafybeifad32sool4xbdv7m32c5rgvmudcpfdvdiqp5dpv6a6hejz2supty/';

    const GenerativeNFT = (await ethers.getContractFactory('GenerativeNFT')) as GenerativeNFTFactory;
    generativeNft = await (await GenerativeNFT.deploy(mockUri)).deployed();

    await generativeNft.mintNft();
    await generativeNft.mintNft();
    await generativeNft.mintNft();

    zeroAddress = ethers.constants.AddressZero;
  });

  describe('Token URI', async () => {
    it('should return correct token uri', async () => {
      expect(await generativeNft.tokenURI(1))
        .eq('https://nftstorage.link/ipfs/bafybeifad32sool4xbdv7m32c5rgvmudcpfdvdiqp5dpv6a6hejz2supty/1.json');

      await generativeNft.setTokenUri('https://google.com/');
      expect(await generativeNft.tokenURI(1))
        .eq('https://google.com/1.json');
    });
  });

  describe('Royalties implementation with ERC2981', async () => {
    it('only owner can changed royalty params', async () => {
      const errorMessage = 'Ownable: caller is not the owner';

      await expect(generativeNft.connect(user).setDefaultRoyalty(user.address, 10000)).revertedWith(errorMessage);
      await expect(generativeNft.connect(user).deleteDefaultRoyalty()).revertedWith(errorMessage);
      await expect(generativeNft.connect(user).setTokenRoyalty(0, user.address, 10000)).revertedWith(errorMessage);
      await expect(generativeNft.connect(user).resetTokenRoyalty(0)).revertedWith(errorMessage);
    });

    it('should added default royalty 100 basic points (1%)', async () => {
      const royaltyInfo = await generativeNft.royaltyInfo(0, toWei(1));
      const [receiver, royaltyAmount] = royaltyInfo;

      expect(receiver).eq(zeroAddress);
      expect(royaltyAmount).eq(0);

      await generativeNft.setDefaultRoyalty(creator.address, 100);

      const royaltyInfoToken0 = await generativeNft.royaltyInfo(0, toWei(100));
      const royaltyInfoToken1 = await generativeNft.royaltyInfo(1, toWei(100));

      expect(royaltyInfoToken0[0]).eq(creator.address);
      expect(royaltyInfoToken0[1]).eq(toWei(1));
      expect(royaltyInfoToken1[0]).eq(creator.address);
      expect(royaltyInfoToken1[1]).eq(toWei(1));
    });

    it('should add a unique creator and royalties to token with tokenId 1', async () => {
      await generativeNft.setTokenRoyalty(1, uniqCreator.address, 1000);

      const royaltyInfoToken1 = await generativeNft.royaltyInfo(1, toWei(100));
      expect(royaltyInfoToken1[0]).eq(uniqCreator.address);
      expect(royaltyInfoToken1[1]).eq(toWei(10));
    });

    it('should delete a creator and royalties to token with tokenId 1', async () => {
      let royaltyInfoToken2 = await generativeNft.royaltyInfo(1, toWei(100));
      expect(royaltyInfoToken2[0]).eq(uniqCreator.address);
      expect(royaltyInfoToken2[1]).eq(toWei(10));

      await generativeNft.resetTokenRoyalty(1);

      royaltyInfoToken2 = await generativeNft.royaltyInfo(1, toWei(100));
      expect(royaltyInfoToken2[0]).eq(creator.address);
      expect(royaltyInfoToken2[1]).eq(toWei(1));
    });

    it('should delete default royalty', async () => {
      await generativeNft.deleteDefaultRoyalty();

      expect((await generativeNft.royaltyInfo(0, toWei(100)))[0]).eq(zeroAddress);
      expect((await generativeNft.royaltyInfo(1, toWei(100)))[0]).eq(zeroAddress);
      expect((await generativeNft.royaltyInfo(2, toWei(100)))[0]).eq(zeroAddress);
      expect((await generativeNft.royaltyInfo(0, toWei(100)))[1]).eq(0);
      expect((await generativeNft.royaltyInfo(1, toWei(100)))[1]).eq(0);
      expect((await generativeNft.royaltyInfo(2, toWei(100)))[1]).eq(0);
    });
  });

  describe('Whitelist implementation of marketplaces', async () => {
    it('should revert approve for all if not whitelisted', async () => {
      await expect(generativeNft.setApprovalForAll(operator.address, true)).revertedWith('Cannot be put up for sale on this marketplace');
    });

    it('should add address to marketplace whitelist', async () => {
      await generativeNft.addToWhitelist(operator.address);
      expect(await generativeNft.marketplaceWhitelist(operator.address)).to.be.true;

      await expect(generativeNft.setApprovalForAll(operator.address, true)).emit(generativeNft, 'ApprovalForAll')
        .withArgs(owner.address, operator.address, true);
    });

    it('should add multiple addresses to marketplace whitelist', async () => {
      await generativeNft.addBatchToWhitelist([operator.address,  operator2.address]);

      expect(await generativeNft.marketplaceWhitelist(operator2.address)).to.be.true;

      await expect(generativeNft.setApprovalForAll(operator2.address, true)).emit(generativeNft, 'ApprovalForAll')
        .withArgs(owner.address, operator2.address, true);
    });

    it('should removed marketplace form whitelist', async () => {
      await generativeNft.addBatchToWhitelist([operator.address,  operator2.address]);

      await generativeNft.removeFromWhitelist(operator2.address);

      await expect(generativeNft.setApprovalForAll(operator2.address, true))
        .revertedWith('Cannot be put up for sale on this marketplace');
    });
  });

  describe('Burning the entire collection', async () => {
    before(async () => {
      // minting NFT from two more accounts
      await generativeNft.connect(user).mintNft();
      await generativeNft.connect(user2).mintNft();

      // give permission
      await generativeNft.approve(user.address, 1);
      await generativeNft.addToWhitelist(operator.address);
      await generativeNft.setApprovalForAll(operator.address, true);
    });

    it('should return error if not an owner', async () => {
      const errorMessage = 'Ownable: caller is not the owner';

      await expect(generativeNft.connect(user).stopSelling()).rejectedWith(errorMessage);
    });

    it('should stop sales and burn the whole collection', async () => {
      await generativeNft.stopSelling();

      expect(await generativeNft.isSalesStopped()).to.be.true;
    });

    it('totalSupply should be equal zero', async () => {
      expect(await generativeNft.totalSupply()).eq(0);
    });

    it('balances should be equal zero', async () => {
      expect(await generativeNft.balanceOf(owner.address)).eq(0);
      expect(await generativeNft.balanceOf(user.address)).eq(0);
      expect(await generativeNft.balanceOf(user2.address)).eq(0);
    });

    it('ownerOf should return error', async () => {
      const errorMessage = 'ERC721: owner query for nonexistent token';

      await expect(generativeNft.ownerOf(0)).revertedWith(errorMessage);
      await expect(generativeNft.ownerOf(1)).revertedWith(errorMessage);
    });

    it('getApproved / isApproveForAll should return error / false', async () => {
      await expect(generativeNft.getApproved(1)).revertedWith('ERC721: approved query for nonexistent token');

      expect(await generativeNft.isApprovedForAll(owner.address, operator.address)).to.be.false;
    });

    it('tokenUri should return error', async () => {
      await expect(generativeNft.tokenURI(1)).revertedWith('ERC721Metadata: URI query for nonexistent token');
    });
  });
});

