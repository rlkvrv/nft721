import {
  storeImages, storeTokeUriMetadata,
} from '../utils/uploadToPinata';

const imagesLocation = './images/randomNft/';

let tokenUris: string[] = [
  'ipfs://QmPu7ktzgBu4CDjsNoKpEzSMKkCy5UsDCcGvecusySuz57',
  'ipfs://QmQhbuK7jzX7M6dph6VHfcXwxCPUw84DtrwYp4PscLV2TH',
  'ipfs://QmXbnLqzUQynheMFnx9CcNzRHmTeeaxyQX8j6Uptm6WMNs',
];

const metadataTemplate = {
  name: '',
  description: '',
  image: '',
  attributes: [
    {
      traitType: 'Cuteness',
      value: 100,
    },
  ],
};

async function main() {
  if (process.env.UPLOAD_TO_PINATA === 'true') {
    tokenUris = await handleTokenUris();
  }
}

async function handleTokenUris() {
  tokenUris = [];
  const { responses: imageUploadResponses, files } = await storeImages(imagesLocation);
  for (const imageUploadResponseIndex in imageUploadResponses) {
    const tokenUriMetadata = {
      ...metadataTemplate,
    };
    tokenUriMetadata.name = files[imageUploadResponseIndex].replace('.png', '');
    tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} pup!`;
    tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`;
    console.log(`Uploading ${tokenUriMetadata.name}...`);
    const metadataUploadResponse = await storeTokeUriMetadata(tokenUriMetadata);
    tokenUris.push(`ipfs://${metadataUploadResponse!.IpfsHash}`);
  }
  console.log('Token URIs uploaded! They are:');
  console.log(tokenUris);
  return tokenUris;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
