import { ethers } from 'hardhat';
import { toWei } from '../test/shared/utils';

import {
  Generative721A, Generative721A__factory as Generative721AFactory,
} from '../typechain-types';

import contractAbi from '../artifacts/contracts/Generative721A.sol/Generative721A.json';

async function main() {
  const [signer] = await ethers.getSigners();

  const collectionURI = 'https://nftstorage.link/ipfs/bafybeifad32sool4xbdv7m32c5rgvmudcpfdvdiqp5dpv6a6hejz2supty/';

  const Generative721A = (await ethers.getContractFactory('Generative721A')) as Generative721AFactory;
  const generative721a: Generative721A = await (await Generative721A.deploy(collectionURI)).deployed();

  console.log('\n Contract addr: ', generative721a.address);

  if (generative721a) {
    const contract = new ethers.Contract(generative721a.address,
      contractAbi.abi,
      signer);

    await contract.setDefaultRoyalty(signer.address, 250);

    console.log('\n Settings: ');
    console.log('\n royalty: ', await contract.royaltyInfo(1, toWei(1)));
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
