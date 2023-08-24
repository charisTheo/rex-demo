/* eslint-disable no-undef */
import '../css/global.css';
import '../css/theme.css';
import '@material/web/button/filled-tonal-button';
import '@material/web/button/filled-button';
import '@material/web/button/text-button';
import '@material/web/icon/icon';
import '@material/web/list/list';
import '@material/web/list/list-item';
import '@material/web/textfield/filled-text-field.js';
import '@material/web/progress/circular-progress';
import '@material/web/dialog/dialog';
import {
  hidePageLoadingIndicator,
  hideReportLoadingIndicator,
  hideSnackbar,
  showPageLoadingIndicator,
  showReportLoadingIndicator,
  showSnackbar
} from './utils';
import {
  getGoogleAuthUrl,
  fetchAnalyticsAccounts,
  fetchAnalyticsReport,
  formatRawReportObject,
  getTraceFromReplay
} from './api';
import Viewer from './devtools/timeline_viewer';
let viewer;

document.addEventListener('DOMContentLoaded', async () => {
  window.showSnackbar = showSnackbar;
  window.hideSnackbar = hideSnackbar;
  
  if (window.location.search.indexOf('auth=1') >= 0) {
    initDevTools()

    document
      .querySelector('#replay-options-form')
      .addEventListener('submit', onOptionsDialogSubmit);
    document
      .querySelector('#google-analytics-wrapper')
      .removeAttribute('hidden');

    const accounts = await fetchAnalyticsAccounts();
    renderAnalyticsAccounts(accounts);
    await new Promise(resolve => setTimeout(resolve, 0));
    renderAnalyticsProperties(accounts);
  } else {
    document.querySelector('#login-with-google-button-wrapper').removeAttribute('hidden');
    const loginWithGoogleButton = document.querySelector('#login-with-google-button');
    loginWithGoogleButton.addEventListener('click', async () => {
      showPageLoadingIndicator();
      const url = await getGoogleAuthUrl();
      location.href = url;
    });
  }
});

function renderAnalyticsAccounts(accounts) {
  const accountsListEl = document.querySelector('#accounts-list');

  if (!accounts?.length) {
    accountsListEl.innerHTML += `
      <md-list-item
        headline="No Analytics Accounts were found for this Google Account."
        supportingText="Make sure you are logged in with your correct Google Account."
      ></md-list-item>
    `
  } else {
    // render accounts list
    accountsListEl.innerHTML += `
      ${accounts.map(a => `
        <md-list-item data-account="${a.name}" headline="${a.displayName}" supportingText="${a.name}">
          <md-icon data-variant="icon" slot="end">chevron_right</md-icon>
        </md-list-item>
      `).join('')}
    `;
  
    // Add click event listeners to account list items
    accountsListEl
      .querySelectorAll('md-list-item')
      .forEach((li) => li.addEventListener('click', toggleSelected));
  }

  // Remove accounts loading indicator
  document
    .querySelector('#google-analytics-lists .loading-indicator')
    .remove();

  // Show accounts list
  accountsListEl.removeAttribute('hidden');
}

function renderAnalyticsProperties(accounts) {
  if (!accounts?.length) {
    return;
  }
  const propertiesListEl = document.querySelector('#properties-list');
  accounts.forEach(({properties, name: accountName}) => {
    // properties for each account are hidden by default
    // will be shown on account click event listener `toggleSelected`
    propertiesListEl.innerHTML += `
      ${properties.map(p => `
        <md-list-item 
          hidden 
          data-account="${accountName}" 
          data-property="${p.name}" 
          headline="${p.displayName}" 
          supportingText="${p.name}"
        >
          <md-icon data-variant="icon" slot="end">folder_open</md-icon>
        </md-list-item>
      `).join('')}
    `;
  });

  // Add click event listeners to account list items
  propertiesListEl
    .querySelectorAll('md-list-item')
    .forEach((li) => li.addEventListener('click', handlePropertyListItemClick));

}

async function toggleSelected(e) {
  const el = e.target;
  const propertiesListEl = document.querySelector('#properties-list');

  if (el.getAttribute('selected')) {
    el.removeAttribute('selected');
    propertiesListEl.setAttribute('hidden', 'true');
  } else {
    // remove attribute from previously selected element if there is any
    const parentEl = el.parentElement;
    parentEl.querySelector(`${el.nodeName}[selected]`)?.removeAttribute('selected');

    el.setAttribute('selected', 'true');

    await new Promise(resolve => setTimeout(resolve, 0));
    // show all property list items for selected account
    const propertiesListItemsEl = propertiesListEl.querySelectorAll('md-list-item');
    propertiesListItemsEl.forEach(listItem => {
      if (listItem.dataset.account === el.dataset.account) {
        listItem.removeAttribute('hidden');
      } else {
        listItem.setAttribute('hidden', 'true');
      }
    });
    propertiesListEl.removeAttribute('hidden');
  }
}

async function handlePropertyListItemClick(e) {
  showReportLoadingIndicator();
  const propertyListItemEl = e.target;
  const propertyName = propertyListItemEl.dataset.property;
  const rawReport = await fetchAnalyticsReport(propertyName);
  const report = formatRawReportObject(rawReport)
  await renderReport(report);
  hideReportLoadingIndicator();
}

