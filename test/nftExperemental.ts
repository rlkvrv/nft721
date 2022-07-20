import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { NFTExperimental } from '../typechain-types';

describe('NFTExperimental', () => {
  let nftExperimental: NFTExperimental;
  let owner: SignerWithAddress;
  let operator: SignerWithAddress;
  let user: SignerWithAddress;

  beforeEach(async () => {
    [owner, operator, user] = await ethers.getSigners();

    const NFTExperimental = (await ethers.getContractFactory('NFTExperimental'));
    nftExperimental = await (await NFTExperimental.deploy()).deployed();
  });

  it('should revert approve for all if not whitelisted', async () => {
    await nftExperimental.mintNft('https://gateway.pinata.cloud/ipfs/QmTsDfwoDXYE82BxA1GN4ZvHEAoyrowvZYd5n5aqPFVcMm');
    expect(await nftExperimental.ownerOf(0)).eq(owner.address);

    await nftExperimental.addToWhitelist(operator.address);
    await nftExperimental.setApprovalForAll(operator.address, true);
  });

  it('should add address to marketplace whitelist', async () => {
    await nftExperimental.addToWhitelist(operator.address);
    expect(await nftExperimental.marketplaceWhitelist(0)).eq(operator.address);
  });

  it('should must reset the mappings', async () => {
    await nftExperimental.mintNft('https://gateway.pinata.cloud/ipfs/QmTsDfwoDXYE82BxA1GN4ZvHEAoyrowvZYd5n5aqPFVcMm');
    await nftExperimental.addToWhitelist(operator.address);
    await nftExperimental.approve(user.address, 0);
    await nftExperimental.setApprovalForAll(operator.address, true);

    expect(await nftExperimental.ownerOf(0)).eq(owner.address);
    expect(await nftExperimental.balanceOf(owner.address)).eq(1);
    expect(await nftExperimental.getApproved(0)).eq(user.address);
    expect(await nftExperimental.isApprovedForAll(owner.address, operator.address)).to.be.true;

    await nftExperimental.endOfSales(true);

    expect(await nftExperimental.ownerOf(0)).eq(ethers.constants.AddressZero);
    expect(await nftExperimental.balanceOf(owner.address)).eq(0);
    expect(await nftExperimental.getApproved(0)).eq(ethers.constants.AddressZero);
    expect(await nftExperimental.isApprovedForAll(owner.address, operator.address)).to.be.false;
  });
});

