import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import {
  Generative721A, Generative721A__factory as Generative721AFactory,
} from '../typechain-types';
import { toWei } from './shared/utils';

describe('Generative721A', () => {
  let generative721a: Generative721A;
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

    const Generative721A = (await ethers.getContractFactory('Generative721A')) as Generative721AFactory;
    generative721a = await (await Generative721A.deploy(mockUri)).deployed();

    await generative721a.mintNft(3);
    await generative721a.mintNft(10);
    await generative721a.mintNft(10000);

    zeroAddress = ethers.constants.AddressZero;
  });

  describe('Token URI', async () => {
    it('should return correct token uri', async () => {
      expect(await generative721a.tokenURI(1))
        .eq('https://nftstorage.link/ipfs/bafybeifad32sool4xbdv7m32c5rgvmudcpfdvdiqp5dpv6a6hejz2supty/1.json');

      await generative721a.setTokenUri('https://google.com/');
      expect(await generative721a.tokenURI(1))
        .eq('https://google.com/1.json');
    });
  });

  describe('Royalties implementation with ERC2981', async () => {
    it('only owner can changed royalty params', async () => {
      const errorMessage = 'Ownable: caller is not the owner';

      await expect(generative721a.connect(user).setDefaultRoyalty(user.address, 10000)).revertedWith(errorMessage);
      await expect(generative721a.connect(user).deleteDefaultRoyalty()).revertedWith(errorMessage);
      await expect(generative721a.connect(user).setTokenRoyalty(0, user.address, 10000)).revertedWith(errorMessage);
      await expect(generative721a.connect(user).resetTokenRoyalty(0)).revertedWith(errorMessage);
    });

    it('should added default royalty 100 basic points (1%)', async () => {
      const royaltyInfo = await generative721a.royaltyInfo(0, toWei(1));
      const [receiver, royaltyAmount] = royaltyInfo;

      expect(receiver).eq(zeroAddress);
      expect(royaltyAmount).eq(0);

      await generative721a.setDefaultRoyalty(creator.address, 100);

      const royaltyInfoToken0 = await generative721a.royaltyInfo(0, toWei(100));
      const royaltyInfoToken1 = await generative721a.royaltyInfo(1, toWei(100));

      expect(royaltyInfoToken0[0]).eq(creator.address);
      expect(royaltyInfoToken0[1]).eq(toWei(1));
      expect(royaltyInfoToken1[0]).eq(creator.address);
      expect(royaltyInfoToken1[1]).eq(toWei(1));
    });

    it('should add a unique creator and royalties to token with tokenId 1', async () => {
      await generative721a.setTokenRoyalty(1, uniqCreator.address, 1000);

      const royaltyInfoToken1 = await generative721a.royaltyInfo(1, toWei(100));
      expect(royaltyInfoToken1[0]).eq(uniqCreator.address);
      expect(royaltyInfoToken1[1]).eq(toWei(10));
    });

    it('should delete a creator and royalties to token with tokenId 1', async () => {
      let royaltyInfoToken2 = await generative721a.royaltyInfo(1, toWei(100));
      expect(royaltyInfoToken2[0]).eq(uniqCreator.address);
      expect(royaltyInfoToken2[1]).eq(toWei(10));

      await generative721a.resetTokenRoyalty(1);

      royaltyInfoToken2 = await generative721a.royaltyInfo(1, toWei(100));
      expect(royaltyInfoToken2[0]).eq(creator.address);
      expect(royaltyInfoToken2[1]).eq(toWei(1));
    });

    it('should delete default royalty', async () => {
      await generative721a.deleteDefaultRoyalty();

      expect((await generative721a.royaltyInfo(0, toWei(100)))[0]).eq(zeroAddress);
      expect((await generative721a.royaltyInfo(1, toWei(100)))[0]).eq(zeroAddress);
      expect((await generative721a.royaltyInfo(2, toWei(100)))[0]).eq(zeroAddress);
      expect((await generative721a.royaltyInfo(0, toWei(100)))[1]).eq(0);
      expect((await generative721a.royaltyInfo(1, toWei(100)))[1]).eq(0);
      expect((await generative721a.royaltyInfo(2, toWei(100)))[1]).eq(0);
    });
  });

  describe('Burning the entire collection', async () => {
    before(async () => {
      // minting NFT from two more accounts
      await generative721a.connect(user).mintNft(100);
      await generative721a.connect(user2).mintNft(100);

      // give permission
      await generative721a.approve(user.address, 1);
      await generative721a.setApprovalForAll(operator.address, true);
    });

    it('should return error if not an owner', async () => {
      const errorMessage = 'Ownable: caller is not the owner';

      await expect(generative721a.connect(user).stopSelling()).rejectedWith(errorMessage);
    });

    it('should stop sales and burn the whole collection', async () => {
      await generative721a.stopSelling();

      expect(await generative721a.isSalesStopped()).to.be.true;
    });

    it('totalSupply should be equal zero', async () => {
      expect(await generative721a.totalSupply()).eq(0);
    });

    it('balances should be equal zero', async () => {
      expect(await generative721a.balanceOf(owner.address)).eq(0);
      expect(await generative721a.balanceOf(user.address)).eq(0);
      expect(await generative721a.balanceOf(user2.address)).eq(0);
    });

    it('ownerOf should return error', async () => {
      const errorMessage = 'ERC721: owner query for nonexistent token';

      await expect(generative721a.ownerOf(0)).revertedWith(errorMessage);
      await expect(generative721a.ownerOf(1)).revertedWith(errorMessage);
    });

    it('getApproved / isApproveForAll should return error / false', async () => {
      await expect(generative721a.getApproved(1)).revertedWith('ERC721: approved query for nonexistent token');

      expect(await generative721a.isApprovedForAll(owner.address, operator.address)).to.be.false;
    });

    it('tokenUri should return error', async () => {
      await expect(generative721a.tokenURI(1)).revertedWith('ERC721Metadata: URI query for nonexistent token');
    });
  });
});

