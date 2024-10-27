import fs from 'node:fs';
import path from 'node:path';
import ky from 'ky';
import logger from './utils/logger.js';
import * as zstd from '@mongodb-js/zstd';
import * as TypesTrackEntry from './types/TrackEntry.js';
import markdownUtils from './utils/markdownUtils.js';
import { DateTime } from 'luxon';
import stringUtils from './utils/stringUtils.js';

async function main(): Promise<void> {
  logger.trace('Program started');
  const database = await loadDatabaseJson();

  const htmlRootText = markdownUtils.genHtmlTextRoot(database);
  let isNeedWriteRootFlag: boolean = false;
  const isTargetRootFileExists = await isFileExists('build/index.html');
  if (isTargetRootFileExists) {
    const oldFileContent = await fs.promises.readFile('build/index.html', { encoding: 'utf-8' });
    if (htmlRootText != oldFileContent) {
      isNeedWriteRootFlag = true;
    }
  } else {
    isNeedWriteRootFlag = true;
  }
  if (isNeedWriteRootFlag === true) {
    await fs.promises.mkdir(`build`, { recursive: true });
    logger.trace(`Writing HTML file: build/index.html`);
    await fs.promises.writeFile('build/index.html', htmlRootText, { encoding: 'utf-8' });
  }

  for (let i = 0; i < database.length; i++) {
    const optimizedWorkFolderStructureJson = optimizeWorkFolderStructureJson(database[i].workFolderStructure, '');
    const htmlText = markdownUtils.genHtmlTextSingleWork(database[i], optimizedWorkFolderStructureJson);
    let isNeedWriteWorkFlag: boolean = false;
    const isTargetWorkFileExists = await isFileExists(
      `build/works/${database[i].workInfoPruned.create_date}/${stringUtils.numberToRJIdString(database[i].workInfoPruned.id)}.html`,
    );
    if (isTargetWorkFileExists) {
      const oldFileContent = await fs.promises.readFile(
        `build/works/${database[i].workInfoPruned.create_date}/${stringUtils.numberToRJIdString(database[i].workInfoPruned.id)}.html`,
        { encoding: 'utf-8' },
      );
      if (htmlText != oldFileContent) {
        isNeedWriteWorkFlag = true;
      }
    } else {
      isNeedWriteWorkFlag = true;
    }
    if (isNeedWriteWorkFlag === true) {
      await fs.promises.mkdir(`build/works/${database[i].workInfoPruned.create_date}`, { recursive: true });
      logger.trace(
        `Writing HTML file: build/works/${database[i].workInfoPruned.create_date}/${stringUtils.numberToRJIdString(database[i].workInfoPruned.id)}.html`,
      );
      await fs.promises.writeFile(
        `build/works/${database[i].workInfoPruned.create_date}/${stringUtils.numberToRJIdString(database[i].workInfoPruned.id)}.html`,
        htmlText,
        { encoding: 'utf-8' },
      );
    }
  }
}

async function isFileExists(pathStr: string): Promise<boolean> {
  try {
    await fs.promises.access(path.resolve(pathStr));
    return true;
  } catch {
    return false;
  }
}

async function loadDatabaseJson(): Promise<
  Array<{
    workInfoPruned: Record<string, any>;
    workFolderStructure: Array<TypesTrackEntry.TypeModifiedTrackEntry>;
    date: string;
  }>
> {
  logger.info('Loading database ...');
  const response = await ky(
    'https://huggingface.co/datasets/DeliberatorArchiver/asmr-archive-data/resolve/main/database.json.zst',
    {
      method: 'get',
      retry: 10,
      timeout: 20000,
    },
  );
  return JSON.parse((await zstd.decompress(Buffer.from(await response.arrayBuffer()))).toString('utf-8'));
}

function optimizeWorkFolderStructureJson(
  data: Array<TypesTrackEntry.TypeModifiedTrackEntry> | any,
  pathString: string = '',
) {
  let downloadTrackListArray: Array<TypesTrackEntry.TypeOptimizedTrackEntry> = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].type === 'folder' && data[i].children && data[i].children !== null) {
      downloadTrackListArray = downloadTrackListArray.concat(
        optimizeWorkFolderStructureJson(data[i].children || [], path.join(pathString, data[i].title)),
      );
    } else {
      downloadTrackListArray.push({
        uuid: data[i].uuid,
        path: path.join(pathString, data[i].title),
        url: data[i].mediaDownloadUrl,
        hash: data[i].hash,
      });
    }
  }
  return downloadTrackListArray;
}

await main();
