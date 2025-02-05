import { setDebugMode } from "./util/log";
import { HandshakeStatus, ReplitInitArgs, ReplitInitOutput } from "./types";
import { extensionPort, proxy } from "./util/comlink";
import { getHandshakeStatus, setHandshakeStatus } from "./util/handshake";
export * from "./api";
export * from "./util/log";
export { extensionPort, proxy };
export * from "./types";
import * as replit from ".";

import { version } from "../package.json";

export { version };

function promiseWithTimeout<T>(promise: Promise<T>, timeout: number) {
  return Promise.race([
    promise,
    new Promise((_resolve, reject) =>
      setTimeout(() => reject(new Error("timeout")), timeout)
    ),
  ]);
}

async function windowIsReady() {
  return new Promise<void>((resolve) => {
    if (document.readyState === "complete") {
      resolve();
      return;
    }

    const loadHandler = () => {
      resolve();
      window.removeEventListener("load", loadHandler);
    };

    window.addEventListener("load", loadHandler);
  });
}

export async function init(args?: ReplitInitArgs): Promise<ReplitInitOutput> {
  if (extensionPort === null) {
    throw new Error("Extension must be initialized in a browser context");
  }

  setDebugMode(args?.debug || false);

  const onExtensionClick = () => {
    extensionPort.activatePane();
  };

  const windDown = () => {
    window.document.removeEventListener("click", onExtensionClick);
  };

  try {
    if (window) {
      await windowIsReady();
    }

    await promiseWithTimeout(
      extensionPort.handshake({
        clientName: "@replit/extensions",
        clientVersion: version,
      }),
      args?.timeout || 2000
    );

    setHandshakeStatus(HandshakeStatus.Ready);

    if (window) {
      window.document.addEventListener("click", onExtensionClick);
    }
  } catch (e) {
    setHandshakeStatus(HandshakeStatus.Error);
    console.error(e);
    windDown();
    throw e;
  }

  return {
    dispose: windDown,
    status: getHandshakeStatus(),
  };
}
