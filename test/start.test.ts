import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import {
  Start,
  Start__factory as StartFactory,
} from '../typechain-types';

describe('Token contract', () => {
  let start: Start;
  let owner: SignerWithAddress;

  beforeEach(async () => {
    [owner] = await ethers.getSigners();

    const startFactory = (await ethers.getContractFactory('Start')) as StartFactory;
    start = await startFactory.deploy();
  });

  it('is deployed', async () => {
    expect(await start.deployed()).to.equal(start);
    expect(await start.owner()).eq(owner.address);
  });
});

