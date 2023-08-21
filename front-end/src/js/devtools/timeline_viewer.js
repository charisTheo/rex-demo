/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */
/* eslint-disable no-undef */
import SyncView from './sync_view';
import DevTools from './devtools';
import Utils from './utils';

const wait = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

// eslint-disable-next-line no-unused-vars
class Viewer {
  constructor() {
    this.params = new URL(location.href).searchParams;
    this.syncView = new SyncView();
    this.timelineURL = this.params.get('loadTimelineFromURL');
    this.timelineProvider = 'url';

    this.totalSize = 50 * 1000 * 1000;
    this.loadingStarted = false;
    this.refreshPage = false;
    // remote location of devtools we're using
    this.devtoolsBase = document.getElementById('devtoolsscript').src.replace(/inspector\.js.*/, '');

    this.makeDevToolsVisible(false);
    this.utils = new Utils();
    this.devTools = new DevTools({viewerInstance: this});
    this.devTools.init();
    this.devTools.monkeypatchLoadResourcePromise();
  }

  attachSubmitUrlListener() {
    const form = document.querySelector('form');
    form.addEventListener('submit', evt => {
      evt.preventDefault();
      const formdata = new FormData(evt.target);
      const url = formdata.get('url');
      if (!url) return;
      const parsedURL = new URL(location.href);
      parsedURL.searchParams.delete('loadTimelineFromURL');
      // this is weird because we don't want url encoding of the URL
      parsedURL.searchParams.append('loadTimelineFromURL', 'REPLACEME');
      location.href = parsedURL.toString().replace('REPLACEME', url);
    });
  }

  attachPrefillUrlListener() {
    const input = document.querySelector('#enterurl');
    const submit = document.querySelector('input[type=submit]');

    [...document.querySelectorAll('a[data-url]')].forEach(elem => {
      elem.addEventListener('click', async evt => {
        evt.preventDefault();
        evt.cancelBubble = true;
        const url = evt.target.dataset.url;
        await wait(250);
        input.value = url;
        await wait(600);
        submit.focus();
        await wait(600);
        submit.click();
      });
    });
  }

  dragover(e) {
    e.stopPropagation();
    e.preventDefault();
    this.makeDevToolsVisible(true);
    // we fair that all timeline resources are uploaded
    UI.inspectorView.showPanel('timeline');
  }

  makeDevToolsVisible(bool) {
    document.body.classList[bool ? 'remove' : 'add']('hide-devtools');
  }
  
  loadResource(requestedURL) {
    return this.loadResourcePromise(requestedURL)
      .then(resp => {
        this.devTools.monkeyPatchingHandleDrop();
        return resp;
      });
  }

  // monkeypatched method for devtools
  loadResourcePromise(requestedURL) {
    const url = new URL(requestedURL, location.href);
    const URLofViewer = new URL(location.href);

    // hosted devtools gets confused
    // if DevTools is requesting a file thats on our origin, we'll redirect it to devtoolsBase
    if (url && url.origin === URLofViewer.origin && (requestedURL !== this.timelineURL)) {
      const relativeurl = url.pathname.replace(URLofViewer.pathname, '').replace(/^\//, '');
      const redirectedURL = new URL(relativeurl, this.devtoolsBase);
      return this._orig_loadResourcePromise(redirectedURL.toString());
    }

    // // pass through URLs that aren't our timelineURL param
    if (requestedURL !== this.timelineURL) {
      return this._orig_loadResourcePromise(url);
    }

    return this.fetchTimelineAsset(url.href).then(payload => payload);
  }

  fetchTimelineAsset(url, method = 'GET', body) {
    this.netReqMuted = false;
    this.loadingStarted = false;
    return this.utils.fetch(url, {
      url, method, body,
      onprogress: this.updateProgress.bind(this),
    }, true)
      .then(xhr => {
        return xhr.responseText;
      })
      .catch(({error, xhr}) => {
        this.makeDevToolsVisible(false);
        this.updateStatus('Download of asset failed. ' + ((xhr.readyState == xhr.DONE) ? 'CORS headers likely not applied.' : ''));
        console.warn('Download of asset failed', error);
      });
  }

  updateProgress(evt) {
    try {
      this.updateStatus(`Download progress: ${((evt.loaded / this.totalSize) * 100).toFixed(2)}%`);

      UI.inspectorView.showPanel('timeline').then(_ => {
        const panel = Timeline.TimelinePanel.instance();
        // start progress
        if (!this.loadingStarted) {
          this.loadingStarted = true;
          panel && panel.loadingStarted();
        }

        // update progress
        panel && panel.loadingProgress(evt.loaded / (evt.total || this.totalSize));

        // flip off filmstrip or network if theres no data in the trace
        if (!this.netReqMuted) {
          this.netReqMuted = true;
          this.devTools.monkepatchSetMarkers();
        }
      });
    } catch (e) {}
  }
}

export default Viewer;