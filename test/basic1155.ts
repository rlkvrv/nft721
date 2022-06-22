import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { Basic1155 } from '../typechain-types';

describe('Token contract', () => {
  let basic1155: Basic1155;
  let owner: SignerWithAddress;
  let signer: SignerWithAddress;
  let operator: SignerWithAddress;
  let recipient: SignerWithAddress;

  beforeEach(async () => {
    [owner, signer, operator, recipient] = await ethers.getSigners();

    const Basic1155 = (await ethers.getContractFactory('Basic1155'));
    basic1155 = await Basic1155.deploy('ipfs://basicUri.uri/');
  });

  it('functionality', async () => {
    /*
      -Особенность этих nft в том, что uri задается по умолчанию,
      поэтому описание имени будет в json,
      - метамаска пока не поддерживает переводы 1155 (можно как-то через OpenSea)
      - нельзя заапрувить перевод определенного количества,
        можно только перевести всех сразу для оператора
      - можно задать отдельный uri для каждого id
      - можно отправлять nft сразу массивами где будет указан id и количество
      - можно проверять баланс у нескольких юзеров по одному id
      - функции проверки контракта зашиты в mint и transfer
      - нет функции ownerOf
    */

    console.log('erc1155 URI: ', await basic1155.uri(1));
    console.log('erc1155 URI: ', await basic1155.uri(2));
    console.log('erc1155 URI: ', await basic1155.uri(5));

    await basic1155.mintBatch(
      owner.address, [1, 2, 5], [10, 20, 50], '0x'
    );

    console.log('balanceOf:', await basic1155.balanceOf(owner.address, 1));
    console.log('balanceOfBatch 1 2 5:', await basic1155.balanceOfBatch([owner.address, owner.address, owner.address], [1, 2, 5]));

    await basic1155.safeTransferFrom(
      owner.address, recipient.address, 5, 1, '0x'
    );

    await basic1155.safeBatchTransferFrom(
      owner.address, signer.address, [2, 5], [5, 5], '0x'
    );

    console.log('balanceOfBatch 2:', await basic1155.balanceOfBatch([signer.address, recipient.address], [2, 2]));
    console.log('balanceOfBatch 5:', await basic1155.balanceOfBatch([signer.address, recipient.address], [5, 5]));
  });
});

