import { ethers } from 'hardhat';

async function main() {
  const NFTExperimental = (await ethers.getContractFactory('NFTExperimental'));
  const nftExperimental = await (await NFTExperimental.deploy()).deployed();

  console.log('Contract address: ', nftExperimental.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
