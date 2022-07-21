import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import {
  Nft721, Nft721__factory as Nft721Factory,
} from '../typechain-types';
import { toWei } from './shared/utils';

describe('Nft721', () => {
  let nft721: Nft721;
  let owner: SignerWithAddress;
  let operator: SignerWithAddress;
  let operator2: SignerWithAddress;
  let user: SignerWithAddress;
  let creator: SignerWithAddress;
  let uniqCreator: SignerWithAddress;
  let mockUri: string;
  let zeroAddress: string;

  before(async () => {
    [owner, operator, operator2, user, creator, uniqCreator] = await ethers.getSigners();

    const Nft721 = (await ethers.getContractFactory('Nft721')) as Nft721Factory;
    nft721 = await (await Nft721.deploy()).deployed();

    mockUri = 'https://ipfs://blablabla/GJ92jsflki2JGefwE2/';
    await nft721.mintNft(mockUri);
    await nft721.mintNft(mockUri);
    await nft721.mintNft(mockUri);

    zeroAddress = ethers.constants.AddressZero;
  });

  describe('Royalties implementation with ERC2981', async () => {
    it('only owner can changed royalty params', async () => {
      const errorString = 'Ownable: caller is not the owner';

      await expect(nft721.connect(user).setDefaultRoyalty(user.address, 10000)).revertedWith(errorString);
      await expect(nft721.connect(user).deleteDefaultRoyalty()).revertedWith(errorString);
      await expect(nft721.connect(user).setTokenRoyalty(0, user.address, 10000)).revertedWith(errorString);
      await expect(nft721.connect(user).resetTokenRoyalty(0)).revertedWith(errorString);
    });

    it('should added default royalty 100 basic points (1%)', async () => {
      const royaltyInfo = await nft721.royaltyInfo(0, toWei(1));
      const [receiver, royaltyAmount] = royaltyInfo;

      expect(receiver).eq(zeroAddress);
      expect(royaltyAmount).eq(0);

      await nft721.setDefaultRoyalty(creator.address, 100);

      const royaltyInfoToken0 = await nft721.royaltyInfo(0, toWei(100));
      const royaltyInfoToken1 = await nft721.royaltyInfo(1, toWei(100));

      expect(royaltyInfoToken0[0]).eq(creator.address);
      expect(royaltyInfoToken0[1]).eq(toWei(1));
      expect(royaltyInfoToken1[0]).eq(creator.address);
      expect(royaltyInfoToken1[1]).eq(toWei(1));
    });

    it('should add a unique creator and royalties to token with tokenId 1', async () => {
      await nft721.setTokenRoyalty(1, uniqCreator.address, 1000);

      const royaltyInfoToken1 = await nft721.royaltyInfo(1, toWei(100));
      expect(royaltyInfoToken1[0]).eq(uniqCreator.address);
      expect(royaltyInfoToken1[1]).eq(toWei(10));
    });

    it('should delete a creator and royalties to token with tokenId 1', async () => {
      let royaltyInfoToken2 = await nft721.royaltyInfo(1, toWei(100));
      expect(royaltyInfoToken2[0]).eq(uniqCreator.address);
      expect(royaltyInfoToken2[1]).eq(toWei(10));

      await nft721.resetTokenRoyalty(1);

      royaltyInfoToken2 = await nft721.royaltyInfo(1, toWei(100));
      expect(royaltyInfoToken2[0]).eq(creator.address);
      expect(royaltyInfoToken2[1]).eq(toWei(1));
    });

    it('should delete default royalty', async () => {
      await nft721.deleteDefaultRoyalty();

      expect((await nft721.royaltyInfo(0, toWei(100)))[0]).eq(zeroAddress);
      expect((await nft721.royaltyInfo(1, toWei(100)))[0]).eq(zeroAddress);
      expect((await nft721.royaltyInfo(2, toWei(100)))[0]).eq(zeroAddress);
      expect((await nft721.royaltyInfo(0, toWei(100)))[1]).eq(0);
      expect((await nft721.royaltyInfo(1, toWei(100)))[1]).eq(0);
      expect((await nft721.royaltyInfo(2, toWei(100)))[1]).eq(0);
    });
  });

  describe('Whitelist implementation of marketplaces', async () => {
    it('should revert approve for all if not whitelisted', async () => {
      await expect(nft721.setApprovalForAll(operator.address, true)).revertedWith('Cannot be put up for sale on this marketplace');
    });

    it('should add address to marketplace whitelist', async () => {
      await nft721.addToWhitelist(operator.address);
      expect(await nft721.marketplaceWhitelist(operator.address)).to.be.true;

      await expect(nft721.setApprovalForAll(operator.address, true)).emit(nft721, 'ApprovalForAll')
        .withArgs(owner.address, operator.address, true);
    });

    it('should add multiple addresses to marketplace whitelist', async () => {
      await nft721.addBatchToWhitelist([operator.address,  operator2.address]);

      expect(await nft721.marketplaceWhitelist(operator2.address)).to.be.true;

      await expect(nft721.setApprovalForAll(operator2.address, true)).emit(nft721, 'ApprovalForAll')
        .withArgs(owner.address, operator2.address, true);
    });

    it('should removed marketplace form whitelist', async () => {
      await nft721.addBatchToWhitelist([operator.address,  operator2.address]);

      await nft721.removeFromWhitelist(operator2.address);

      await expect(nft721.setApprovalForAll(operator2.address, true))
        .revertedWith('Cannot be put up for sale on this marketplace');
    });
  });
});

