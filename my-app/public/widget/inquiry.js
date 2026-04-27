/* [APP_NAME] inquiry widget — embeddable form for any website.
 *
 * Usage:
 *   <div id="app-name-inquiry"></div>
 *   <script>
 *     window.APP_NAME_CONFIG = {
 *       token: "YOUR_INQUIRY_SOURCE_TOKEN",
 *       apiBase: "https://your-app.vercel.app",
 *       mountId: "app-name-inquiry",  // optional, default "app-name-inquiry"
 *       sourceLabel: "My Website",     // optional, shown in the inbox
 *     };
 *   </script>
 *   <script src="https://your-app.vercel.app/widget/inquiry.js" async></script>
 *
 * The widget renders into a Shadow DOM so the host page's CSS can't
 * leak in or out. It POSTs to {apiBase}/api/inquiry with the token in
 * the X-Inquiry-Token header.
 */
(function () {
  'use strict';

  if (window.__APP_NAME_INQUIRY_WIDGET_LOADED__) return;
  window.__APP_NAME_INQUIRY_WIDGET_LOADED__ = true;

  var config = window.APP_NAME_CONFIG || {};
  var token = config.token;
  var apiBase = (config.apiBase || '').replace(/\/$/, '');
  var mountId = config.mountId || 'app-name-inquiry';
  var sourceLabel = config.sourceLabel || null;

  function fail(msg) {
    if (typeof console !== 'undefined' && console.error) {
      console.error('[inquiry widget]', msg);
    }
  }

  if (!token) return fail('Missing window.APP_NAME_CONFIG.token');
  if (!apiBase) return fail('Missing window.APP_NAME_CONFIG.apiBase');

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var mount = document.getElementById(mountId);
    if (!mount) {
      return fail('Mount element #' + mountId + ' not found');
    }

    // Shadow DOM root isolates styles from the host page.
    var shadow = mount.attachShadow({ mode: 'open' });

    var STYLES = [
      ':host { all: initial; }',
      '*, *::before, *::after { box-sizing: border-box; }',
      '.iw-root {',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
      '  font-size: 15px;',
      '  line-height: 1.5;',
      '  color: #111;',
      '  background: #fff;',
      '  border: 1px solid #e5e5e1;',
      '  border-radius: 8px;',
      '  padding: 24px;',
      '  max-width: 480px;',
      '  width: 100%;',
      '}',
      '.iw-title {',
      '  font-size: 1.25rem;',
      '  font-weight: 600;',
      '  margin: 0 0 4px;',
      '  letter-spacing: -0.01em;',
      '}',
      '.iw-subtitle {',
      '  margin: 0 0 20px;',
      '  font-size: 0.875rem;',
      '  color: #555;',
      '}',
      '.iw-row { display: grid; gap: 12px; margin-bottom: 12px; }',
      '.iw-row.iw-row-2 { grid-template-columns: 1fr 1fr; }',
      '@media (max-width: 480px) { .iw-row.iw-row-2 { grid-template-columns: 1fr; } }',
      '.iw-label {',
      '  display: block;',
      '  font-size: 0.8125rem;',
      '  color: #555;',
      '  margin-bottom: 4px;',
      '  font-weight: 500;',
      '}',
      '.iw-input, .iw-textarea {',
      '  width: 100%;',
      '  padding: 10px 12px;',
      '  border: 1px solid #d4d4d0;',
      '  border-radius: 6px;',
      '  font-size: 0.9375rem;',
      '  font-family: inherit;',
      '  color: inherit;',
      '  background: #fff;',
      '  transition: border-color 0.15s;',
      '}',
      '.iw-input:focus, .iw-textarea:focus {',
      '  outline: none;',
      '  border-color: #555;',
      '}',
      '.iw-textarea { min-height: 96px; resize: vertical; }',
      '.iw-button {',
      '  width: 100%;',
      '  padding: 12px 18px;',
      '  background: #111;',
      '  color: #fff;',
      '  border: none;',
      '  border-radius: 6px;',
      '  font-size: 0.9375rem;',
      '  font-weight: 500;',
      '  font-family: inherit;',
      '  cursor: pointer;',
      '  transition: background 0.15s;',
      '  margin-top: 8px;',
      '}',
      '.iw-button:hover:not(:disabled) { background: #333; }',
      '.iw-button:disabled { opacity: 0.6; cursor: not-allowed; }',
      '.iw-error {',
      '  padding: 10px 12px;',
      '  background: #fdeeec;',
      '  border: 1px solid #f5c6c1;',
      '  color: #b1341f;',
      '  border-radius: 6px;',
      '  font-size: 0.8125rem;',
      '  margin-bottom: 12px;',
      '}',
      '.iw-success {',
      '  text-align: center;',
      '  padding: 32px 16px;',
      '}',
      '.iw-success-mark {',
      '  display: inline-block;',
      '  width: 48px;',
      '  height: 48px;',
      '  border-radius: 50%;',
      '  background: #e7f5ec;',
      '  color: #2d7a4d;',
      '  line-height: 48px;',
      '  font-size: 24px;',
      '  margin-bottom: 12px;',
      '}',
      '.iw-success-title {',
      '  font-weight: 600;',
      '  margin: 0 0 4px;',
      '  font-size: 1.125rem;',
      '}',
      '.iw-success-body { margin: 0; color: #555; font-size: 0.875rem; }',
    ].join('\n');

    var styleEl = document.createElement('style');
    styleEl.textContent = STYLES;
    shadow.appendChild(styleEl);

    var root = document.createElement('div');
    root.className = 'iw-root';
    shadow.appendChild(root);

    function escapeHtml(s) {
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function renderForm(opts) {
      opts = opts || {};
      var errorHtml = opts.error
        ? '<div class="iw-error">' + escapeHtml(opts.error) + '</div>'
        : '';
      root.innerHTML =
        '<h2 class="iw-title">Get in touch</h2>' +
        '<p class="iw-subtitle">Send a message and I\'ll get back to you.</p>' +
        errorHtml +
        '<form class="iw-form" novalidate>' +
        '<div class="iw-row">' +
        '<div>' +
        '<label class="iw-label" for="iw-name">Name</label>' +
        '<input class="iw-input" id="iw-name" name="name" required maxlength="200" />' +
        '</div></div>' +
        '<div class="iw-row iw-row-2">' +
        '<div>' +
        '<label class="iw-label" for="iw-email">Email</label>' +
        '<input class="iw-input" id="iw-email" name="email" type="email" maxlength="200" />' +
        '</div>' +
        '<div>' +
        '<label class="iw-label" for="iw-phone">Phone</label>' +
        '<input class="iw-input" id="iw-phone" name="phone" type="tel" maxlength="60" />' +
        '</div></div>' +
        '<div class="iw-row iw-row-2">' +
        '<div>' +
        '<label class="iw-label" for="iw-shoot-type">Shoot type</label>' +
        '<input class="iw-input" id="iw-shoot-type" name="shoot_type" maxlength="100" placeholder="Portrait, wedding, editorial…" />' +
        '</div>' +
        '<div>' +
        '<label class="iw-label" for="iw-date">Preferred date</label>' +
        '<input class="iw-input" id="iw-date" name="preferred_date" type="date" />' +
        '</div></div>' +
        '<div class="iw-row">' +
        '<div>' +
        '<label class="iw-label" for="iw-message">Message</label>' +
        '<textarea class="iw-textarea" id="iw-message" name="message" maxlength="5000" placeholder="Anything you\'d like to share about the project…"></textarea>' +
        '</div></div>' +
        '<button class="iw-button" type="submit">Send inquiry</button>' +
        '</form>';

      var form = root.querySelector('form');
      form.addEventListener('submit', onSubmit);
    }

    function renderSuccess() {
      root.innerHTML =
        '<div class="iw-success">' +
        '<div class="iw-success-mark">✓</div>' +
        '<p class="iw-success-title">Inquiry sent</p>' +
        '<p class="iw-success-body">Thanks — I\'ll be in touch soon.</p>' +
        '</div>';
    }

    function getValue(form, name) {
      var el = form.querySelector('[name="' + name + '"]');
      var v = el && el.value ? el.value.trim() : '';
      return v || null;
    }

    function onSubmit(event) {
      event.preventDefault();
      var form = event.currentTarget;
      var button = form.querySelector('.iw-button');
      var name = getValue(form, 'name');

      if (!name) {
        renderForm({ error: 'Please enter your name.' });
        return;
      }

      button.disabled = true;
      button.textContent = 'Sending…';

      var payload = {
        name: name,
        email: getValue(form, 'email'),
        phone: getValue(form, 'phone'),
        shoot_type: getValue(form, 'shoot_type'),
        preferred_date: getValue(form, 'preferred_date'),
        message: getValue(form, 'message'),
      };
      if (sourceLabel) payload.source_label = sourceLabel;

      fetch(apiBase + '/api/inquiry', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'X-Inquiry-Token': token,
        },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          if (res.ok) return null;
          return res
            .json()
            .catch(function () {
              return { error: 'Network error (' + res.status + ')' };
            })
            .then(function (data) {
              throw new Error(data && data.error ? data.error : 'Request failed');
            });
        })
        .then(function () {
          renderSuccess();
        })
        .catch(function (err) {
          var msg =
            (err && err.message) ||
            'Something went wrong. Please try again or email me directly.';
          renderForm({ error: msg });
        });
    }

    renderForm();
  });
})();
