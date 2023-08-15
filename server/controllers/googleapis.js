import {google} from 'googleapis';
import keys from './oauth-client-secret.json' assert { type: 'json' };
import {getReportDateFilterString} from '../utils/date.js';

const analyticsData = google.analyticsdata('v1beta');
const analyticsAdmin = google.analyticsadmin('v1beta');

const scopes = [
  'https://www.googleapis.com/auth/analytics',
  'https://www.googleapis.com/auth/analytics.readonly',
];

// google.options({auth: oauth2Client});

/**
 * @return {String}
 */
export function getAuthorizeUrl() {
  const oauthClient = new google.auth.OAuth2(
      keys.web.client_id,
      keys.web.client_secret,
      keys.web.redirect_uris[0],
  );

  return oauthClient.generateAuthUrl({
    access_type: 'offline',
    scope: scopes.join(' '),
  });
}

/**
 * @param {String} code
 * @return {String} Google APIs access token
 */
export async function getAccessTokenFromCode(code) {
  const oauthClient = new google.auth.OAuth2(
      keys.web.client_id,
      keys.web.client_secret,
      keys.web.redirect_uris[0],
  );

  const {tokens} = await oauthClient.getToken({code});
  return tokens.access_token;
}

/**
 * ? Docs: https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1alpha/properties/list
 * @param {String} accessToken
 * @return {[google.Row]}
 */
export async function getAccounts(accessToken) {
  const accountsListResponse = await analyticsAdmin.accounts.list({access_token: accessToken});
  if (accountsListResponse?.data?.accounts?.length) {
    const {accounts} = accountsListResponse.data;
    // get all properties for all accounts
    const accountsWithPropertiesPromises = accounts.map(async (a) => {
      const propertiesListResponse = await analyticsAdmin.properties.list({
        access_token: accessToken,
        showDeleted: false,
        filter: `parent:${a.name}`,
      });
      a.properties = propertiesListResponse?.data?.properties;
      return a;
    });
    return await Promise.all(accountsWithPropertiesPromises);
  }
  return null;
}

/**
 * ? Docs: https://developers.google.com/analytics/devguides/reporting/data/v1
 * TODO Check if desired custom dimensions exist with getMetadata: https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/getMetadata
 *
 * @param {String} accessToken
 * @param {String} propertyName
 * @return {[google.Row]}
 */
export async function getReport(accessToken, propertyName) {
  // filter for last 28 days
  const date = new Date();
  const endDate = getReportDateFilterString(date);
  date.setDate(date.getDate() - 28);
  const startDate = getReportDateFilterString(date);

  // ? runReport docs: https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runReport
  const response = await analyticsData.properties.runReport({
    access_token: accessToken,
    property: propertyName,
    requestBody: {
      dateRanges: [{startDate, endDate}],
      // Docs: https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema#dimensions
      // other helpful dimensions: deviceModel, mobileDeviceModel
      dimensions: [
        {name: 'eventName'},
        {
          name: 'URL',
          dimensionExpression: {
            concatenate: {
              dimensionNames: ['hostname', 'pagePath'],
              delimiter: ' ',
            },
          },
        },
        {name: 'operatingSystem'},
        {name: 'browser'},
        {name: 'deviceCategory'},
        {name: 'screenResolution'},
        // TODO {name: 'customEvent:debug_target'},
      ],
      // Docs: https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema#metrics
      metrics: [
        {name: 'eventValue'},
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            matchType: 'EXACT',
            value: 'INP',
            caseSensitive: false,
          },
        },
      },
    },
  });

  if (response?.data?.rows) {
    // remove empty space delimiter added for 'hostname' and 'pagePath' dimensions
    response.data.rows = response.data.rows.map((r) => ({
      ...r,
      dimensionValues: r.dimensionValues.map((d) => ({
        ...d,
        value: d.value.split(' ').join(''),
      })),
    }));
  }
  return response?.data;
}
