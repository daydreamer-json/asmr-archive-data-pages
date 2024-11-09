import ky from 'https://cdn.jsdelivr.net/npm/ky@1.7.2/+esm'

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
  const loadedDatabase = await ky(
    './database.json',
    {
      method: 'get',
      retry: 10,
      timeout: 20000,
    },
  ).json();
  document.getElementById('loadingSpinner-databaseLoad-label').textContent = 'Building table ...';
  databaseToHtml(loadedDatabase);
  document.getElementById('loadingSpinner-databaseLoad').classList.remove('d-flex');
  document.getElementById('loadingSpinner-databaseLoad').classList.add('d-none');
  DataTable.ext.type.order['numeric-rjid-pre'] = ((data) => rjIdStringToNumber(data));
  const createLazyObserver = () => {
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
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
    lazyImages.forEach(img => lazyObserver.observe(img));
  };
  const dataTable = new DataTable('#work-list-root', {
    columnDefs: [
      {
        targets: 2,
        type: 'numeric-rjid',
        render: ((data, type, row) => {
          return numberToRJIdString(parseInt(data));
        })
      },
      {
        targets: 3,
        orderable: false,
        searchable: false,
        render: ((data, type, row) => {
          return `<img class="lazy-thumbnail work-list-coverImage-img" data-src="${remoteLfsRepoRoot}/output/${data.split('_')[0]}/${numberToRJIdString(parseInt(data.split('_')[1]))}/cover_small.jpg" src="./assets/img/cover_main_dummy/small/purple_tr.webp" width="128" height="96">`
        })
      },
    ],
    scrollX: true
  });
  lazyLoadImages();
  dataTable.on('draw', () => {
    lazyLoadImages();
    // dataTable.columns.adjust();
  });
  // dataTable.columns.adjust();
});

function databaseToHtml(database) {
  for (const entryObj of database.valueList) {
    const transformedEntry = transformDbEntry(database.keyList, entryObj);
    const tr = document.createElement('tr');

    let tdIndex = 0;
    Object.entries(transformedEntry).forEach(([key, value]) => {
      if (tdIndex === 3) {
        (() => {
          // thumbnail td add
          const td = document.createElement('td');
          td.textContent = `${transformedEntry.create_date}_${transformedEntry.id}`;
          td.classList.add('text-nowrap');
          // td.classList.add('text-center');
          tr.appendChild(td);
        })();
      }
      const td = document.createElement('td');
      if (key === 'id') {
        td.textContent = value;
      } else if (key === 'title') {
        const aEl = document.createElement('a');
        aEl.setAttribute('href', `./works/${transformedEntry.create_date}/${numberToRJIdString(transformedEntry.id)}`);
        aEl.textContent = transformedEntry.title;
        td.appendChild(aEl);
      } else {
        td.textContent = value;
      };
      if (key === 'title') {
        td.classList.add('text-break');
      } else {
        td.classList.add('text-nowrap');
      };
      if (key === 'create_date' || key === 'release' || key === 'id') {
        td.classList.add('font-monospace');
      }
      tr.appendChild(td);
      tdIndex++;
    });
    document.getElementById('work-list-tbody').appendChild(tr);
  }
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
