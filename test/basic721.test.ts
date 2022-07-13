import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { Basic721 } from '../typechain-types';

describe('Token contract', () => {
  let basic721: Basic721;
  let owner: SignerWithAddress;
  let signer: SignerWithAddress;
  let operator: SignerWithAddress;
  let recipient: SignerWithAddress;
  let operator2: SignerWithAddress;

  beforeEach(async () => {
    [owner, signer, operator, recipient, operator2] = await ethers.getSigners();

    const Basic721 = (await ethers.getContractFactory('Basic721'));
    basic721 = await Basic721.deploy('ipfs://basicUri.uri/');
  });

  it('functionality', async () => {
    /*
      дает возможность создать nft с одним владельцем, проверять по id владельца ownerOf()
      - можем задать базовый uri и потом при каждом минтинге добавлять id nft
      - можем просто задать базовый uri
      - функция tokenUri из коробки умеет объединять baseUri и tokenUri
      - как правило для id подключают Counter
      - можно проверить общий баланс уникальных nft у конкретного овнера balanceOf()
      - можно посмотреть tokenUri по tokenId либо вернется baseUri либо пустая строка
      - можно выдать апрув на конкретный tokenId
      - проверить апрув можно с помощью функции getApproved
      - можно выдать разрешение оператору на трансферы и выдачу апрувов setApprovalForAll
      - проверить разрешение у оператора можно с помощью isApprovalForAll
      - вместо transfer есть transferFrom
      - есть два вида safeTransferFrom
      - также есть safeTransfer
      - есть минт и safeMint
      - есть burn
      - есть проверка если получатель контракт поддерживает ли он интерфейс ERC721
      - можно добавить в метамаску и пересылать
    */
    await basic721.mintNft('dog');
    // await basic721.mintNft('cat');
    // console.log('basicURI_1: ', await basic721.tokenURI(0));
    // console.log('basicURI_2: ', await basic721.tokenURI(1));
    // console.log('ownerOf_0: ', await basic721.ownerOf(0));

    // await basic721.approve(signer.address, 0);
    // console.log('getApproved: ', await basic721.getApproved(0));
    // console.log('getApproved: ', await basic721.getApproved(1));

    // await basic721.setApprovalForAll(operator.address, true);
    // await basic721.setApprovalForAll(operator2.address, true);
    // console.log('\nisApprovedForAll: ', await basic721.isApprovedForAll(owner.address, operator.address));
    // console.log('isApprovedForAll2: ', await basic721.isApprovedForAll(owner.address, operator2.address));

    // await basic721.connect(signer).transferFrom(owner.address, recipient.address, 0);
    // console.log('\nownerOf_0: ', await basic721.ownerOf(0));
    // console.log('balanceOf: ', await basic721.balanceOf(owner.address));

    // await basic721.connect(operator).approve(signer.address, 1); // the operator can issue an approval
    // await basic721.connect(signer).transferFrom(owner.address, recipient.address, 1);
    // console.log('ownerOf_1: ', await basic721.ownerOf(1));
    // console.log('getApproved: ', await basic721.getApproved(1));
    // console.log('isApprovedForAll: ', await basic721.isApprovedForAll(owner.address, operator.address));

    // console.log('recipientAddr: ', recipient.address);
    // // await basic721.burnNft(1);
    // console.log('balance recipient: ', await basic721.balanceOf(recipient.address));

    // await basic721.mintNft('ram');
    // await basic721['safeTransferFrom(address,address,uint256)'](owner.address, recipient.address, 2);
    // console.log('ownerOf_3: ', await basic721.ownerOf(2));

    // await basic721.mintNft('bull');
    // await basic721.transferFrom(owner.address, recipient.address, 3); //instead of a transfer
    // console.log('basicURI_4: ', await basic721.tokenURI(3));
  });

  it('should burned tokens without approval', async () => {
    await basic721.mintNft('dog');
    expect(await basic721.balanceOf(owner.address)).eq(1);
    expect(await basic721.ownerOf(0)).eq(owner.address);

    await basic721.transferFrom(owner.address, signer.address, 0);

    expect(await basic721.balanceOf(owner.address)).eq(0);
    expect(await basic721.balanceOf(signer.address)).eq(1);
    expect(await basic721.ownerOf(0)).eq(signer.address);

    // owner address is not an owner of token 0
    await basic721.connect(owner).burnNft(0);

    expect(await basic721.balanceOf(owner.address)).eq(0);
    expect(await basic721.balanceOf(signer.address)).eq(0);
    await expect(basic721.ownerOf(0)).revertedWith('ERC721: owner query for nonexistent token');
  });
});

