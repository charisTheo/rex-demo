import puppeteer, {PredefinedNetworkConditions} from 'puppeteer';
import log from '../utils/log.js';
const {randomUUID} = await import('node:crypto');

/**
 *
 * @param {*} config
 * @return {String|undefined}
 * Given a config file this function will perform a simple tracing based on the config
 */
async function tracing(config) {
  const {
    pageUrl,
    emulateCPUThrottling,
    slow3G,
    viewportConfig,
  } = (config || {});

  const traceFileName = `${randomUUID()}.json`;
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({headless: 'new'});
  const page = await browser.newPage();
  // Set screen size
  if (viewportConfig) {
    await page.setViewport(viewportConfig);
  }
  // Set network condition
  if (slow3G) {
    await page.emulateNetworkConditions(PredefinedNetworkConditions['Slow 3G']);
  }
  // set CPU condition
  if (emulateCPUThrottling) {
    await page.emulateCPUThrottling(4);
  }
  try {
    // Configure the navigation timeout
    await page.setDefaultNavigationTimeout(0);
    // start tracing
    await page.tracing.start({path: 'traces/' + traceFileName});
    // Navigate the page to a URL
    await page.goto('https://' + pageUrl);
    await page.tracing.stop();
    await browser.close();
    return traceFileName;
  } catch (error) {
    log(error);
    return undefined;
  }
}

/**
 *
 * @param {*} pageUrl
 * @param {Boolean} emulateCPUThrottling
 * @param {Boolean} slow3G
 * @param {Object} viewportConfig
 * Given a page Url this function will run tracing experience
 * then open the result in a tracing view
 */
async function replayExperience(pageUrl, emulateCPUThrottling, slow3G, viewportConfig) {
  const traceResultJson = await tracing({pageUrl, emulateCPUThrottling, slow3G, viewportConfig});
  return traceResultJson || null;
}

export {replayExperience};
