/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
// eslint-disable-next-line no-unused-vars
import '@material/web/iconbutton/icon-button'
class DevTools {
  constructor(options) {
    this.viewerInstance = options.viewerInstance;
    this.attachMonkeyPatchListeners();
  }

  eventHasCtrlOrMeta(event) {
    return this.platform === 'mac' ? (event.metaKey && !event.ctrlKey) : (event.ctrlKey && !event.metaKey);
  }

  attachMonkeyPatchListeners() {
    // don't let devtools trap ctrl-r
    document.addEventListener('keydown', event => {
      if (self.UI && this.eventHasCtrlOrMeta(event) && String.fromCharCode(event.which).toLowerCase() === 'r') {
        event.handled = true;
      }
    });
  }

  init() {
    Root.Runtime.experiments._supportEnabled = true;
    Root.Runtime.experiments.isEnabled = name => {
      switch (name) {
        case 'timelineV8RuntimeCallStats': return true;
        case 'timelineShowAllEvents': return true;
        case 'timelineShowAllProcesses': return true;
        default:
          return false;
      }
    };

    Common.moduleSetting = function(module) {
      const ret = {
        addChangeListener: _ => { },
        removeChangeListener: _ => { },
        get: _ => new Map(),
        set: _ => { },
        getAsArray: _ => []
      };
      if (module === 'releaseNoteVersionSeen') {
        ret.get = _ => Infinity;
      }
      if (module === 'showNativeFunctionsInJSProfile') {
        ret.get = _ => true;
      }
      if (module === 'flamechartMouseWheelAction') {
        ret.get = _ => 'zoom';
      }
      return ret;
    };

    // Common.settings is created in a window onload listener
    function monkeyPatch() {
      if (!Common.settings) {
        return;
      }
      Common.settings.createSetting('timelineCaptureFilmStrip', true).set(true);
      this.showTimeline();
    }
    
    window.addEventListener('load', monkeyPatch.bind(this));
  }

  showTimeline() {
    const plzRepeat = _ => setTimeout(_ => this.showTimeline(), 100);
    if (typeof UI?.inspectorView === 'undefined') return plzRepeat();

    UI.inspectorView.showPanel('timeline').then(() => {
      // Expand Interactions and Main thread groups in Timeline
      UI.panels.timeline.flameChart.mainFlameChart.expandGroup(3);
      UI.panels.timeline.flameChart.mainFlameChart.expandGroup(4);
      setTimeout(this.tweakUI.bind(this), 250);
    })
  }

  tweakUI() {
    try {
      // remove panel tabs
      const tabbedPaneHeaderEl = document
          .querySelector('.root-view .tabbed-pane')
          .shadowRoot
          .querySelector('.vbox > .tabbed-pane-header');
      tabbedPaneHeaderEl.style.setProperty('--toolbar-bg-color', 'var(--md-sys-color-surface-container-highest)');
      tabbedPaneHeaderEl.style.alignItems = 'center';
      tabbedPaneHeaderEl.style.justifyContent = 'center';
      tabbedPaneHeaderEl.style.fontSize = '120%';
      tabbedPaneHeaderEl.innerHTML = '<span>DevTools Performance Timeline</span>';

      // Add hide/show devtools toggle button
      const expandButtonWrapper = document.createElement('div');
      expandButtonWrapper.id = 'devtools-expand-button-wrapper';
      expandButtonWrapper.innerHTML = `
        <md-icon-button
          onclick="document.body.classList.toggle('hide-devtools')"
          aria-label="Toggle devtools performance timeline"
          toggle
        >
          <md-icon>expand_more</md-icon>
          <md-icon slot="selectedIcon">expand_less</md-icon>
        </md-icon-button>
      `;
      document.querySelector('.root-view').appendChild(expandButtonWrapper);
    } catch (e) {
      console.warn('failed to tweak UI', e);
    }
  }

  monkeypatchLoadResourcePromise() {
    this.viewerInstance._orig_loadResourcePromise = Root.Runtime.loadResourcePromise;
    Root.Runtime.loadResourcePromise = this.viewerInstance.loadResource.bind(this.viewerInstance);
  }

  monkeyPatchingHandleDrop() {
    if (window.Timeline && window.Timeline.TimelinePanel) {
      const timelinePanel = Timeline.TimelinePanel.instance();
      const dropTarget = timelinePanel._dropTarget;
      const handleDrop = dropTarget._handleDrop;
      dropTarget._handleDrop = function(...args) {
        handleDrop.apply(dropTarget, args);
      };
    }
  }

  monkepatchSetMarkers() {
    const panel = Timeline.TimelinePanel.instance();
    const oldSetMarkers = panel._setMarkers;
    panel._setMarkers = function() {
      if (this._performanceModel._timelineModel.networkRequests().length === 0) {
        Common.settings.createSetting('timelineCaptureNetwork', true).set(false);
      }
      if (this._performanceModel.filmStripModel()._frames.length === 0) {
        Common.settings.createSetting('timelineCaptureFilmStrip', true).set(false);
      }
      oldSetMarkers.call(this, this._performanceModel._timelineModel);
    };
  }
}

export default DevTools