import { ethers } from 'hardhat';
import { toWei } from '../test/shared/utils';

import {
  GenerativeNFT, GenerativeNFT__factory as GenerativeNFTFactory,
} from '../typechain-types';

import contractAbi from '../artifacts/contracts/GenerativeNFT.sol/GenerativeNFT.json';

async function main() {
  const [signer] = await ethers.getSigners();

  const mockUri = 'https://nftstorage.link/ipfs/bafybeifad32sool4xbdv7m32c5rgvmudcpfdvdiqp5dpv6a6hejz2supty/';

  const GenerativeNFT: GenerativeNFTFactory = (await ethers.getContractFactory('GenerativeNFT'));
  const generativeNft: GenerativeNFT = await (await GenerativeNFT.deploy(mockUri)).deployed();

  console.log('\n Contract addr: ', generativeNft.address);

  if (generativeNft) {
    const contract = new ethers.Contract(generativeNft.address,
      contractAbi.abi,
      signer);

    await contract.setDefaultRoyalty(signer.address, 100);

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
