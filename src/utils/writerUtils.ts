import logger from './logger.js';
import fs from 'fs';
import path from 'path';
import { compress as zstdCompress, decompress as zstdDecompress } from '@mongodb-js/zstd';

async function createDirectory(path: string) {
  await fs.promises.mkdir(path, { recursive: true });
}

function getDirectoryStrFromPath(pathStr: string) {
  return path.dirname(pathStr);
}

async function writeJsonData(data: object | Array<any>, path: string, isMinify: boolean = true) {
  logger.debug('Writing JSON data to file:', path);
  await createDirectory(getDirectoryStrFromPath(path));
  await fs.promises.writeFile(path, isMinify ? JSON.stringify(data) : JSON.stringify(data, null, '  '), {
    flag: 'w',
    encoding: 'utf8',
  });
}

async function writeZstdData(data: Buffer, path: string, compressionLevel: number = 16) {
  logger.debug('Writing ZStd data to file:', path);
  await createDirectory(getDirectoryStrFromPath(path));
  await fs.promises.writeFile(path, await zstdCompress(data, compressionLevel), { flag: 'w', encoding: 'binary' });
}

async function readZstdData(path: string) {
  logger.debug('Reading ZStd data from file:', path);
  return await zstdDecompress(await fs.promises.readFile(path));
}

export default {
  writeJsonData,
  writeZstdData,
  readZstdData,
};
