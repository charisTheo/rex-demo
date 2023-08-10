import {google} from 'googleapis';
import keys from './oauth-client-secret.json' assert { type: 'json' };

const analyticsData = google.analyticsdata('v1beta');

// https://www.drivingcost.eu/
const propertyId = '401545965';

const scopes = [
  'https://www.googleapis.com/auth/analytics',
  'https://www.googleapis.com/auth/analytics.readonly',
];

const oauth2Client = new google.auth.OAuth2(
    keys.web.client_id,
    keys.web.client_secret,
    keys.web.redirect_uris[0],
);

google.options({auth: oauth2Client});

/**
 * @return {String}
 */
export function getAuthorizeUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes.join(' '),
  });
}

/**
 * @param {String} code
 * @return {google.auth.OAuth2}
 */
export async function attachCredentials(code) {
  const {tokens} = await oauth2Client.getToken({code});
  oauth2Client.credentials = tokens;
  return oauth2Client;
}

/**
 * ? Docs: https://developers.google.com/analytics/devguides/reporting/data/v1
 * @param {*} oauth2Client
 * @return {[Row]}
 */
export async function getReport(oauth2Client) {
  // ? runReport docs: https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runReport
  const response = await analyticsData.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [
        {
          startDate: '2023-07-29',
          endDate: '2023-08-03',
        },
      ],
      dimensions: [
        {
          name: 'city',
        },
      ],
      metrics: [
        {
          name: 'activeUsers',
        },
      ],
    },
  });

  console.log('Report result:');
  response.data.rows.forEach((row) => {
    console.log(row.dimensionValues[0], row.metricValues[0]);
  });
  return response?.data;
}
