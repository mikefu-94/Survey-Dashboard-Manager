// ==UserScript==
// @name         Claude Design — Action Deep-links
// @namespace    edb.survey-templates
// @version      1.0.0
// @description  Auto-trigger Download / Handoff on Claude Design when ?action=... is in the URL. Pairs with the EDB Survey Templates dashboard.
// @match        https://claude.ai/design/p/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const params = new URLSearchParams(location.search);
  const action = params.get('action');
  if (!action) return;

  // Map dashboard action -> phrases that match the menu item label.
  // Match is case-insensitive `includes`, so partials are fine.
  const ACTION_LABELS = {
    download: ['download project as .zip', 'download project', 'download .zip'],
    handoff:  ['handoff to claude code', 'open in claude code'],
  };

  const labels = ACTION_LABELS[action];
  if (!labels) return;

  // Strip ?action=… so a manual reload doesn't re-fire.
  function stripActionParam() {
    params.delete('action');
    const qs = params.toString();
    history.replaceState(
      null,
      '',
      location.pathname + (qs ? '?' + qs : '') + location.hash
    );
  }

  // Wait until predicate() returns truthy or timeout (ms).
  function waitFor(predicate, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const tryNow = predicate();
      if (tryNow) return resolve(tryNow);

      const start = Date.now();
      const obs = new MutationObserver(() => {
        const found = predicate();
        if (found) {
          obs.disconnect();
          resolve(found);
        } else if (Date.now() - start > timeout) {
          obs.disconnect();
          reject(new Error('waitFor timed out'));
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    });
  }

  // Find a clickable element whose visible text or aria-label matches one of the labels.
  function findMenuItemByText(labels) {
    const els = document.querySelectorAll(
      'button, [role="menuitem"], [role="menuitemradio"], a[href]'
    );
    const lc = s => (s || '').trim().toLowerCase();
    for (const el of els) {
      const t = lc(el.textContent);
      const a = lc(el.getAttribute('aria-label'));
      if (labels.some(l => t.includes(l) || a.includes(l))) return el;
    }
    return null;
  }

  // Find the kebab / "More options" button that opens the menu containing
  // Download / Handoff. We try several selectors because Claude Design's
  // markup may evolve.
  function findMoreMenuTrigger() {
    const candidates = [
      'button[aria-label*="more" i]',
      'button[aria-label*="options" i]',
      'button[aria-haspopup="menu"]',
      'button[data-state="closed"][aria-haspopup]',
    ];
    for (const sel of candidates) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    // Fallback: any button whose text/aria contains "more"
    return [...document.querySelectorAll('button')].find(b => {
      const a = (b.getAttribute('aria-label') || '').toLowerCase();
      return a.includes('more') || a.includes('menu');
    }) || null;
  }

  async function run() {
    try {
      // 1. If the menu item is already in the DOM (rare), click it directly.
      let item = findMenuItemByText(labels);

      if (!item) {
        // 2. Otherwise wait for the page to load enough that we can find the
        //    "More" button, click it to reveal the menu.
        const trigger = await waitFor(findMoreMenuTrigger, 10000);
        trigger.click();

        // 3. Wait for the matching menu item to appear, then click it.
        item = await waitFor(() => findMenuItemByText(labels), 6000);
      }

      stripActionParam();
      item.click();
      console.info('[claude-design-deeplinks] fired', action);
    } catch (err) {
      console.warn(
        '[claude-design-deeplinks] could not auto-trigger',
        action,
        err
      );
      // Leave the param in place so the user can see what was attempted.
    }
  }

  // Give the SPA a beat to mount its UI before we start hunting.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(run, 300));
  } else {
    setTimeout(run, 300);
  }
})();
