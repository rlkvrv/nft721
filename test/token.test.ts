import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import {
  Token,
  Token__factory as TokenFactory,
} from '../typechain-types';
import { toWei } from './shared/utils';

describe('Token contract', () => {
  const tokenName = 'Test Token';
  const tokenSymbol = 'TT';
  const tokenSupply = toWei(1000000);

  let token: Token;
  let owner: SignerWithAddress;

  beforeEach(async () => {
    [owner] = await ethers.getSigners();

    const tokenFactory = (await ethers.getContractFactory('Token')) as TokenFactory;
    token = await tokenFactory.deploy(tokenName, tokenSymbol, tokenSupply);
  });

  it('is deployed', async () => {
    expect(await token.deployed()).to.equal(token);
  });

  it('should initialize right', async () => {
    expect(await token.name()).to.equal(tokenName);
    expect(await token.symbol()).to.equal(tokenSymbol);
    expect(await token.totalSupply()).to.equal(tokenSupply);
  });

  it('should minted tokens to sender', async () => {
    expect(await token.balanceOf(owner.address)).to.equal(tokenSupply);
  });
});

