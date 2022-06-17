import '@nomicfoundation/hardhat-chai-matchers';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-ethers';
import '@typechain/hardhat';
import 'solidity-coverage';
import { HardhatUserConfig } from 'hardhat/config';
import { task } from 'hardhat/config';
import dotenv from 'dotenv';
dotenv.config();

const accountPrivateKey: string | undefined = process.env.PRIVATE_KEY;
if (!accountPrivateKey) {
  throw new Error('Please set your PRIVATE_KEY in a .env file');
}

task('accounts', 'Prints the list of accounts', async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.13',
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 31337,
      initialBaseFeePerGas: 0,
      gas: 'auto',
    },
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
      accounts: [accountPrivateKey],
    },
  },
  etherscan: {
    apiKey: `${process.env.ETHERSCAN_KEY}`,
  },
  typechain: {
    outDir: 'typechain-types',
    target: 'ethers-v5',
  },
};

export default config;
