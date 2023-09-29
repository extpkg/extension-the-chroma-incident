type Instance = {
  tabId: string;
  windowId: string;
  webviewId: string;
  websessionId: string;
};

let instance: Instance | null = null;

const focusInstance = async () => {
  if (instance) {
    await ext.windows.restore(instance.windowId);
    await ext.windows.focus(instance.windowId);
  }
};

const destroyInstance = async () => {
  if (instance) {
    await ext.windows.remove(instance.windowId);
    await ext.tabs.remove(instance.tabId);
    await ext.webviews.remove(instance.webviewId);
    await ext.websessions.remove(instance.websessionId);
    instance = null;
  }
};

ext.runtime.onExtensionClick.addListener(async () => {
  if (instance) {
    await focusInstance();
    return;
  }

  let webview: ext.webviews.Webview | null = null;
  let websession: ext.websessions.Websession | null = null;
  let window: ext.windows.Window | null = null;
  let tab: ext.tabs.Tab | null = null;

  try {
    // const isDarkMode = await ext.windows.getPlatformDarkMode();

    tab = await ext.tabs.create({
      text: `The Chroma Accident`,
      icon: "./assets/128.png",
      mutable: true,
      // icon_dark: "./assets/128-dark.png",
    });

    const { os } = await ext.runtime.getPlatformInfo();
    const aspectRatio = 960 / 600;
    const minWidth = 960;
    const minHeight = minWidth / aspectRatio;

    window = await ext.windows.create({
      center: true,
      // darkMode: isDarkMode,
      fullscreenable: true,
      title: `The Chroma Accident`,
      // icon: isDarkMode ? "./assets/128.png" : "./assets/128-dark.png",
      icon: "./assets/128.png",
      vibrancy: false,
      frame: os !== "mac",
      titleBarStyle: os === "mac" ? "inset" : undefined,
      width: minWidth,
      height: minHeight,
      minWidth,
      minHeight,
      aspectRatio,
    });

    const contentSize = await ext.windows.getContentSize(window.id);

    websession = await ext.websessions.create({
      partition: `The Chroma Accident`,
      global: false,
    });
    webview = await ext.webviews.create({
      window,
      websession,
      autoResize: { horizontal: true, vertical: true },
      bounds: { ...contentSize, x: 0, y: 0 },
    });

    await ext.webviews.loadFile(webview.id, "index.html");
    await ext.webviews.openDevTools(webview.id, {
      mode: "detach",
      activate: true,
    });

    instance = {
      tabId: tab.id,
      windowId: window.id,
      websessionId: websession.id,
      webviewId: webview.id,
    };
  } catch (error) {
    console.error("ext.runtime.onExtensionClick", JSON.stringify(error));

    if (window) await ext.windows.remove(window.id);
    if (tab) await ext.tabs.remove(tab.id);
    if (websession) await ext.websessions.remove(websession.id);
    if (webview) await ext.webviews.remove(webview.id);
  }
});

ext.tabs.onClicked.addListener(async () => {
  try {
    await focusInstance();
  } catch (error) {
    console.log(error, "ext.tabs.onClicked");
  }
});

ext.tabs.onClickedMute.addListener(async () => {
  try {
    if (instance) {
      const muted = await ext.webviews.isAudioMuted(instance.webviewId);
      await ext.webviews.setAudioMuted(instance.webviewId, !muted);
      await ext.tabs.update(instance.tabId, { muted: !muted });
    }
  } catch (error) {
    console.log(error, "ext.tabs.onClickedMute");
  }
});

ext.tabs.onClickedClose.addListener(async () => {
  try {
    await destroyInstance();
  } catch (error) {
    console.log(error, "ext.tabs.onClickedClose");
  }
});

ext.tabs.onRemoved.addListener(async () => {
  try {
    await destroyInstance();
  } catch (error) {
    console.log(error, "ext.tabs.onRemoved");
  }
});

ext.windows.onClosed.addListener(async () => {
  try {
    await destroyInstance();
  } catch (error) {
    console.log(error, "ext.windows.onClosed");
  }
});

ext.windows.onRemoved.addListener(async () => {
  try {
    await destroyInstance();
  } catch (error) {
    console.log(error, "ext.windows.onRemoved");
  }
});

// ext.windows.onUpdatedDarkMode.addListener(async (event, details) => {
//   try {
//     await ext.windows.update(event.id, {
//       icon: details.enabled ? "./assets/128.png" : "./assets/128-dark.png",
//     });
//   } catch (error) {
//     console.log(error, "ext.windows.onUpdatedDarkMode");
//   }
// });
