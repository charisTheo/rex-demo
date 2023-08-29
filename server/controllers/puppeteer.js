import puppeteer, {PredefinedNetworkConditions, KnownDevices} from 'puppeteer';
import log from '../utils/log.js';
const {randomUUID} = await import('node:crypto');
import loaf from './loaf.js';
/**
 * @typedef {ViewportConfig}
 * @property {Number} width
 * @property {Number} height
 */

/**
 *
 * @param {*} config
 * @property {URL} pageUrl
 * @property {Boolean} emulateCPUThrottling
 * @property {Boolean} slow3G
 * @property {ViewportConfig} viewportConfig
 * @property {String} debugType
 * @property {String} debugTarget
 * @property {String} deviceCategory
 * @property {String} deviceModel
 * @return {String|undefined}
 * Given a config file this function will perform a simple tracing based on the config
 */
async function tracing(config) {
  const {
    pageUrl,
    emulateCPUThrottling,
    slow3G,
    viewportConfig,
    debugType,
    debugTarget,
    deviceCategory,
    deviceModel,
  } = (config || {});

  const traceFileName = `${randomUUID()}.json`;
  // Launch the browser and open a new blank page on chrome beta with loaf Enabled
  const browser = await puppeteer.launch({headless: 'new',
    channel: 'chrome-beta',
    args: ['--enable-features=LongAnimationFrameTiming'],
  });
  const page = await browser.newPage();
  //  enabling loaf on devtool
  await page.evaluateOnNewDocument(loaf);
  // set up the device config
  if (deviceCategory === 'mobile' || deviceCategory === 'tablet') {
    // identify the device model and then setup the emulation
    const _devicemodel = KnownDevices[deviceModel];
    if (_devicemodel) {
      await page.emulate(_devicemodel);
    }
  }
  // Set screen size viewport for all devices
  if (viewportConfig) {
    await page.setViewport(viewportConfig);
  }
  // Set network condition
  if (slow3G) {
    await page.emulateNetworkConditions(PredefinedNetworkConditions['Slow 3G']);
  }
  // set CPU condition
  if (emulateCPUThrottling) {
    await page.emulateCPUThrottling(6);
  }
  try {
    // Configure the navigation timeout
    await page.setDefaultNavigationTimeout(0);
    // start tracing
    await page.tracing.start({path: 'traces/' + traceFileName});
    // Navigate the page to a URL
    await page.goto('https://' + pageUrl);
    // target search
    const htmlElement = await page.$(debugTarget);
    switch (debugType) {
      case 'keydown': {
        if (htmlElement) {
          await htmlElement.type('Hello World', {delay: 100});
          await page.keyboard.type('Enter');
          await new Promise((r) => setTimeout(r, 200));
        }
        break;
      }
      case 'pointerdown':
      case 'click': {
        // find the selector element
        // perform a click and then await the time of a minimum INP threshold which is 200ms
        if (htmlElement) {
          await page.click(debugTarget);
        }
        break;
      }
    }

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
 * @param {*} emulateCPUThrottling
 * @param {*} slow3G
 * @param {*} viewportConfig
 * @param {*} debugType
 * @param {*} debugTarget
 * @param {*} deviceCategory
 * @param {*} deviceModel
 * @return {String|undefined}
 * Given a page Url this function will run tracing experience
 * then open the result in a tracing view
 */
async function replayExperience(pageUrl, emulateCPUThrottling, slow3G, viewportConfig, debugType, debugTarget, deviceCategory, deviceModel) {
  const traceResultJson = await tracing({pageUrl, emulateCPUThrottling, slow3G, viewportConfig, debugType, debugTarget, deviceCategory, deviceModel});
  return traceResultJson || null;
}

export {replayExperience};
