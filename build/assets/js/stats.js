import ky from 'https://cdn.jsdelivr.net/npm/ky@1.7.2/+esm';
import { DateTime } from 'https://cdn.jsdelivr.net/npm/luxon@3.5.0/+esm';
import * as fzstd from 'https://cdn.jsdelivr.net/npm/fzstd@0.1.1/+esm';
import * as chartJs from 'https://esm.sh/chart.js@4';
import * as chartJsHelpers from 'https://esm.sh/chart.js@4/helpers';
import * as chartJsMatrix from 'https://esm.sh/chartjs-chart-matrix@2';
// import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
import mathUtils from './utils/mathUtils.js';

const remoteLfsRepoRootArray = [
  'https://huggingface.co/datasets/DeliberatorArchiver/asmr-archive-data-01/resolve/main',
  'https://huggingface.co/datasets/DeliberatorArchiver/asmr-archive-data-02/resolve/main'
];
const remoteStatsMetaRepoRoot = 'https://huggingface.co/datasets/DeliberatorArchiver/asmr-archive-data-meta/resolve/main';
const remoteStatsMetaFileArray = [
  'stats_01.json.zst',
  'stats_02.json.zst',
]
let isDarkMode = null

function updateTheme() {
  isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-bs-theme', isDarkMode ? 'dark' : 'light');
}

// window.addEventListener('DOMContentLoaded',);
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTheme);

window.addEventListener('load', async () => {
  updateTheme();
  const fetchedStatsDatabases = [];
  for (const remoteStatsMetaFileName of remoteStatsMetaFileArray) {
    fetchedStatsDatabases.push(
      JSON.parse(
        new TextDecoder().decode(
          await fzstd.decompress(
            new Uint8Array(
              await ky(
                `${remoteStatsMetaRepoRoot}/${remoteStatsMetaFileName}`,
                {
                  method: 'get',
                  retry: 10,
                  timeout: 20000,
                },
              ).arrayBuffer()
            )
          )
        )
      )
    )
  };
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
  const loadedStatsDatabase = flatStatsDatabases(fetchedStatsDatabases)
  statsJsonToHtml(loadedStatsDatabase);
  await chartInitialize(loadedStatsDatabase);
  databaseToHtml(loadedDatabase);
});

function flatStatsDatabases(fetchedStatsDatabases) {
  const mergedRepoSize = {};
  fetchedStatsDatabases.forEach(data => {
    data.repoSize.forEach(item => {
      const ext = item.ext;
      if (!mergedRepoSize[ext]) {
        mergedRepoSize[ext] = {
          ext: ext,
          count: 0,
          size: 0,
          sizeEntry: []
        };
      }
      mergedRepoSize[ext].count += item.count;
      mergedRepoSize[ext].size += item.size;
      mergedRepoSize[ext].sizeEntry = mergedRepoSize[ext].sizeEntry.concat(item.sizeEntry);
    });
  });
  const result = {
    repoSize: Object.values(mergedRepoSize)
  };
  return result;
}

function statsJsonToHtml(database) {
  for (const extEntry of database.repoSize) {
    document.getElementById('stats-size-tbody').insertAdjacentHTML(
      'beforeend',
      `<tr>
      <td>${extEntry.ext}</td>
      <td class="text-end">${extEntry.count}</td>
      <td class="text-end">${extEntry.size}</td>
      <td class="text-end">${mathUtils.formatFileSizeFixedUnit(extEntry.size, 'GiB', 2)}</td>
      <td class="text-end">${mathUtils.formatFileSizeFixedUnit(extEntry.size / extEntry.count, 'MiB', 2)}</td>
      </tr>`
    )
  }
  document.getElementById('top-bigTotalSizeText').textContent = mathUtils.formatFileSizeFixedUnit(mathUtils.arrayTotal(database.repoSize.map(obj => obj.size)), 'GiB', 2);
  document.getElementById('stats-size-total-count').textContent = mathUtils.arrayTotal(database.repoSize.map(obj => obj.count));
  document.getElementById('stats-size-total-byte').textContent = mathUtils.arrayTotal(database.repoSize.map(obj => obj.size));
  document.getElementById('stats-size-total-fmt').textContent = mathUtils.formatFileSizeFixedUnit(mathUtils.arrayTotal(database.repoSize.map(obj => obj.size)), 'GiB', 2);
}

