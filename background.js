//default settings
let settings = {};

const blocked = {
    type: 'socks',
    host: 'block-proxy.localhost',
    port: 1,
    failoverTimeout: 1,
    username: 'nonexistent user',
    password: 'random password',
    proxyDNS: true
};

// Get the stored list
browser.storage.local.get(data => {
    if (data) {
        settings = data;
    }
});

// Listen for changes in the blocked list
browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
        let changedItems = Object.keys(changes);
        for (let item of changedItems) {
            settings[item] = changes[item].newValue;
        }
    }
});

function handleProxifiedRequest(requestInfo) {
    let storeId = requestInfo.cookieStoreId;
    if (!storeId) {
        if (requestInfo.incognito) {
            storeId = 'firefox-private';
        } else if (requestInfo.tabId !== -1) {
            storeId = 'firefox-nocontainer';
        } else {
            storeId = 'firefox-unknown';
        }
    }

    if (storeId) {
        if (settings[storeId] && settings[storeId].proxies && settings[storeId].proxies.length) {
            let result = settings[storeId].proxies[0];

            return {...result, connectionIsolationKey: "" + storeId, proxyDNS: true};
        }
        if (settings.default && settings.default.proxies && settings.default.proxies.length) {
            let result = settings.default.proxies[0];

            return {...result, connectionIsolationKey: "" + storeId, proxyDNS: true};
        }
    }

    return blocked;
}

// Listen for a request to open a webpage
browser.proxy.onRequest.addListener(handleProxifiedRequest, {urls: ["<all_urls>"]});

//open preferences on icon click
browser.browserAction.onClicked.addListener(() => {
    browser.runtime.openOptionsPage();
});

// Log any errors from the proxy script
browser.proxy.onError.addListener(error => {
    console.error(`Proxy error: ${error.message}`);
});
