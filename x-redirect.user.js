// ==UserScript==
// @name        Redirect X/Twitter to a chosen instance
// @namespace   local.redirect.xcancel
// @version     1.0.0
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
    if (answer === null) return getInstance();

    if (!answer.trim()) {
      GM_deleteValue(STORE_KEY);
      return null;
    }

    const instance = normalise(answer);
    if (!instance) {
      window.alert('"' + answer + '" is not a valid host. Nothing was saved.');
      return getInstance();
    }

    GM_setValue(STORE_KEY, instance);
    return instance;
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
    const instance = setInstance();
    if (instance) redirect(instance);
  });

  GM_registerMenuCommand('Clear redirect instance', function () {
    GM_deleteValue(STORE_KEY);
    window.alert('Redirect instance cleared. x.com / twitter.com will load normally.');
  });

  const instance = getInstance();

  if (instance) {
    redirect(instance);
  } else {
    console.warn('[x-redirect] No instance configured — not redirecting.');
    const chosen = setInstance();
    if (chosen) redirect(chosen);
  }
})();
