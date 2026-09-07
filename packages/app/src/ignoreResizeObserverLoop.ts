/**
 * Chrome + webpack-dev-server treat "ResizeObserver loop completed with
 * undelivered notifications" as an uncaught error and paint a full-screen
 * overlay. It is a layout-timing warning, not an app failure.
 *
 * Capture-phase listeners run before the WDS overlay (bubble). Study-only.
 */
const IGNORE = /ResizeObserver loop/i;

function isResizeObserverLoop(message?: string): boolean {
  return Boolean(message && IGNORE.test(message));
}

function hideWebpackOverlay() {
  document.getElementById('webpack-dev-server-client-overlay')?.remove();
}

window.addEventListener(
  'error',
  event => {
    if (
      isResizeObserverLoop(event.message) ||
      isResizeObserverLoop(event.error?.message)
    ) {
      event.stopImmediatePropagation();
      event.preventDefault();
      hideWebpackOverlay();
    }
  },
  true,
);

window.addEventListener(
  'unhandledrejection',
  event => {
    const reason = event.reason;
    const message =
      typeof reason === 'string'
        ? reason
        : reason instanceof Error
          ? reason.message
          : undefined;
    if (isResizeObserverLoop(message)) {
      event.stopImmediatePropagation();
      event.preventDefault();
      hideWebpackOverlay();
    }
  },
  true,
);
