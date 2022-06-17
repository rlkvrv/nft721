
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';

export const getBalance = ethers.provider.getBalance;

export const fromWei = (value: BigNumber) => ethers.utils.formatEther(typeof value === 'string' ? value : value.toString());

export const toWei = (value: number): BigNumber => ethers.utils.parseEther(value.toString());
