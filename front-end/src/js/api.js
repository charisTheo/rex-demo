import { showSnackbar } from "./utils";

function handleAuthorizationError() {
  if (window.confirm('Your authentication has expired. Press OK to reload the page and log in again.')) {
    location.href = '/'
  }
}

function showApiFetchError() {
  showSnackbar({ message: 'There was an error with your request', type: 'error' });
}

/**
 * @return {String}
 */
export async function getGoogleAuthUrl() {
  try {
    const response = await fetch('/api/googleapis/oauth2Url');
    if (response.status === 401) {
      return handleAuthorizationError();
    }
    const { url } = await response.json();
    return url
  } catch (err) {
    console.log('👨‍💻 | getGoogleAuthUrl | err:', err);
    showApiFetchError()
    return location.href
  }
}

/**
 * @return {Array<Object>}
 */
export async function fetchAnalyticsAccounts() {
  try {
    const response = await fetch('/api/googleapis/analytics/accounts');
    if (response.status === 401) {
      return handleAuthorizationError();
    }
    const {accounts} = await response.json();
    return accounts
  } catch (err) {
    console.log('👨‍💻 | fetchAnalyticsAccounts | err:', err);
    showApiFetchError()
    return []
  }
}

/**
 * @param {String} propertyName 
 * @return {Object}
 */
export async function fetchAnalyticsReport(propertyName) {
  try {
    const response = await fetch(`/api/googleapis/analytics/report?propertyName=${propertyName}`);
    if (response.status === 401) {
      return handleAuthorizationError();
    }
    const {report} = await response.json();
    return report
  } catch (err) {
    console.log('👨‍💻 | fetchAnalyticsReport | err:', err);
    showApiFetchError()
    return null
  }
}

/**
 * @typedef {Viewport}
 * @property {Number} width
 * @property {Number} height
 */

/**
 * @param {String} screenResolution i.e. 1000x1800
 * @return {(Viewport|undefined)}
 */
function buildViewportObject(screenResolution = '') {
  const dimensions = screenResolution.split('x');
  const width = parseInt(dimensions?.[0], 10);
  const height = parseInt(dimensions?.[1], 10);

  if (Number.isNaN(width) || Number.isNaN(height)) {
    return undefined
  }
  return { width, height }
}

/**
 * @typedef {TraceOptions}
 * @property {String} url
 * @property {String} debugType
 * @property {String} debugTarget
 * @property {String} deviceCategory
 * @property {String} screenResolution
 * @property {String} deviceModel
 * @property {Boolean} slow3G
 * @property {Boolean} emulateCPUThrottling
 */

/**
 * @param {TraceOptions} options
 * @return {(String|null)} trace filename
 */
export async function getTraceFromReplay(options) {
  const {
    url,
    debugType,
    debugTarget,
    deviceCategory,
    screenResolution,
    deviceModel,
    slow3G,
    emulateCPUThrottling,
  } = (options || {})

  const body = JSON.stringify({
    url,
    debugType,
    debugTarget,
    deviceCategory,
    viewport: buildViewportObject(screenResolution),
    deviceModel,
    slow3G,
    emulateCPUThrottling,
  });

  try {
    const response = await fetch(`/api/replay/`, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' }
    });
    if (response.status === 401) {
      return handleAuthorizationError();
    }
    if (response.status === 200) {
      const traceFilename = await response.text();
      return traceFilename
    } else {
      throw new Error(await response.text())
    }
  } catch (err) {
    console.log('👨‍💻 | getTraceFromReplay | err:', err);
    showApiFetchError()
    return null
  }
}

export const DIMENSION_NAMES_MAP = {
  'eventName': 'Metric',
  'screenResolution': 'Screen resolution',
  'deviceCategory': 'Device type',
  'mobileDeviceModel': 'Device model',
  'customEvent:debug_target': 'Target element',
  'customEvent:debug_type': 'User input type',
  'customEvent:debug_time': 'User input timing'
}
export const METRICS_NAMES_MAP = {
  'eventValue': 'INP (ms)',
}

export function formatRawReportObject(report) {
  var { dimensionHeaders, metricHeaders, rows } = (report || {});
  if ((!dimensionHeaders?.length && !metricHeaders?.length) || !rows?.length) {
    return null
  }
  dimensionHeaders = dimensionHeaders.map(h => DIMENSION_NAMES_MAP[h.name] || h.name);
  metricHeaders = metricHeaders.map(h => METRICS_NAMES_MAP[h.name] || h.name);
  rows = rows.map(r => ({
    dimensionValues: r.dimensionValues.map(v => v.value),
    metricValues: r.metricValues.map(v => v.value),
  }));
  return { dimensionHeaders, metricHeaders, rows };
}
