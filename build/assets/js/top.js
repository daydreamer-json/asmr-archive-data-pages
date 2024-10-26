const remoteLfsRepoRoot = 'https://huggingface.co/datasets/DeliberatorArchiver/asmr-archive-data/resolve/main';

function updateTheme() {
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-bs-theme', isDarkMode ? 'dark' : 'light');
}

window.addEventListener('DOMContentLoaded', updateTheme);
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTheme);

window.addEventListener('load', () => {
  databaseToHtml();
});

function databaseToHtml() {
  for (const entryObj of database) {
    const tr = document.createElement('tr');
    Object.entries(entryObj).forEach(([key, value]) => {
      const td = document.createElement('td');
      if (key === 'id') {
        td.textContent = numberToRJIdString(value);
      } else if (key === 'title') {
        const aEl = document.createElement('a');
        aEl.setAttribute('href', `./works/${entryObj.create_date}/${numberToRJIdString(entryObj.id)}.html`);
        aEl.textContent = entryObj.title;
        td.appendChild(aEl);
      } else {
        td.textContent = value;
      };
      if (key !== 'title') {
        td.classList.add('text-nowrap');
      };
      tr.appendChild(td);
    });
    document.getElementById('work-list-tbody').appendChild(tr);
  }
}

function numberToRJIdString(id) {
  if (id < 1000000) {
    return 'RJ' + id;
  } else {
    return 'RJ0' + id;
  }
}
