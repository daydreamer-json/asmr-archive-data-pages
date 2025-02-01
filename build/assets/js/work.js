import ky from 'https://cdn.jsdelivr.net/npm/ky@1.7.2/+esm';
import { VidstackPlayer, VidstackPlayerLayout } from 'https://cdn.vidstack.io/player';

let remoteLfsRepoRoot = null;
const remoteLfsRepoRootArray = [
  'https://huggingface.co/datasets/DeliberatorArchiver/asmr-archive-data-01/resolve/main',
  'https://huggingface.co/datasets/DeliberatorArchiver/asmr-archive-data-02/resolve/main'
];

function updateTheme() {
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-bs-theme', isDarkMode ? 'dark' : 'light');
}

window.addEventListener('DOMContentLoaded', () => {
  updateTheme();
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTheme);

window.addEventListener('load', async () => {
  const urlQueryParams = getUrlQueryParams();
  if (!urlQueryParams.create_date || !urlQueryParams.id) {
    window.location.replace('./404.html');
  } else {
    await (async () => {
      for (let i = 0; i < remoteLfsRepoRootArray.length; i++) {
        const rootUrlEl = remoteLfsRepoRootArray[i];
        const exists = await (async () => {
          try {
            const rsp = await ky.head(`${rootUrlEl}/output/${urlQueryParams.create_date}/${numberToRJIdString(parseInt(urlQueryParams.id))}/metadata.json`, { method: 'head', retry: 10, timeout: 20000 });
            return true;
          } catch (error) {
            return false;
          }
        })();
        if (exists) {
          remoteLfsRepoRoot = rootUrlEl;
          return;
        }
      }
      throw new Error('No available repo found');
    })();
    const loadedDatabase = await ky(
      `${remoteLfsRepoRoot}/output/${urlQueryParams.create_date}/${numberToRJIdString(parseInt(urlQueryParams.id))}/metadata.json`,
      {
        method: 'get',
        retry: 10,
        timeout: 20000,
      },
    ).json();
    setOgpAttr(loadedDatabase);
    databaseToHtml(loadedDatabase);
  }
});

function getUrlQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const urlQueryParams = {};
  params.forEach((value, key) => {
    urlQueryParams[key] = value;
  });
  return urlQueryParams;
}

function setOgpAttr(database) {
  document.title = database.workInfoPruned.title;
  document.querySelector('meta[property="og:title"]').setAttribute("content", database.workInfoPruned.title);
  document.querySelector('meta[property="og:url"]').setAttribute("content", window.location.href);
  document.querySelector('meta[property="og:image"]').setAttribute("content", `${remoteLfsRepoRoot}/output/${database.workInfoPruned.create_date}/${database.workInfoPruned.source_id}/cover_main.jpg`);
  document.querySelector('meta[name="twitter:title"]').setAttribute("content", database.workInfoPruned.title);
  document.querySelector('meta[name="twitter:image"]').setAttribute("content", `${remoteLfsRepoRoot}/output/${database.workInfoPruned.create_date}/${database.workInfoPruned.source_id}/cover_main.jpg`);
}

