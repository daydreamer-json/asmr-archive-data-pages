import fs from 'node:fs';
import path from 'node:path';
import ky from 'ky';
import logger from './utils/logger.js';
import * as zstd from '@mongodb-js/zstd';
import * as TypesTrackEntry from './types/TrackEntry.js';
import markdownUtils from './utils/markdownUtils.js';
import { DateTime } from 'luxon';
import stringUtils from './utils/stringUtils.js';
import tarballUtils from './utils/tarballUtils.js';
import writerUtils from './utils/writerUtils.js';

async function main(): Promise<void> {
  logger.trace('Program started');
  const database = await loadDatabaseJson();
  const databaseKeyListWorkInfo = ['create_date', 'release', 'id', 'title'];
  const databaseKeyListExternal = ['repoIndex'];
  const writeDatabaseContext = {
    keyList: [...databaseKeyListWorkInfo, ...databaseKeyListExternal],
    valueList: database.map((entryObj) => {
      const outObj: any[] = [];
      for (const keyName of databaseKeyListWorkInfo) {
        outObj.push(entryObj.workInfoPruned[keyName]);
      }
      outObj.push(entryObj.repoIndex);
      return outObj;
    }),
    generatedAt: database.map((obj) => DateTime.fromISO(obj.date).toSeconds()).reduce((a, b) => Math.max(a, b)),
  };

  await fs.promises.mkdir(`build`, { recursive: true });
  logger.trace(`Writing pruned database file: build/database.json.zst`);
  // await fs.promises.writeFile('build/database.json', JSON.stringify(writeDatabaseContext), { encoding: 'utf-8' });
  await fs.promises.writeFile(
    'build/database.json.zst',
    await zstd.compress(Buffer.from(JSON.stringify(writeDatabaseContext), 'utf-8'), 18),
  );

  // logger.trace('Writing HTML works file ...');
  // for (let i = 0; i < database.length; i++) {
  //   const optimizedWorkFolderStructureJson = optimizeWorkFolderStructureJson(database[i].workFolderStructure, '');
  //   const htmlText = markdownUtils.genHtmlTextSingleWork(database[i], optimizedWorkFolderStructureJson);
  //   let isNeedWriteWorkFlag: boolean = false;
  //   const isTargetWorkFileExists = await isFileExists(
  //     `build/works/${database[i].workInfoPruned.create_date}/${stringUtils.numberToRJIdString(database[i].workInfoPruned.id)}.html`,
  //   );
  //   if (isTargetWorkFileExists) {
  //     const oldFileContent = await fs.promises.readFile(
  //       `build/works/${database[i].workInfoPruned.create_date}/${stringUtils.numberToRJIdString(database[i].workInfoPruned.id)}.html`,
  //       { encoding: 'utf-8' },
  //     );
  //     if (htmlText != oldFileContent) {
  //       isNeedWriteWorkFlag = true;
  //     }
  //   } else {
  //     isNeedWriteWorkFlag = true;
  //   }
  //   if (isNeedWriteWorkFlag === true) {
  //     await fs.promises.mkdir(`build/works/${database[i].workInfoPruned.create_date}`, { recursive: true });
  //     // logger.trace(
  //     //   `Writing HTML file: build/works/${database[i].workInfoPruned.create_date}/${stringUtils.numberToRJIdString(database[i].workInfoPruned.id)}.html`,
  //     // );
  //     await fs.promises.writeFile(
  //       `build/works/${database[i].workInfoPruned.create_date}/${stringUtils.numberToRJIdString(database[i].workInfoPruned.id)}.html`,
  //       htmlText,
  //       { encoding: 'utf-8' },
  //     );
  //   }
  // }
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
    repoIndex: number;
  }>
> {
  const dbUrlList = [
    'https://huggingface.co/datasets/DeliberatorArchiver/asmr-archive-data-01/resolve/main/database.tar.zst',
    'https://huggingface.co/datasets/DeliberatorArchiver/asmr-archive-data-02/resolve/main/database.tar.zst',
  ];
  logger.info('Loading database ...');
  const parsedJsonChunk = [];
  for (const [index, dbUrl] of Object.entries(dbUrlList)) {
    const response = await ky(dbUrl, {
      method: 'get',
      retry: 10,
      timeout: 20000,
    });
    const extractedTar = await tarballUtils.extractTarBuffer(
      await zstd.decompress(Buffer.from(await response.arrayBuffer())),
    );
    parsedJsonChunk.push(
      extractedTar
        .map((entry) => {
          return JSON.parse(entry.data.toString('utf-8'));
        })
        .flat()
        .map((obj) => ({ ...obj, repoIndex: parseInt(index) + 1 })),
    );
  }
  return parsedJsonChunk
    .flat()
    .sort((a, b) => DateTime.fromISO(a).toSeconds() - DateTime.fromISO(b).toSeconds())
    .map((obj: { workInfoPruned: any; workFolderStructure: any; date: string; repoIndex: number }) => ({
      workInfoPruned: obj.workInfoPruned,
      workFolderStructure: obj.workFolderStructure,
      date: obj.date,
      repoIndex: obj.repoIndex,
    }));
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
