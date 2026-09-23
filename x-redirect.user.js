// ==UserScript==
// @name        Redirect X/Twitter to a chosen instance
// @namespace   local.redirect.xcancel
// @version     1.1.0
// @author      Amqx
// @description Redirects x.com / twitter.com to a Nitter instance you configure. Does nothing until an instance is set.
// @match       *://x.com/*
// @match       *://www.x.com/*
// @match       *://mobile.x.com/*
// @match       *://twitter.com/*
// @match       *://www.twitter.com/*
// @match       *://mobile.twitter.com/*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @grant       GM_registerMenuCommand
// @run-at      document-start
// @updateURL   https://raw.githubusercontent.com/Amqx/x-redirect/refs/heads/master/x-redirect.user.js
// @downloadURL https://raw.githubusercontent.com/Amqx/x-redirect/refs/heads/master/x-redirect.user.js
// ==/UserScript==

(function () {
  'use strict';

  const STORE_KEY = 'instance';
  const SETTINGS_PARAM = 'x_redirect_settings';

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

  function getInstance() {
    return normalise(GM_getValue(STORE_KEY, ''));
  }

  function setInstance() {
    const current = GM_getValue(STORE_KEY, '');
    const answer = window.prompt(
      'Redirect x.com / twitter.com to which instance?\n' +
      'Example: nitter.example.com\n\n' +
      'Leave empty to disable redirecting.',
      current
    );

    // Cancelled — leave the existing setting alone.
    if (answer === null) return { changed: false, instance: getInstance() };

    if (!answer.trim()) {
      GM_deleteValue(STORE_KEY);
      return { changed: true, instance: null };
    }

    const instance = normalise(answer);
    if (!instance) {
      window.alert('"' + answer + '" is not a valid host. Nothing was saved.');
      return { changed: false, instance: getInstance() };
    }

    GM_setValue(STORE_KEY, instance);
    return { changed: true, instance };
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

  GM_registerMenuCommand('Set redirect instance…', function () {
    const result = setInstance();
    if (result.changed && result.instance) redirect(result.instance);
  });

  GM_registerMenuCommand('Clear redirect instance', function () {
    GM_deleteValue(STORE_KEY);
    window.alert('Redirect instance cleared. x.com / twitter.com will load normally.');
  });

  // This URL remains reachable even when an instance is already configured.
  if (new URLSearchParams(window.location.search).has(SETTINGS_PARAM)) {
    const result = setInstance();
    if (result.changed && result.instance) {
      // Go to the new instance without forwarding the settings query string.
      window.location.replace(result.instance);
    } else if (result.changed) {
      window.alert('Redirect instance cleared. x.com / twitter.com will load normally.');
    }
    return;
  }

  const instance = getInstance();

  if (instance) {
    redirect(instance);
  } else {
    console.warn('[x-redirect] No instance configured — not redirecting.');
    const chosen = setInstance();
    if (chosen.instance) redirect(chosen.instance);
  }
})();
