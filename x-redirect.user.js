// ==UserScript==
// @name        Redirect X/Twitter to a chosen instance
// @namespace   local.redirect.xcancel
// @version     1.3.0
// @author      Amqx
// @description Redirects x.com / twitter.com to a Nitter instance you configure.
// @match       *://*/*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @grant       GM_registerMenuCommand
// @grant       GM_xmlhttpRequest
// @connect     *
// @run-at      document-start
// @updateURL   https://raw.githubusercontent.com/Amqx/x-redirect/refs/heads/master/x-redirect.user.js
// @downloadURL https://raw.githubusercontent.com/Amqx/x-redirect/refs/heads/master/x-redirect.user.js
// ==/UserScript==

(function () {
  'use strict';

  // The primary keeps the original key so existing settings carry over.
  const STORE_KEY = 'instance';
  const BACKUP_KEY = 'backup';
  const SETTINGS_PARAM = 'x_redirect_settings';
  const PROBE_TIMEOUT_MS = 3000;
  const X_HOSTS = [
    'x.com', 'www.x.com', 'mobile.x.com',
    'twitter.com', 'www.twitter.com', 'mobile.twitter.com',
  ];

  function normalise(input) {
    if (typeof input !== 'string') return null;

    const raw = input.trim();
    if (!raw) return null;

    let url;
    try {
      url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : 'https://' + raw);
    } catch (e) {
      return null;
    }

    // Always force HTTPS, and refuse anything that isn't a plain web host.
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (!url.hostname || !url.hostname.includes('.')) return null;

    const base = url.pathname.replace(/\/+$/, '');
    return 'https://' + url.host + base;
  }

  function getInstances() {
    return {
      primary: normalise(GM_getValue(STORE_KEY, '')),
      backup: normalise(GM_getValue(BACKUP_KEY, '')),
    };
  }

  // Returns the new value for one slot.
  function askFor(label, key) {
    const answer = window.prompt(
      'Redirect x.com / twitter.com to which ' + label + ' instance?\n' +
      'Example: nitter.example.com\n\n' +
      'Leave empty for none.',
      GM_getValue(key, '')
    );

    if (answer === null) return undefined;
    if (!answer.trim()) return null;

    const instance = normalise(answer);
    if (!instance) {
      window.alert('"' + answer + '" is not a valid host. Nothing was saved.');
      return undefined;
    }
    return instance;
  }

  function store(key, value) {
    if (value) GM_setValue(key, value);
    else GM_deleteValue(key);
  }

  function setInstances() {
    // Cancelling either prompt leaves both settings untouched.
    const primary = askFor('primary', STORE_KEY);
    if (primary === undefined) return { changed: false, instances: getInstances() };

    const backup = askFor('backup (used when the primary is unreachable)', BACKUP_KEY);
    if (backup === undefined) return { changed: false, instances: getInstances() };

    store(STORE_KEY, primary);
    store(BACKUP_KEY, backup);
    return { changed: true, instances: getInstances() };
  }

  function clearInstances() {
    GM_deleteValue(STORE_KEY);
    GM_deleteValue(BACKUP_KEY);
  }

  // Any HTTP response at all counts as reachable.
  function isReachable(instance) {
    return new Promise(function (resolve) {
      GM_xmlhttpRequest({
        method: 'HEAD',
        url: instance + '/',
        timeout: PROBE_TIMEOUT_MS,
        onload: function () { resolve(true); },
        onerror: function () { resolve(false); },
        ontimeout: function () { resolve(false); },
        onabort: function () { resolve(false); },
      });
    });
  }

  async function pickInstance(instances) {
    const { primary, backup } = instances;
    if (!primary || !backup) return primary || backup;
    return (await isReachable(primary)) ? primary : backup;
  }

  function hasInstance(instances) {
    return Boolean(instances.primary || instances.backup);
  }

  function redirect(instance) {
    const target = new URL(instance);
    const here = window.location;

    // Never redirect onto the instance itself, or we'd loop.
    if (here.hostname.toLowerCase() === target.hostname.toLowerCase()) return;

    const basePath = target.pathname.replace(/\/+$/, '');
    target.pathname = basePath + here.pathname;
    target.search = here.search;
    target.hash = here.hash;

    // Replace so the X url doesn't stay in history.
    here.replace(target.toString());
  }

  async function redirectToBest(instances) {
    const instance = await pickInstance(instances);
    if (instance) redirect(instance);
  }

  const instances = getInstances();
  const host = window.location.host.toLowerCase();
  const onX = X_HOSTS.includes(window.location.hostname.toLowerCase());
  const onInstance = [instances.primary, instances.backup].some(function (instance) {
    return instance && new URL(instance).host.toLowerCase() === host;
  });

  if (!onX && !onInstance) return;

  GM_registerMenuCommand('Set redirect instances…', function () {
    const result = setInstances();
    if (result.changed) redirectToBest(result.instances);
  });

  GM_registerMenuCommand('Clear redirect instances', function () {
    clearInstances();
    window.alert('Redirect instances cleared. x.com / twitter.com will load normally.');
  });

  // On an instance page only the menu is needed.
  if (!onX) return;

  // This URL remains reachable even when an instance is already configured.
  if (new URLSearchParams(window.location.search).has(SETTINGS_PARAM)) {
    const result = setInstances();
    if (result.changed && hasInstance(result.instances)) {
      // Go to the new instance without forwarding the settings query string.
      pickInstance(result.instances).then(function (instance) {
        window.location.replace(instance);
      });
    } else if (result.changed) {
      window.alert('Redirect instances cleared. x.com / twitter.com will load normally.');
    }
    return;
  }

  if (hasInstance(instances)) {
    redirectToBest(instances);
  } else {
    console.warn('[x-redirect] No instance configured — not redirecting.');
    const chosen = setInstances();
    if (chosen.changed) redirectToBest(chosen.instances);
  }
})();
