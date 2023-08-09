'use strict';

const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');
const analyticsData = google.analyticsdata('v1beta');

const propertyId = '261292185'

const scopes = [
  'https://www.googleapis.com/auth/analytics',
  'https://www.googleapis.com/auth/analytics.readonly',
];

/**
 * To use OAuth2 authentication, we need access to a CLIENT_ID, CLIENT_SECRET, AND REDIRECT_URI.  To get these credentials for your application, visit https://console.cloud.google.com/apis/credentials.
 */
const keyPath = path.join(__dirname, './../../', 'oauth-client-secret.json');
let keys = {redirect_uris: ['']};
if (fs.existsSync(keyPath)) {
  keys = require(keyPath).web;
}

const oauth2Client = new google.auth.OAuth2(
  keys.client_id,
  keys.client_secret,
  keys.redirect_uris[0]
);

google.options({auth: oauth2Client});

module.exports.getAuthorizeUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes.join(' '),
  });
} 

module.exports.attachCredentials = async (code) => {
  const { tokens } = await oauth2Client.getToken({ code });
  oauth2Client.credentials = tokens;
  return oauth2Client;
} 

// ? Docs: https://developers.google.com/analytics/devguides/reporting/data/v1
module.exports.getReport = async () => {
  // ? runReport docs: https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runReport
  const response = await analyticsData.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: {
      dateRanges: [
        {
          startDate: "2023-07-29",
          endDate: "2023-08-03",
        },
      ],
      dimensions: [
        {
          name: "city",
        },
      ],
      metrics: [
        {
          name: "activeUsers",
        },
      ],
    }
  });

  console.log('Report result:');
  response.data.rows.forEach(row => {
    console.log(row.dimensionValues[0], row.metricValues[0]);
  });
  return response?.data;
}
