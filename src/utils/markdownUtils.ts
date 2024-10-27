import { DateTime } from 'luxon';
import * as TypesTrackEntry from '../types/TrackEntry.js';
import path from 'path';
import stringUtils from './stringUtils.js';

const remoteLfsRepoRoot = 'https://huggingface.co/datasets/DeliberatorArchiver/asmr-archive-data/resolve/main';

function genHtmlTextSingleWork(
  metadataJson: {
    workInfoPruned: Record<string, any>;
    workFolderStructure: Array<TypesTrackEntry.TypeModifiedTrackEntry>;
    date: string;
  },
  optimizedWorkFolderStructureJson: Array<TypesTrackEntry.TypeOptimizedTrackEntry>,
) {
  const outputText = `<!doctype html>
<html lang="en" data-bs-theme="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${htmlEscape(metadataJson.workInfoPruned.title)}</title>
    <meta name="description" content="ASMR Archive Data" />
    <meta property="og:title" content="${htmlEscape(metadataJson.workInfoPruned.title)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="" />
    <meta property="og:image" content="${remoteLfsRepoRoot}/output/${metadataJson.workInfoPruned.create_date}/${metadataJson.workInfoPruned.source_id}/cover_main.jpg" />
    <meta property="og:image:alt" content="" />
    <!-- <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" href="/icon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="icon.png" /> -->
    <meta name="theme-color" content="#fafafa" />
    <style>
      /* @import url('https://cdn.jsdelivr.net/gh/daydreamer-json/SanFranciscoFontCDN@main/sanfrancisco.min.css'); */
      @import url('https://cdn.jsdelivr.net/npm/bootstrap@5.3/dist/css/bootstrap.min.css');
      @import url('https://rsms.me/inter/inter.css');
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&display=swap');
      @import url('../../assets/css/work.css');
    </style>
    <!-- <script src="https://unpkg.com/axios/dist/axios.min.js"></script> -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3/dist/js/bootstrap.min.js"></script>
  </head>
  <body>
    <div id="mainContainer" class="container px-4 my-4"><h1 id="work-page-title">---</h1><hr class="my-3"><a id="work-coverImage-link" target="_blank" rel="noopener noreferrer"><img class="rounded" id="work-coverImage-img" class="my-4" alt="Cover Image" style="max-width:100%" src="../../assets/cover_main_dummy.webp"></a><hr class="my-3"><h2>Work Info</h2><table class="table table-sm table-borderless table-striped-columns table-hover align-middle"><tbody><tr><td>ID</td><td><a id="work-data-info-id" rel="nofollow">---</a></td></tr><tr><td>Title</td><td id="work-data-info-workTitle">---</td></tr><tr><td>Circle</td><td><span id="work-data-info-circleName">---</span>(<a id="work-data-info-circleLink" rel="nofollow">---</a>)</td></tr><tr><td>VAs</td><td id="work-data-info-vas">---</td></tr><tr><td>Tags</td><td id="work-data-info-tags">---</td></tr><tr><td>Age restrict</td><td id="work-data-info-ageCategoryString">---</td></tr><tr><td>Price</td><td id="work-data-info-price">---</td></tr><tr><td>Released</td><td id="work-data-info-releasedAt">---</td></tr><tr><td>Created</td><td id="work-data-info-createdAt">---</td></tr><tr><td>Added</td><td id="work-data-info-date">---</td></tr></tbody></table><hr class="my-3"><h2>File List</h2><div id="work-fileList-parent"></div></div>
    <script>
      const database = ${JSON.stringify(metadataJson)};
    </script>
    <script src="../../assets/js/work.js"></script>
  </body>
</html>
`;
  return outputText;
}

function genHtmlTextRoot(
  database: Array<{
    workInfoPruned: Record<string, any>;
    workFolderStructure: Array<TypesTrackEntry.TypeModifiedTrackEntry>;
    date: string;
  }>,
) {
  const outputText = `<!doctype html>
<html lang="en" data-bs-theme="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ASMR Media Archive Storage</title>
    <meta name="description" content="ASMR Media Archive Storage" />
    <meta property="og:title" content="ASMR Media Archive Storage" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="" />
    <meta property="og:image" content="" />
    <meta property="og:image:alt" content="" />
    <!-- <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" href="/icon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="icon.png" /> -->
    <meta name="theme-color" content="#fafafa" />
    <style>
      @import url('https://cdn.jsdelivr.net/npm/bootstrap@5.3/dist/css/bootstrap.min.css');
      @import url('https://rsms.me/inter/inter.css');
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@100..900&display=swap');
      @import url('./assets/css/top.css');
    </style>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3/dist/js/bootstrap.min.js"></script>
  </head>
  <body>
    <div id="mainContainer" class="container px-4 my-4"><h1>ASMR Media Archive Storage</h1><hr class="my-3"><p>This site contains an archive of ASMR works. </p><p><u>All data in this site is uploaded for <strong>educational and research purposes only. </strong></u>All use is at your own risk. <br>Everything on this site is licensed under the <a target="_blank" rel="noopener noreferrer" href="https://www.gnu.org/licenses/agpl-3.0.txt">GNU Affero General Public License</a>. Please comply with the license.</p><p>Updated at: <strong>${(() => {
      return DateTime.fromSeconds(
        database.map((obj) => DateTime.fromISO(obj.date).toSeconds()).reduce((a, b) => Math.max(a, b)),
      ).toISO();
    })()}</strong></p><hr class="my-3"><h2>Works List</h2><table class="table table-sm table-bordered table-striped table-hover align-middle"><thead class="align-middle"><tr><th>Create Date</th><th>Release Date</th><th>ID</th><th>Title</th></tr></thead><tbody id="work-list-tbody"></tbody></table><hr class="my-3"><small>(C) daydreamer-json</small></div>
    <script>const database = ${JSON.stringify(database.map((entryObj) => ({ create_date: entryObj.workInfoPruned.create_date, release: entryObj.workInfoPruned.release, id: entryObj.workInfoPruned.id, title: entryObj.workInfoPruned.title })))}</script>
    <script src="./assets/js/top.js"></script>
  </body>
</html>
`;
  return outputText;
}

function markdownEscape(input: string) {
  return input
    .replaceAll('*', '\\*')
    .replaceAll('~', '\\~')
    .replaceAll('[', '\\[')
    .replaceAll(']', '\\]')
    .replaceAll('#', '\\#')
    .replaceAll('_', '\\_')
    .replaceAll('<', '\\<')
    .replaceAll('>', '\\>');
}

function htmlEscape(input: string) {
  return input
    .replaceAll('<', '&#60;')
    .replaceAll('>', '&#62;')
    .replaceAll('&', '&#38;')
    .replaceAll('"', '&#34;')
    .replaceAll(`'`, '&#39;')
    .replaceAll(' ', '&#32;');
}

export default {
  genHtmlTextSingleWork,
  genHtmlTextRoot,
};
