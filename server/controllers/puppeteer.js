import puppeteer from 'puppeteer';
import log from '../utils/log.js';
import {PredefinedNetworkConditions} from 'puppeteer';
const { randomUUID } = await import('node:crypto');

/**
 * 
 * @param {*} config 
 * @returns 
 * Given a config file this function will perform a simple tracing based on the config
 */
async function tracing(config) {
    const pageUrl = config.pageUrl;
    const emulateCPUThrottling = config.emulateCPUThrottling;
    const slow3G = config.slow3G;
    const viewportConfig = config.viewportConfig;
    const traceFileName = `${randomUUID()}.json`;    
    // Launch the browser and open a new blank page
    const browser = await puppeteer.launch({headless: 'new'});
    const page = await browser.newPage();
    // Set screen size
    if(viewportConfig) {
        await page.setViewport(viewportConfig); 
    }
    // Set network condition
    if(slow3G) {
        await page.emulateNetworkConditions(PredefinedNetworkConditions['Slow 3G']);
    }
    //set CPU condition
    if(emulateCPUThrottling) {
        await page.emulateCPUThrottling(4);
    }
    try {
        // Configure the navigation timeout
        await page.setDefaultNavigationTimeout(0);
        //start tracing 
        await page.tracing.start({path: traceFileName});
        // Navigate the page to a URL
        await page.goto(pageUrl);
        await page.tracing.stop();
        await browser.close();
        return traceFileName;
    }catch(error) {
        return undefined;
    }

}

/**
 * 
 * @param {*} pageUrl 
 * Given a page Url this function will run tracing experience 
 * then open the result in a tracing view
 */

async function replayExperience(pageUrl, emulateCPUThrottling, slow3G, viewportConfig) {
    try {
        const traceResultJson = await tracing({pageUrl, emulateCPUThrottling, slow3G, viewportConfig});
        if(traceResultJson !== undefined) {
            return traceResultJson;
        }else {
            return null;
        }
    } catch (error) {
        return null;
    }
}

export {replayExperience};