function databaseToHtml(database) {
  document.getElementById('work-page-title').innerText = database.workInfoPruned.title;
  document.getElementById('work-data-info-workTitle').innerText = database.workInfoPruned.title;
  document
    .getElementById('work-coverImage-link')
    .setAttribute(
      'href',
      `${remoteLfsRepoRoot}/output/${database.workInfoPruned.create_date}/${database.workInfoPruned.source_id}/cover_main.jpg`,
    );
  document
    .getElementById('work-coverImage-img')
    .setAttribute(
      'src',
      `${remoteLfsRepoRoot}/output/${database.workInfoPruned.create_date}/${database.workInfoPruned.source_id}/cover_main.jpg`,
    );
  document.getElementById('work-data-info-id').innerText = numberToRJIdString(database.workInfoPruned.id);
  document
    .getElementById('work-data-info-id')
    .setAttribute(
      'href',
      `https://www.dlsite.com/maniax/work/=/product_id/${numberToRJIdString(database.workInfoPruned.id)}.html`,
    );
  document.getElementById('work-data-info-circleName').innerText = database.workInfoPruned.circle.name;
  document.getElementById('work-data-info-circleLink').innerText =
    `RG${database.workInfoPruned.circle.id.toString().padStart(5, '0')}`;
  document
    .getElementById('work-data-info-circleLink')
    .setAttribute(
      'href',
      `https://www.dlsite.com/maniax/circle/profile/=/maker_id/RG${database.workInfoPruned.circle.id.toString().padStart(5, '0')}.html`,
    );
  document.getElementById('work-data-info-vas').innerText = (() => {
    let vadisp = null;
    if (
      database.workInfoPruned.vas.length !== 0 &&
      database.workInfoPruned.vas[0].id !== '83a442aa-3662-5e17-aece-757bc3cb97cd' &&
      database.workInfoPruned.vas[0].name !== 'N/A'
    ) {
      vadisp = database.workInfoPruned.vas.map((obj) => obj.name).join(', ');
    } else {
      vadisp = '---';
    }
    return vadisp;
  })();
  document.getElementById('work-data-info-tags').innerText = (() => {
    let tagdisp = null;
    if (database.workInfoPruned.tags.length !== 0) {
      tagdisp = database.workInfoPruned.tags
        .map((obj) => {
          if (Object.keys(obj.i18n).length === 0) {
            return obj.name;
          } else {
            return obj.i18n['ja-jp'].name;
          }
        })
        .join(', ');
    } else {
      tagdisp = '---';
    }
    return tagdisp;
  })();
  document.getElementById('work-data-info-ageCategoryString').innerText = database.workInfoPruned.age_category_string;
  document.getElementById('work-data-info-price').innerText = database.workInfoPruned.price + ' JPY';
  document.getElementById('work-data-info-releasedAt').innerText = database.workInfoPruned.release;
  document.getElementById('work-data-info-createdAt').innerText = database.workInfoPruned.create_date;
  document.getElementById('work-data-info-date').innerText = database.date;

  const fileListBreadcrumbArray = [];
  const optimizedWorkFolderStructureJson = optimizeWorkFolderStructureJson(database.workFolderStructure, '');
  optimizedWorkFolderStructureJson
    .sort((a, b) => {
      return a.path.localeCompare(b.path, 'ja');
    })
    .forEach((trackEntry) => {
      const pathSplittedArray = trackEntry.path.replaceAll('\\', '/').split('/');
      const breadcrumb = document.createElement('ol');
      breadcrumb.className = 'breadcrumb mb-1';
      pathSplittedArray.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'breadcrumb-item';
        if (index === pathSplittedArray.length - 1) {
          const link = document.createElement('a');
          const srcString = `${remoteLfsRepoRoot}/output/${database.workInfoPruned.create_date}/${database.workInfoPruned.source_id}/${trackEntry.uuid}.${getExtFromFilename(trackEntry.path)}`;
          if (
            ['wav', 'mp3', 'flac', 'm4a', 'aac', 'alac', 'ogg', 'opus', 'wma', 'mp4', 'webm', 'mkv', 'avi'].includes(
              getExtFromFilename(trackEntry.path),
            )
          ) {
            link.textContent = item;
            link.classList.add('link-opacity-100');
            link.setAttribute('style', 'cursor: pointer;');
            link.addEventListener('click', async () => {
              await modalInitialize(srcString, item, false);
            });
          } else if (
            ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff'].includes(getExtFromFilename(trackEntry.path))
          ) {
            link.textContent = item;
            link.classList.add('link-opacity-100');
            link.setAttribute('style', 'cursor: pointer;');
            link.addEventListener('click', async () => {
              await modalInitialize(srcString, item, true);
            });
          } else {
            link.textContent = item;
            link.href = srcString;
            link.setAttribute('rel', 'noopener noreferrer');
            link.setAttribute('target', '_blank');
          }
          li.appendChild(link);
          li.classList.add('active');
        } else {
          li.textContent = item;
        }
        breadcrumb.appendChild(li);
      });
      const anotherLi = document.createElement('li');
      anotherLi.appendChild(breadcrumb);
      fileListBreadcrumbArray.push(anotherLi);
    });
  fileListBreadcrumbArray.forEach((el) => {
    document.getElementById('work-fileList-parent').appendChild(el);
  });
}

async function modalInitialize(src, title, isImage = false) {
  document.getElementById('vidstack-target').innerHTML = '';
  if (document.getElementById('player-modal-body-image')) document.getElementById('player-modal-body-image').remove();
  const playerModal = new bootstrap.Modal(document.getElementById('player-modal'));
  playerModal.show();
  document.getElementById('player-modal-title').textContent = title;
  let player = null;
  document.getElementById('player-modal-download-btn').href = src;
  if (isImage === true) {
    document.getElementById('vidstack-target').classList.add('d-none');
    (() => {
      document.getElementById('player-modal-body-flex').classList.add('d-none');
      document.getElementById('player-modal-body-flex').classList.remove('d-flex');
    })();
    document
      .getElementById('player-modal-body')
      .insertAdjacentHTML(
        'beforeend',
        `<img class="" id="player-modal-body-image" class="my-4" style="max-width: 100%" src="${src}" />`,
      );
  } else {
    document.getElementById('vidstack-target').classList.remove('d-none');
    (() => {
      document.getElementById('player-modal-body-flex').classList.remove('d-none');
      document.getElementById('player-modal-body-flex').classList.add('d-flex');
    })();
    player = await VidstackPlayer.create({
      target: '#vidstack-target',
      title: title,
      src: src,
      layout: new VidstackPlayerLayout({}),
    });
  }
  document.getElementById('player-modal-close').addEventListener('click', async () => {
    await modalDestroy(playerModal, player, isImage);
  });
}

async function modalDestroy(modal, player = null, isImage = false) {
  const clonedCloseBtn = document.getElementById('player-modal-close').cloneNode(true);
  document.getElementById('player-modal-close').replaceWith(clonedCloseBtn);
  modal.hide();
  if (isImage === true) {
  } else {
    await player.destroy();
  }
}

function numberToRJIdString(id) {
  if (id < 1000000) {
    return 'RJ' + id;
  } else {
    return 'RJ0' + id;
  }
}

function optimizeWorkFolderStructureJson(data, pathString) {
  let downloadTrackListArray = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].type === 'folder' && data[i].children && data[i].children !== null) {
      downloadTrackListArray = downloadTrackListArray.concat(
        optimizeWorkFolderStructureJson(data[i].children || [], pathString + '/' + data[i].title),
      );
    } else {
      downloadTrackListArray.push({
        uuid: data[i].uuid,
        path: pathString + '/' + data[i].title,
        url: data[i].mediaDownloadUrl,
        hash: data[i].hash,
      });
    }
  }
  return downloadTrackListArray.map((itm) => ({
    uuid: itm.uuid,
    path: itm.path.replace(/^\/+/g, ''),
    url: itm.url,
    hash: itm.hash,
  }));
}

function getExtFromFilename(filename) {
  const ext = filename.split('.').slice(-1)[0];
  if (ext === filename) {
    return '';
  } else {
    return ext;
  }
}
