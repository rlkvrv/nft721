import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { NFTExperimental } from '../typechain-types';

describe('NFTExperimental', () => {
  let nftExperimental: NFTExperimental;
  let owner: SignerWithAddress;
  let operator: SignerWithAddress;
  let operator2: SignerWithAddress;
  let user: SignerWithAddress;
  let mockUri: string;

  beforeEach(async () => {
    [owner, operator, operator2, user] = await ethers.getSigners();

    const NFTExperimental = (await ethers.getContractFactory('NFTExperimental'));
    nftExperimental = await (await NFTExperimental.deploy()).deployed();

    mockUri = 'https://ipfs://blablabla/GJ92jsflki2JGefwE2/';
    await nftExperimental.mintNft(mockUri);
  });

  describe('Whitelist implementation of marketplaces', async () => {
    it('should revert approve for all if not whitelisted', async () => {
      await expect(nftExperimental.setApprovalForAll(operator.address, true)).revertedWith('Cannot be put up for sale on this marketplace');
    });

    it('should add address to marketplace whitelist', async () => {
      await nftExperimental.addToWhitelist(operator.address);
      expect(await nftExperimental.marketplaceWhitelist(operator.address)).to.be.true;

      await expect(nftExperimental.setApprovalForAll(operator.address, true)).emit(nftExperimental, 'ApprovalForAll')
        .withArgs(owner.address, operator.address, true);
    });

    it('should add multiple addresses to marketplace whitelist', async () => {
      await nftExperimental.addBatchToWhitelist([operator.address,  operator2.address]);

      expect(await nftExperimental.marketplaceWhitelist(operator2.address)).to.be.true;

      await expect(nftExperimental.setApprovalForAll(operator2.address, true)).emit(nftExperimental, 'ApprovalForAll')
        .withArgs(owner.address, operator2.address, true);
    });

    it('should removed marketplace form whitelist', async () => {
      await nftExperimental.addBatchToWhitelist([operator.address,  operator2.address]);

      await nftExperimental.removeFromWhitelist(operator2.address);

      await expect(nftExperimental.setApprovalForAll(operator2.address, true))
        .revertedWith('Cannot be put up for sale on this marketplace');
    });
  });



  // it('should must reset the mappings', async () => {
  //   await nftExperimental.mintNft('mockUri');
  //   await nftExperimental.addToWhitelist(operator.address);
  //   await nftExperimental.approve(user.address, 0);
  //   await nftExperimental.setApprovalForAll(operator.address, true);

  //   expect(await nftExperimental.ownerOf(0)).eq(owner.address);
  //   expect(await nftExperimental.balanceOf(owner.address)).eq(1);
  //   expect(await nftExperimental.getApproved(0)).eq(user.address);
  //   expect(await nftExperimental.isApprovedForAll(owner.address, operator.address)).to.be.true;

  //   await nftExperimental.endOfSales(true);

  //   expect(await nftExperimental.ownerOf(0)).eq(ethers.constants.AddressZero);
  //   expect(await nftExperimental.balanceOf(owner.address)).eq(0);
  //   expect(await nftExperimental.getApproved(0)).eq(ethers.constants.AddressZero);
  //   expect(await nftExperimental.isApprovedForAll(owner.address, operator.address)).to.be.false;
  // });
});