async function renderReport(report) {
  const reportTableEl = document.querySelector('#report-table');

  if (!report) {
    reportTableEl.innerHTML = `
      <tr style="text-align:center">
        <td><h3>No results were found :/</h3></td>
      </tr>
    `
    reportTableEl.removeAttribute('hidden');
    return;
  }

  const { dimensionHeaders, metricHeaders, rows } = report;
  reportTableEl.innerHTML = ''

  const tableHeaders = `
    <thead>
      <tr>
        ${
          [...dimensionHeaders, ...metricHeaders]
            .map(h => `<th>${h}</th>`)
            .join('')
        }
        <th></th>
      </tr>
    </thead>
  `;

  const tableRows = `
    <tbody>
      ${rows.map((r, i) => `
        <tr data-index="${i}">
          ${
            [...r.dimensionValues, ...r.metricValues]
              .map(v => `<td>${v}</td>`)
              .join('')
          }
          <td><md-icon color="primary">replay</md-icon></td>
        </tr>
      `).join('')}
    </tbody>
  `;

  await new Promise(resolve => setTimeout(resolve, 0));
  
  reportTableEl.innerHTML += tableHeaders;
  reportTableEl.innerHTML += tableRows;
  
  // Add click event listeners on table rows
  reportTableEl
    .querySelectorAll('tbody > tr')
    .forEach(r => r.addEventListener('click', (e) => handleRowClick(e, rows)));

  // Show report table
  reportTableEl.removeAttribute('hidden');
}

async function handleRowClick(e, rows) {
  const rowEl = e.target.parentElement;
  const rowIndex = parseInt(rowEl.dataset.index, 10);
  const row = rows[rowIndex];
  
  if (row) {
    const [
      url,
      deviceCategory,
      screenResolution,
      deviceModel,
      debugTarget,
      debugType,
      debugCoordinates,
    ] = row.dimensionValues;
    const fieldsArr = [
      {name: 'url', value: url, label: 'URL', type: 'url', hidden: true},
      {name: 'deviceCategory', value: deviceCategory, label: 'Device category', type: 'text', hidden: false},
      {name: 'screenResolution', value: screenResolution, label: 'Screen Resolution', type: 'text', hidden: false},
      {name: 'deviceModel', value: deviceModel, label: 'Device Model', type: 'text', hidden: false},
      {name: 'debugType', value: debugType, label: 'Event type', type: 'text', hidden: false},
      {name: 'debugTarget', value: debugTarget, label: 'Event target', type: 'text', hidden: false},
      {name: 'debugCoordinates', value: debugCoordinates, label: 'Event coordinates', type: 'text', hidden: false},
    ];

    // open modal with options configuration: https://material-web.dev/components/dialog/
    const optionsDialog = document.querySelector('#replay-options-dialog');
    
    // Create input fields and pass default configuration to dialog
    optionsDialog.querySelector('form').innerHTML = fieldsArr.map(
      ({name, value, label, type, hidden}) => `
        <md-filled-text-field
          value='${value}'
          label='${label}'
          type='${type}'
          name='${name}'
          ${hidden ? 'style="display: none" aria-hidden="true"' : ''}
        ></md-filled-text-field>
      `).join("");

    optionsDialog.open = true;
  }
}

async function onOptionsDialogSubmit(e) {
  if (e.submitter?.dataset?.action === 'cancel') {
    return;
  }

  showPageLoadingIndicator();

  try {
    // get options from form values
    const url = e.target.elements['url'].value;
    const deviceCategory = e.target.elements['deviceCategory'].value;
    const screenResolution = e.target.elements['screenResolution'].value;
    const deviceModel = e.target.elements['deviceModel'].value;
    const debugTarget = e.target.elements['debugTarget'].value;
    const debugType = e.target.elements['debugType'].value;
    const debugCoordinates = e.target.elements['debugCoordinates'].value;

    const traceFilename = await getTraceFromReplay({
      url,
      deviceCategory,
      screenResolution,
      deviceModel,
      debugTarget,
      debugType,
      debugCoordinates,
    });

    if (traceFilename) {
      // This will reload the page and Devtools will load trace from file automatically
      showPerfDevTools(traceFilename);
    } else {
      throw new Error('No trace filename was returned from the API');
    }
  } catch (err) {
    showSnackbar({
      message: 'There was an error while replaying this experience :/',
      type: 'error'
    });
  }

  hidePageLoadingIndicator();
}

async function initDevTools() {
  if (typeof Runtime === 'undefined' ) {
    return setTimeout(initDevTools, 200);
  }
  if (!viewer) {
    viewer = new Viewer();
    const parsedURL = new URL(location.href);
    if (!parsedURL.searchParams.get('loadTimelineFromURL')) {
      // hide devtools
      setTimeout(() => viewer.makeDevToolsVisible(false), 1000);
    } else {
      await Runtime.startApplication('timelineviewer_app');
      viewer.makeDevToolsVisible(true);
    }
  }
}

/**
 * ? Source: https://github.com/ChromeDevTools/timeline-viewer/blob/68e858d2131f5e76a6670a8b48a5730bcfe140ba/docs/
 * Reloads the page with a `loadTimelineFromURL` URL parameter
 * which Devtools uses to load the trace from file during page load
 * @param {String} traceFilename 
 */
async function showPerfDevTools(traceFilename) {
  const url = `/trace/${traceFilename}`;
  const parsedURL = new URL(location.href);
  parsedURL.searchParams.delete('loadTimelineFromURL');
  // this is weird because we don't want url encoding of the URL
  parsedURL.searchParams.append('loadTimelineFromURL', 'REPLACEME');
  location.href = parsedURL.toString().replace('REPLACEME', url);
}
