import { ethers } from 'hardhat';

async function main() {
  const [owner] = await ethers.getSigners();

  const NFTWithWhitelist = await ethers.getContractFactory('NFTWithWhitelist', owner);
  const nftWithWhitelist = await (await NFTWithWhitelist.deploy()).deployed();

  console.log('Contract address: ', nftWithWhitelist.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
