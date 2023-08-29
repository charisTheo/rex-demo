export function showPageLoadingIndicator() {
  document
    .querySelector('#main > .loading-indicator')
    .removeAttribute('hidden');
}

export function hidePageLoadingIndicator() {
  document
    .querySelector('#main > .loading-indicator')
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

export function showSnackbar({ message, type = 'default', timeout = 6000 }) {
  const snackbar = document.querySelector('#snackbar');
  const snackbarMessage = snackbar.querySelector('#snackbar-message');

  switch (type) {
    case 'success':
      snackbar.classList.add('success')
      break;
    case 'error':
      snackbar.classList.add('error')
      break;
    default:
      if (type !== 'default') {
        console.warn(`Invalid snackbar type '${type}' - Must be one of 'success', 'error' or undefined`);
      }
      break;
  }

  snackbarMessage.textContent = message;
  snackbar.classList.remove('hide');

  setTimeout(hideSnackbar, timeout);
}

export function hideSnackbar() {
  const snackbar = document.querySelector('#snackbar');
  snackbar.classList.add('hide');
  snackbar.classList.remove('success', 'error');
}
