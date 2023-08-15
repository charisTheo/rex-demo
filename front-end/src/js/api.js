function handleAuthorizationError() {
  if (window.confirm('Your authentication has expired. Press OK to reload the page and log in again.')) {
    location.href = '/'
  }
}

function showApiFetchError() {
  alert('There was an error with your request')
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

export const DIMENSION_NAMES_MAP = {
  'eventName': 'Metric',
  'browser': 'Browser',
  'deviceCategory': 'Device',
  'operatingSystem': 'OS',
}
export const METRICS_NAMES_MAP = {
  'eventValue': 'Value (ms)',
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
