import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { NFTWithWhitelist } from '../typechain-types';

describe('NFTWithWhitelist', () => {
  let nftWithWhitelist: NFTWithWhitelist;
  let owner: SignerWithAddress;
  let operator: SignerWithAddress;

  beforeEach(async () => {
    [owner, operator] = await ethers.getSigners();

    const NFTWithWhitelist = (await ethers.getContractFactory('NFTWithWhitelist'));
    nftWithWhitelist = await (await NFTWithWhitelist.deploy()).deployed();
  });

  it('should revert approve for all if not whitelisted', async () => {
    await nftWithWhitelist.mintNft('https://gateway.pinata.cloud/ipfs/QmTsDfwoDXYE82BxA1GN4ZvHEAoyrowvZYd5n5aqPFVcMm');
    expect(await nftWithWhitelist.ownerOf(0)).eq(owner.address);

    await nftWithWhitelist.addToWhitelist(operator.address);
    await nftWithWhitelist.setApprovalForAll(operator.address, true);
  });

  it('should add address to marketplace whitelist', async () => {
    await nftWithWhitelist.addToWhitelist(operator.address);
    expect(await nftWithWhitelist.marketplaceWhitelist(0)).eq(operator.address);
  });
});

