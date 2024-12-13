import ky from 'https://cdn.jsdelivr.net/npm/ky@1.7.2/+esm';
import { DateTime } from 'https://cdn.jsdelivr.net/npm/luxon@3.5.0/+esm';
import * as fzstd from 'https://cdn.jsdelivr.net/npm/fzstd@0.1.1/+esm';

const remoteLfsRepoRoot = 'https://huggingface.co/datasets/DeliberatorArchiver/asmr-archive-data/resolve/main';

function updateTheme() {
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-bs-theme', isDarkMode ? 'dark' : 'light');
}

// window.addEventListener('DOMContentLoaded', );
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTheme);

window.addEventListener('load', async () => {
  updateTheme();
  document.getElementById('loadingSpinner-databaseLoad').classList.remove('d-none');
  document.getElementById('loadingSpinner-databaseLoad').classList.add('d-flex');
  document.getElementById('loadingSpinner-databaseLoad-label').textContent = 'Downloading database ...';
  console.debug('Downloading and decompressing database ...');
  const loadedDatabase = JSON.parse(
    new TextDecoder().decode(
      await fzstd.decompress(
        new Uint8Array(
          await ky('./database.json.zst', {
            method: 'get',
            retry: 10,
            timeout: 20000,
          }).arrayBuffer(),
        ),
      ),
    ),
  );
  document.getElementById('loadingSpinner-databaseLoad-label').textContent = 'Building table ...';
  // databaseToHtml(loadedDatabase);
  document.getElementById('loadingSpinner-databaseLoad').classList.remove('d-flex');
  document.getElementById('loadingSpinner-databaseLoad').classList.add('d-none');
  initializeTable(loadedDatabase);
  document.getElementById('header-updatedAt-text').textContent = DateTime.fromSeconds(
    loadedDatabase.generatedAt,
  ).toISO();
  console.debug('All completed');
  document.getElementById('work-list-rootWrap').classList.remove('invisible');
});

function initializeTable(database) {
  const transformedDb = database.valueList.map((obj) => transformDbEntry(database.keyList, obj));
  DataTable.ext.type.order['numeric-rjid-pre'] = (data) => rjIdStringToNumber(data);
  const createLazyObserver = () => {
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.removeAttribute('width');
          img.removeAttribute('height');
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    });
    return observer;
  };
  const lazyLoadImages = () => {
    const lazyObserver = createLazyObserver();
    const lazyImages = document.querySelectorAll('.lazy-thumbnail[data-src]');
    lazyImages.forEach((img) => lazyObserver.observe(img));
  };
  const dataTable = new DataTable('#work-list-root', {
    data: transformedDb,
    columns: [
      { data: 'create_date' },
      { data: 'release' },
      {
        data: 'id',
        type: 'numeric-rjid',
        render: (data, type, row) => numberToRJIdString(parseInt(data)),
      },
      {
        data: 'id',
        orderable: false,
        searchable: false,
        render: (data, type, row) => {
          return `<img class="lazy-thumbnail work-list-coverImage-img" data-src="${remoteLfsRepoRoot}/output/${row.create_date}/${numberToRJIdString(data)}/cover_small.jpg" src="./assets/img/cover_main_dummy/small/purple_tr.webp" width="128" height="96">`;
        },
      },
      {
        data: 'title',
        render: (data, type, row) => {
          return `<a href="./work?create_date=${row.create_date}&id=${row.id}">${data}</a>`;
        },
      },
    ],
    createdRow: (row, data) => {
      row.cells[0].classList.add('text-nowrap');
      row.cells[1].classList.add('text-nowrap');
      row.cells[2].classList.add('text-nowrap');
      row.cells[3].classList.add('text-nowrap');
      row.cells[4].classList.add('text-break');
      row.cells[0].classList.add('font-monospace');
      row.cells[1].classList.add('font-monospace');
      row.cells[2].classList.add('font-monospace');
    },
    layout: {
      topStart: {
        pageLength: {
          menu: [5, 10, 25, 50, 100, 200, 500, 1000],
        },
      },
    },
    scrollX: true,
  });
  lazyLoadImages();
  dataTable.on('draw', () => {
    lazyLoadImages();
    // dataTable.columns.adjust();
  });
  // dataTable.columns.adjust();
}

function numberToRJIdString(id) {
  const prefix = id < 1000000 ? 'RJ' : 'RJ0';
  return `${prefix}${id}`;
}

function rjIdStringToNumber(rjId) {
  const prefixLength = rjId.startsWith('RJ0') ? 3 : 2;
  if (!rjId.startsWith('RJ')) {
    throw new Error('Invalid RJ ID format');
  }
  return parseInt(rjId.slice(prefixLength), 10);
}

function transformDbEntry(keyList, valueList) {
  return keyList.reduce((obj, key, index) => {
    obj[key] = valueList[index];
    return obj;
  }, {});
}
