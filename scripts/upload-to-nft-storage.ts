import { storeNFTs } from '../utils/uploadToNftStorage';

const imagesLocation = './images/randomNft/';

async function main() {
  const responses = await storeNFTs(imagesLocation);
  console.log('responsesNFTStorage: ', responses);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
