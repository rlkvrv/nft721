// Import the NFTStorage class and File constructor from the 'nft.storage' package
import {
  NFTStorage, File, TokenType,
} from 'nft.storage';
import mime from 'mime';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const NFT_STORAGE_KEY = process.env.NFT_STORAGE_KEY || '';

type Token = {
    image: File,
    name: string,
    description: string,
}

/**
 * Reads an image file from `imagePath` and stores an NFT with the given name and description.
 * @param {string} imagePath the path to an image file
 * @param {string} name a name for the NFT
 * @param {string} description a text description for the NFT
 */
export async function storeNFTs(imagesPath: string) {
  const fullImagesPath = path.resolve(imagesPath);
  const files = fs.readdirSync(fullImagesPath);
  const responses: TokenType<Token>[] = [];
  for (const fileIndex in files) {
    const image = await fileFromPath(`${fullImagesPath}/${files[fileIndex]}`);
    const nftstorage = new NFTStorage({
      token: NFT_STORAGE_KEY,
    });
    const dogName = files[fileIndex].replace('.png', '');
    const response = await nftstorage.store({
      image,
      name: dogName,
      description: `An adorable ${dogName}`,
      // Currently doesn't support attributes 😔
      // attributes: [{ trait_type: "cuteness", value: 100 }],
    });
    responses.push(response);
  }
  return responses;
}

/**
 * A helper to read a file from a location on disk and return a File object.
 * Note that this reads the entire file into memory and should not be used for
 * very large files.
 * @param {string} filePath the path to a file to store
 * @returns {File} a File object containing the file content
 */
export async function fileFromPath(filePath: string): Promise<File> {
  const content = await fs.promises.readFile(filePath);
  const type = mime.getType(filePath) || undefined;
  return new File([content], path.basename(filePath), {
    type,
  });
}

