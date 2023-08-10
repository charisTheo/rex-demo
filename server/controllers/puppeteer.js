import puppeteer from 'puppeteer';
import log from '../utils/log.js';

/**
 *
 * @param {Object} instructions
 */
async function render(instructions) {
  const result = await run(instructions);
  log('render ~ result:', result);
}

/**
 * TODO: Run replay experience and return DevTools Performance timeline
 * @param {Object} instructions
 */
async function run(instructions) {
  log('Rendering new URL: ', instructions.url);
  // eslint-disable-next-line no-unused-vars
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    // eslint-disable-next-line max-len
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });
}

export {render};
