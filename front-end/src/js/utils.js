export function showPageLoadingIndicator() {
  document
    .querySelector('body > .loading-indicator')
    .removeAttribute('hidden');
}

export function hidePageLoadingIndicator() {
  document
    .querySelector('body > .loading-indicator')
    .setAttribute('hidden', 'true');
}

export function showReportLoadingIndicator() {
  document
    .querySelector('#report-wrapper > .loading-indicator')
    .removeAttribute('hidden');
}

export function hideReportLoadingIndicator() {
  document
    .querySelector('#report-wrapper > .loading-indicator')
    .setAttribute('hidden', 'true');
}