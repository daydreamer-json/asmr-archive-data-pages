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
    <meta property="og:url" content="https://asmr-archive-data.daydreamer-json.cc/works/${metadataJson.workInfoPruned.create_date}/${stringUtils.numberToRJIdString(metadataJson.workInfoPruned.id)}" />
    <meta property="og:image" content="${remoteLfsRepoRoot}/output/${metadataJson.workInfoPruned.create_date}/${metadataJson.workInfoPruned.source_id}/cover_main.jpg" />
    <meta property="og:image:alt" content="" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${htmlEscape(metadataJson.workInfoPruned.title)}" />
    <meta name="twitter:description" content="ASMR Archive Data" />
    <meta name="twitter:image" content="${remoteLfsRepoRoot}/output/${metadataJson.workInfoPruned.create_date}/${metadataJson.workInfoPruned.source_id}/cover_main.jpg" />
    <!-- <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" href="/icon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="icon.png" /> -->
    <meta name="theme-color" content="#fafafa" />
    <style>
      /* @import url('https://cdn.jsdelivr.net/gh/daydreamer-json/SanFranciscoFontCDN@main/sanfrancisco.min.css'); */
      @import url('https://cdn.jsdelivr.net/npm/bootstrap@5.3/dist/css/bootstrap.min.css');
      @import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css');
      @import url('https://cdn.vidstack.io/player/theme.css');
      @import url('https://cdn.vidstack.io/player/video.css');
      @import url('https://cdn.vidstack.io/player/audio.css');
      @import url('https://rsms.me/inter/inter.css');
      @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Noto+Sans+JP:wght@100..900&family=Noto+Sans+SC:wght@100..900&display=swap');
      @import url('../../assets/css/work.css');
    </style>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3/dist/js/bootstrap.min.js"></script>
    <script src="https://cdn.vidstack.io/player" type="module"></script>
  </head>
  <body>
    <div class="my-4 container px-4" id="mainContainer"><h1 class="text-break" id="work-page-title">---</h1><hr class="my-3"><a id="work-coverImage-link" rel="noopener noreferrer" target="_blank"><img class="rounded" class="my-4" alt="Cover Image" id="work-coverImage-img" src="../../assets/img/cover_main_dummy/small/purple.webp" style="max-width:100%"></a><hr class="my-3"><h2>Work Info</h2><table class="align-middle table table-hover table-sm"><tr><th>ID<td class="font-monospace"><a id="work-data-info-id" rel="nofollow">---</a><tr><th>Title<td class="text-break" id="work-data-info-workTitle">---<tr><td>Circle<td class="text-break"><span id="work-data-info-circleName">---</span> (<a id="work-data-info-circleLink" rel="nofollow" class="font-monospace">---</a>)<tr><td>VAs<td class="text-break" id="work-data-info-vas">---<tr><td>Tags<td class="text-break" id="work-data-info-tags">---<tr><td>Age restrict<td id="work-data-info-ageCategoryString">---<tr><td>Price<td class="font-monospace" id="work-data-info-price">---<tr><td>Released<td class="font-monospace" id="work-data-info-releasedAt">---<tr><td>Created<td class="font-monospace" id="work-data-info-createdAt">---<tr><td>Added<td class="font-monospace" id="work-data-info-date">---</table><hr class="my-3"><h2>File List</h2><ul class="ps-4" id="work-fileList-parent"></ul><div class="fade modal" id="player-modal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"><div class="modal-dialog modal-dialog-centered modal-dialog-scrollable"><div class="modal-content"><div class="modal-header"><p class="text-break modal-title" id="player-modal-title"></p><button class="btn-close" id="player-modal-close" type="button"></button></div><div class="modal-body" id="player-modal-body"><div class="d-flex flex-column justify-content-center w-100" id="player-modal-body-flex"><div id="vidstack-target"></div></div></div><div class="modal-footer"><a id="player-modal-download-btn" rel="noopener noreferrer" class="btn btn-primary" target="_blank"><i class="bi bi-box-arrow-up-right me-2"></i>Download</a></div></div></div></div></div>
    <script>
      const embedMinimalInfo = ${JSON.stringify({
        id: metadataJson.workInfoPruned.id,
        create_date: metadataJson.workInfoPruned.create_date,
      })};
    </script>
    <script type="module" src="../../assets/js/work.js"></script>
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
    <meta property="og:url" content="https://asmr-archive-data.daydreamer-json.cc/" />
    <meta property="og:image" content="https://asmr-archive-data.daydreamer-json.cc/assets/top_ogp.png" />
    <meta property="og:image:alt" content="" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="ASMR Media Archive Storage" />
    <meta name="twitter:image" content="https://asmr-archive-data.daydreamer-json.cc/assets/top_ogp.png" />
    <!-- <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" href="/icon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="icon.png" /> -->
    <meta name="theme-color" content="#fafafa" />
    <style>
      @import url('https://cdn.jsdelivr.net/npm/bootstrap@5.3/dist/css/bootstrap.min.css');
      @import url('https://cdn.jsdelivr.net/npm/datatables.net-bs5@2.1.8/css/dataTables.bootstrap5.min.css');
      @import url('https://rsms.me/inter/inter.css');
      @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Noto+Sans+JP:wght@100..900&family=Noto+Sans+SC:wght@100..900&display=swap');
      @import url('./assets/css/top.css');
    </style>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3/dist/js/bootstrap.min.js"></script>
    <script src="https://code.jquery.com/jquery-3.7.1.slim.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/datatables.net@2.1.8/js/dataTables.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/datatables.net-bs5@2.1.8/js/dataTables.bootstrap5.min.js"></script>
  </head>
  <body>
    <div class="container my-4 px-4"id=mainContainer><h1>ASMR Media Archive Storage</h1><hr class=my-3><p>This site contains an archive of ASMR works.<p><u>All data in this site is uploaded for <strong>educational and research purposes only. </strong></u>All use is at your own risk.<br>Everything on this site is licensed under the <a href=https://www.gnu.org/licenses/agpl-3.0.txt rel="noopener noreferrer"target=_blank>GNU Affero General Public License</a>. Please comply with the license.<p>Updated at: <strong class="font-monospace">${(() => {
      return DateTime.fromSeconds(
        database.map((obj) => DateTime.fromISO(obj.date).toSeconds()).reduce((a, b) => Math.max(a, b)),
      ).toISO();
    })()}</strong><hr class=my-3><h2>Works List</h2><table id="work-list-root" class="align-middle table table-bordered table-hover table-sm table-striped"><thead class=align-middle><tr><th>Create Date<th>Release Date<th>ID<th id="work-list-coverImage-th">Cover<th style="min-width:300px;">Title<tbody id=work-list-tbody></table><div class="align-items-center d-none mb-3"id=loadingSpinner-databaseLoad><div class="me-2 spinner-border"></div><span id=loadingSpinner-databaseLoad-label></span></div><hr class=my-3><small>(C) daydreamer-json</small></div>
    <script type="module" src="./assets/js/top.js"></script>
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
