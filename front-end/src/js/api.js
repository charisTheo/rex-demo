// TODO handle errors

/**
 * @return {String}
 */
export async function getGoogleAuthUrl() {
  const response = await fetch('/api/googleapis/oauth2Url');
  const { url } = await response.json();
  return url
}

/**
 * @return {Array<Object>}
 */
export async function fetchAnalyticsAccounts() {
  const response = await fetch('/api/googleapis/analytics/accounts');
  const {accounts} = await response.json();
  return accounts
}

/**
 * @param {String} propertyName 
 * @return {Object}
 */
export async function fetchAnalyticsReport(propertyName) {
  const response = await fetch(`/api/googleapis/analytics/report?propertyName=${propertyName}`);
  const {report} = await response.json();
  return report
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
  var { dimensionHeaders, metricHeaders, rows } = report;
  dimensionHeaders = dimensionHeaders.map(h => DIMENSION_NAMES_MAP[h.name] || h.name);
  metricHeaders = metricHeaders.map(h => METRICS_NAMES_MAP[h.name] || h.name);
  rows = rows.map(r => ({
    dimensionValues: r.dimensionValues.map(v => v.value),
    metricValues: r.metricValues.map(v => v.value),
  }));
  return { dimensionHeaders, metricHeaders, rows };
}
