import puppeteer, {PredefinedNetworkConditions, KnownDevices} from 'puppeteer';
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
    debugType,
    debugTarget, 
    deviceCategory, 
    deviceModel
  } = (config || {});

  const traceFileName = `${randomUUID()}.json`;
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({headless: 'new'});
  const page = await browser.newPage();
  // set up the device config
  if(deviceCategory === 'mobile' || deviceCategory === 'tablet') {
    // identify the device model and then setup the emulation 
    const _devicemodel = KnownDevices[deviceModel];
    if(_devicemodel) {
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
    await page.emulateCPUThrottling(4);
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
    switch(debugType) {
      case 'keydown': {
        if(htmlElement) {
          await htmlElement.type('World', {delay: 100});
          await new Promise(r => setTimeout(r, 200));
        }
        break;
      }
      case 'pointerdown': {
        break;  
      }
      case 'click' :{
        // find the selector element
        // perform a click and then await the time of a minimum INP threshold which is 200ms
        if(htmlElement) {
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
    console.log(error)
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
async function replayExperience(pageUrl, emulateCPUThrottling, slow3G, viewportConfig, debugType, debugTarget, deviceCategory, deviceModel) {
  const traceResultJson = await tracing({pageUrl, emulateCPUThrottling, slow3G, viewportConfig, debugType, debugTarget, deviceCategory, deviceModel});
  return traceResultJson || null;
}

export {replayExperience};
