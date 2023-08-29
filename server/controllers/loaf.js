/**
 */
export default function loaf() {
  if (PerformanceObserver.supportedEntryTypes.includes('long-animation-frame')) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        performance.measure('LoAF', {
          start: entry.startTime,
          end: entry.startTime + entry.duration,
        });
      }
    });
    observer.observe({type: 'long-animation-frame', buffered: true});
  }
}
