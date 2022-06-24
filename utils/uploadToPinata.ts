import pinataSDK from '@pinata/sdk';
import { PinataPinResponse } from '@pinata/sdk';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const pinataApiKey = process.env.PINATA_API_KEY || '';
const pinataApiSecret = process.env.PINATA_API_SECRET || '';
const pinata = pinataSDK(pinataApiKey, pinataApiSecret);

export async function storeImages(imagesFilePath: string) {
  const fullImagesPath = path.resolve(imagesFilePath);
  const files = fs.readdirSync(fullImagesPath);
  const responses: PinataPinResponse[] = [];
  for (const fileIndex in files) {
    const readableStreamForFile = fs.createReadStream(`${fullImagesPath}/${files[fileIndex]}`);
    try {
      const response: PinataPinResponse = await pinata.pinFileToIPFS(readableStreamForFile);
      responses.push(response);
    } catch (error) {
      console.log(error);
    }
  }
  return {
    responses, files,
  };
}

// eslint-disable-next-line @typescript-eslint/ban-types
export async function storeTokeUriMetadata(metadata: Object) {
  try {
    const response = await pinata.pinJSONToIPFS(metadata);
    return response;
  } catch (error) {
    console.log(error);
  }
  return null;
}
