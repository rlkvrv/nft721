import { ethers } from 'hardhat';

async function main() {
  const Nft721 = (await ethers.getContractFactory('Nfn721'));
  const nft721 = await (await Nft721.deploy()).deployed();

  console.log('Contract address: ', nft721.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