async function chartInitialize(database) {
  chartJs.Chart.register(...chartJs.registerables);
  chartJs.Chart.register(chartJsMatrix.MatrixController);
  chartJs.Chart.register(chartJsMatrix.MatrixElement);
  // chartJs.registry.controllers.items.matrix = chartJsMatrix.MatrixController;
  // chartJs.registry.elements.matrix = chartJsMatrix.MatrixElement;
  window.database = database;

  (() => {
    // ChartJSのデフォルトを設定
    chartJs.Chart.defaults.font = {
      ...chartJs.Chart.defaults.font,
      family: `Inter, 'Noto Sans JP', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif`,
      size: 12,
      lineHeight: 1.15
    };
    chartJs.Chart.defaults.plugins.title = {
      ...chartJs.Chart.defaults.plugins.title,
      display: true,
      text: '',
      font: { size: 16 }
    };
    chartJs.Chart.defaults.maintainAspectRatio = false;
    chartJs.Chart.defaults.responsive = true;
  })();

  const chartCanvas = new Object();

  const createChartCanvasFunc = ((uniqueId, type, title, data, customOptions = null) => {
    chartCanvas[uniqueId] = new chartJs.Chart(document.getElementById('chart-canvas-' + uniqueId), {
      type,
      data,
      options: customOptions ?? {
        plugins: {
          title: { text: title }
        }
      }
    });
  });

  createChartCanvasFunc(
    'fileCountPercentage',
    'pie',
    'File count percentage',
    {
      labels: database.repoSize.map(obj => obj.ext),
      datasets: [{
        data: database.repoSize.map(obj => obj.count),
      }]
    },
  );
  createChartCanvasFunc(
    'fileSizePercentage',
    'pie',
    'File size percentage',
    {
      labels: database.repoSize.map(obj => obj.ext),
      datasets: [{
        data: database.repoSize.map(obj => obj.size),
      }]
    },
  );

  (() => {
    const generateBinaryLogBins = (minSize, maxSize) => {
      const factors = [1, 2, 5]; // 2進接頭語における倍数
      const bins = [];
      // minSize を「きりの良い 1, 2, 5 の倍数」に調整（2進方式）
      let current = Math.pow(2, Math.floor(Math.log2(minSize))); // 対数スケールの最小値
      for (const factor of factors) {
        if (current * factor >= minSize) {
          current *= factor;
          break;
        }
      }
      // 最大サイズまで繰り返し
      while (current <= maxSize) {
        bins.push(current); // 現在の値を追加
        const nextStep = current * 2; // 次の範囲（2倍）
        for (const factor of factors) {
          const value = current * factor;
          if (value >= nextStep) break; // 次の桁を超えたら終了
          bins.push(value); // 補助的な値を追加
        }
        current = nextStep; // 次の範囲へ進む
      }
      // 重複を削除してソート
      const retArray = [...new Set(bins)].sort((a, b) => a - b);
      retArray.push(retArray.slice(-1)[0] * 2);
      return retArray;
    }
    const logScaleBaseGrid = generateBinaryLogBins(1, mathUtils.arrayMax(database.repoSize.map(obj => obj.sizeEntry).flat()));
    // console.log(logScaleBaseGrid);


    Plotly.newPlot(document.getElementById('chart-canvas-fileTypeSizeScatter'), [
      {
        x: logScaleBaseGrid.map(gridInt => `<= ${mathUtils.formatFileSize(gridInt, 0)}`),
        y: database.repoSize.map(obj => obj.ext),
        z: (() => {
          // 元データを対数変換
          const data = [];
          for (const dbEntry of database.repoSize) {
            const perFmtArray = logScaleBaseGrid.map((gridIntEntry) =>
              dbEntry.sizeEntry.filter(
                (el) => el <= gridIntEntry && Math.ceil(gridIntEntry / 2) < el
              ).length
            );
            data.push(perFmtArray.map((value) => (value > 0 ? Math.log10(value) : 0))); // 対数変換
          }
          return data;
        })(),
        customdata: (() => {
          const retArrayUnflat = [];
          for (const dbEntry of database.repoSize) {
            const perFmtArray = logScaleBaseGrid.map((gridIntEntry) => (
              dbEntry.sizeEntry.filter(el => (el <= gridIntEntry) && (Math.ceil(gridIntEntry / 2) < el)).length
            ));
            retArrayUnflat.push(perFmtArray);
          }
          return retArrayUnflat;
        })(),
        hovertemplate: 'File Type: %{y}<br>Size: %{x}<br>Count: %{customdata}<extra></extra>',
        type: 'heatmap',
        hoverongaps: false,
        showscale: false,
        colorscale: 'Greys'
      }
    ], {
      showlegend: false,
      margin: { pad: 0, l: 40, r: 30, t: 30, b: 90 },
      font: {
        family: `Inter, 'Noto Sans JP', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif`,
        color: isDarkMode ? '#fff' : '#000'
      },
      hoverlabel: {
        font: { family: `Inter, 'Noto Sans JP', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif`, },
      },
      title: {
        text: 'File size / type count heatmap (logarithmic)',
        font: { family: `Inter, 'Noto Sans JP', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif`, }
      },
      paper_bgcolor: '#ffffff00',
      plot_bgcolor: '#ffffff00',
    }, {
      responsive: true,
      scrollZoom: false,
      staticPlot: false,
      displayModeBar: false,
      displaylogo: false,
      responsive: true,
      editable: false
    });
  })();


  // フォントの遅延読み込み時にCanvasをUpdate
  document.fonts.onloadingdone = () => {
    chartCanvas.fileSizePercentage.update();
  };
}

function databaseToHtml(database) {
  const transformedMainDb = database.valueList.map(obj => transformDbEntry(database.keyList, obj));
  document.getElementById('stats-general-tbody').insertAdjacentHTML(
    'beforeend',
    `<tr><th>Updated at</th><td class="font-monospace">${DateTime.fromSeconds(database.generatedAt).toISO()}</td></tr>
    <tr><th>Work count</th><td class="text-end font-monospace">${transformedMainDb.length}</td></tr>`
  );
}

function numberToRJIdString(id) {
  if (id < 1000000) {
    return 'RJ' + id;
  } else {
    return 'RJ0' + id;
  }
}

function optimizeWorkFolderStructureJson(
  data,
  pathString,
) {
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
  return downloadTrackListArray.map(itm => ({
    uuid: itm.uuid,
    path: itm.path.replace(/^\/+/g, ''),
    url: itm.url,
    hash: itm.hash
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

function transformDbEntry(keyList, valueList) {
  return keyList.reduce((obj, key, index) => {
    obj[key] = valueList[index];
    return obj;
  }, {});
}
