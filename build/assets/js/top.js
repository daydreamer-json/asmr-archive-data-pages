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
  const dataTable = new DataTable('#work-list-root', {
    columnDefs: [
      {
        targets: 2,
        type: 'numeric-rjid',
        render: ((data, type, row) => {
          return numberToRJIdString(parseInt(data));
        })
      }
    ]
  });
});

function databaseToHtml(database) {
  for (const entryObj of database) {
    const tr = document.createElement('tr');
    Object.entries(entryObj).forEach(([key, value]) => {
      const td = document.createElement('td');
      if (key === 'id') {
        td.textContent = value;
      } else if (key === 'title') {
        const aEl = document.createElement('a');
        aEl.setAttribute('href', `./works/${entryObj.create_date}/${numberToRJIdString(entryObj.id)}`);
        aEl.textContent = entryObj.title;
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
