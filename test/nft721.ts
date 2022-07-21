import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import {
  Nft721, Nft721__factory as Nft721Factory,
} from '../typechain-types';

describe('Nft721', () => {
  let nft721: Nft721;
  let owner: SignerWithAddress;
  let operator: SignerWithAddress;
  let operator2: SignerWithAddress;
  let user: SignerWithAddress;
  let mockUri: string;

  beforeEach(async () => {
    [owner, operator, operator2, user] = await ethers.getSigners();

    const Nft721 = (await ethers.getContractFactory('Nft721')) as Nft721Factory;
    nft721 = await (await Nft721.deploy()).deployed();

    mockUri = 'https://ipfs://blablabla/GJ92jsflki2JGefwE2/';
    await nft721.mintNft(mockUri);
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



  // it('should must reset the mappings', async () => {
  //   await nft721.mintNft('mockUri');
  //   await nft721.addToWhitelist(operator.address);
  //   await nft721.approve(user.address, 0);
  //   await nft721.setApprovalForAll(operator.address, true);

  //   expect(await nft721.ownerOf(0)).eq(owner.address);
  //   expect(await nft721.balanceOf(owner.address)).eq(1);
  //   expect(await nft721.getApproved(0)).eq(user.address);
  //   expect(await nft721.isApprovedForAll(owner.address, operator.address)).to.be.true;

  //   await nft721.endOfSales(true);

  //   expect(await nft721.ownerOf(0)).eq(ethers.constants.AddressZero);
  //   expect(await nft721.balanceOf(owner.address)).eq(0);
  //   expect(await nft721.getApproved(0)).eq(ethers.constants.AddressZero);
  //   expect(await nft721.isApprovedForAll(owner.address, operator.address)).to.be.false;
  // });
});

