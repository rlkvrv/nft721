import { ethers } from 'hardhat';

async function main() {
  // deploy start
  const startFactory = await ethers.getContractFactory('Start');
  const start = await startFactory.deploy();

  await start.deployed();
  console.log('Start deployed to:', start.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
