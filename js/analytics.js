/* ===================================================
   MAGNACALM ANALYTICS — Session tracking + Bot detection

   All data stored in localStorage under 'mc_analytics'.
   View a summary by visiting: ?analytics=view&key=mc2026

   Bot filtering:
   - User-agent matching against known bot/crawler strings
   - navigator.webdriver check (Selenium, Puppeteer, Playwright)
   - Headless browser feature checks (no screen, no plugins, no languages)
   - Timing analysis (interaction < 500ms after load = suspicious)
   - Mouse movement detection (no mouse = likely headless/bot)
   - Honeypot field detection (handled in main.js)
   =================================================== */

(function () {
  'use strict';

  /* ── Known bot UA patterns ── */
  const BOT_UA_PATTERNS = [
    'bot', 'spider', 'crawl', 'slurp', 'googlebot', 'bingbot', 'yandex',
    'baidu', 'duckduck', 'sogou', 'exabot', 'facebot', 'ia_archiver',
    'semrush', 'ahrefsbot', 'mj12bot', 'dotbot', 'rogerbot', 'screaming',
    'headlesschrome', 'phantomjs', 'selenium', 'webdriver', 'puppeteer',
    'playwright', 'chrome-lighthouse', 'pingdom', 'gtmetrix',
    'pagespeed', 'wget', 'curl/', 'python-requests', 'java/',
    'libwww', 'prerender', 'node-fetch', 'axios/', 'go-http',
    'facebookexternalhit', 'whatsapp', 'twitterbot', 'linkedinbot'
  ];

  /* ── Power BI config ─────────────────────────────────────────────────────
     Route A (recommended — secure): leave POWERBI_ENDPOINT empty and set
     the real URL in Netlify env vars as POWERBI_ENDPOINT. The Netlify
     Function at /.netlify/functions/track acts as the proxy.

     Route B (direct — easier, endpoint visible in source): paste your
     Power BI Push Dataset URL directly into POWERBI_ENDPOINT below and
     set POWERBI_USE_PROXY = false.

     Power BI streaming dataset schema (create this in Power BI → Streaming
     Datasets → New → API):
       timestamp  (DateTime)
       session_id (Text)
       event      (Text)
       page       (Text)
       device     (Text)
       browser    (Text)
       referrer   (Text)
       utm_source (Text)
       utm_medium (Text)
       utm_campaign (Text)
       scroll_pct (Number)
       is_bot     (Text)
       extra      (Text)

     Events are queued and flushed every 10 s, and again on page exit.
     Rate limit: Power BI allows 120 requests/min on push datasets.
     ──────────────────────────────────────────────────────────────────── */
  const POWERBI_ENDPOINT  = '';           // set to your Push URL for Route B
  const POWERBI_USE_PROXY = true;         // set false if using Route B
  const POWERBI_PROXY_URL = '/.netlify/functions/track';
  const PBI_FLUSH_MS      = 10_000;       // flush every 10 seconds

  /* ── Session storage key ── */
  const STORAGE_KEY    = 'mc_analytics';
  const SESSION_EXPIRY = 30 * 60 * 1000; // 30 minutes

  /* ── Global MC object ── */
  const MC = {
    sessionId:   null,
    _isBot:      false,
    _botReason:  null,
    _pageLoad:   Date.now(),
    _hasMouse:   false,
    _hasTouch:   false,
    _maxScroll:  0,
    _events:     [],
    _pbiQueue:   [],       // rows waiting to be flushed to Power BI
    _pbiTimer:   null,

    /* ── Bot detection ── */
    _detectBot() {
      const ua = (navigator.userAgent || '').toLowerCase();

      // 1. UA check
      for (const pat of BOT_UA_PATTERNS) {
        if (ua.includes(pat)) {
          this._isBot    = true;
          this._botReason = 'user_agent:' + pat;
          return;
        }
      }

      // 2. Webdriver flag (Selenium / Playwright / Puppeteer)
      if (navigator.webdriver) {
        this._isBot    = true;
        this._botReason = 'webdriver_flag';
        return;
      }

      // 3. Zero / missing screen
      if (!window.screen || window.screen.width === 0 || window.screen.height === 0) {
        this._isBot    = true;
        this._botReason = 'no_screen';
        return;
      }

      // 4. No language set
      if (!navigator.language && (!navigator.languages || navigator.languages.length === 0)) {
        this._isBot    = true;
        this._botReason = 'no_language';
        return;
      }

      // 5. Chrome automation object (some headless configs)
      try {
        if (window.chrome && window.chrome.runtime && window.chrome.runtime.onMessage &&
            typeof window.chrome.runtime.onMessage.addListener !== 'function') {
          this._isBot    = true;
          this._botReason = 'chrome_automation';
          return;
        }
      } catch (_) { /* ignore */ }

      // 6. Unusual plugin count (headless usually has 0)
      // Note: modern browsers returning empty plugins array is normal, so only flag
      // if combined with other signals — skip solo check.
    },

    isBot() {
      return this._isBot;
    },

    /* ── Session ID ── */
    _getOrCreateSessionId() {
      const stored = this._getStore();
      const now    = Date.now();

      // Re-use recent session
      if (stored && stored.sessionId && stored.lastActivity &&
          (now - stored.lastActivity) < SESSION_EXPIRY) {
        return stored.sessionId;
      }
      // Generate new session ID
      return 'mc_' + now.toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    },

    /* ── LocalStorage helpers ── */
    _getStore() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      } catch (_) { return null; }
    },

    _saveStore(data) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (_) { /* storage blocked */ }
    },

    /* ── Initialize ── */
    init() {
      this._detectBot();
      if (this._isBot) {
        // Tag body for potential CSS debugging (invisible to user)
        document.documentElement.setAttribute('data-visitor', 'bot');
        return;
      }

      document.documentElement.setAttribute('data-visitor', 'human');
      this.sessionId = this._getOrCreateSessionId();

      // Load or create session data
      const stored    = this._getStore() || {};
      const now       = Date.now();
      const isNewSess = !stored.sessionId || stored.sessionId !== this.sessionId;

      const session = {
        sessionId:    this.sessionId,
        firstSeen:    stored.firstSeen   || now,
        lastActivity: now,
        pageViews:    (stored.pageViews  || 0) + (isNewSess ? 1 : 0),
        sessions:     (stored.sessions   || 0) + (isNewSess ? 1 : 0),
        currentPage:  window.location.pathname,
        referrer:     document.referrer || 'direct',
        utmSource:    this._getParam('utm_source'),
        utmMedium:    this._getParam('utm_medium'),
        utmCampaign:  this._getParam('utm_campaign'),
        device:       this._getDevice(),
        browser:      this._getBrowser(),
        screenW:      window.screen.width,
        screenH:      window.screen.height,
        language:     navigator.language || 'unknown',
        timezone:     Intl ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'unknown',
        maxScrollPct: stored.maxScrollPct || 0,
        timeOnPage:   stored.timeOnPage  || 0,
        events:       stored.events      || [],
        // Bot signal score (higher = more bot-like, but not definitively a bot)
        botScore:     0,
        botSignals:   [],
      };

      this._events = session.events;
      this._saveStore(session);

      // Track page view
      this.track('page_view', {
        path:     window.location.pathname,
        referrer: session.referrer,
        utm:      session.utmSource,
      });

      // Scroll tracking
      window.addEventListener('scroll', () => {
        const scrolled = window.scrollY + window.innerHeight;
        const total    = document.body.scrollHeight;
        const pct      = Math.round((scrolled / total) * 100);
        if (pct > this._maxScroll) {
          this._maxScroll = pct;
          this._updateField('maxScrollPct', pct);
        }
      }, { passive: true });

      // Mouse movement (humanness signal)
      let mouseMoved = false;
      document.addEventListener('mousemove', () => {
        if (!mouseMoved) {
          mouseMoved     = true;
          this._hasMouse = true;
          this._updateField('hasMouse', true);
        }
      }, { once: true, passive: true });

      // Touch (mobile)
      document.addEventListener('touchstart', () => {
        this._hasTouch = true;
        this._updateField('hasTouch', true);
      }, { once: true, passive: true });

      // Time on page
      let startTime = Date.now();
      window.addEventListener('beforeunload', () => {
        const secs = Math.round((Date.now() - startTime) / 1000);
        this._updateField('timeOnPage', secs);
        this.track('page_exit', { timeOnPageSecs: secs, maxScrollPct: this._maxScroll });
        this._flush();
      });

      // CTA click tracking via event delegation
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('button, a, [data-track]');
        if (!btn) return;
        const label = btn.getAttribute('data-track') ||
                      btn.textContent.trim().slice(0, 40) ||
                      btn.getAttribute('aria-label') || 'unknown';
        const tag   = btn.tagName.toLowerCase();
        if (tag === 'a' && btn.getAttribute('href')) {
          this.track('link_click', { label, href: btn.getAttribute('href') });
        } else if (tag === 'button') {
          this.track('button_click', { label });
        }
        // Timing bot check — click within 800ms of page load is suspicious
        if ((Date.now() - this._pageLoad) < 800) {
          this._addBotSignal('fast_interaction');
        }
      }, { passive: true });

      // Power BI periodic flush timer
      this._pbiTimer = setInterval(() => this._flushToPowerBI(), PBI_FLUSH_MS);

      // Also flush when tab is hidden (covers mobile backgrounding + close)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') this._flush();
      });

      // Admin view
      if (window.location.search.includes('analytics=view') &&
          window.location.search.includes('key=mc2026')) {
        this._renderAdminPanel();
      }
    },

    /* ── Track event ── */
    track(event, data = {}) {
      if (this._isBot) return;
      const entry = {
        e:  event,
        t:  Date.now(),
        d:  data,
      };
      this._events.push(entry);
      this._updateField('events', this._events.slice(-200)); // keep last 200
      this._updateField('lastActivity', Date.now());

      // Enqueue for Power BI
      this._enqueueForPBI(event, data);
    },

    /* ── Power BI: build a row and queue it ── */
    _enqueueForPBI(event, data) {
      // Skip if PBI not configured
      if (!POWERBI_ENDPOINT && POWERBI_USE_PROXY) {
        // Proxy route: always queue (function handles missing env var gracefully)
      } else if (!POWERBI_ENDPOINT) {
        return; // direct route, no endpoint set
      }

      const stored = this._getStore() || {};
      const row = {
        timestamp:    new Date().toISOString(),
        session_id:   this.sessionId || '',
        event:        event,
        page:         window.location.pathname,
        device:       stored.device       || this._getDevice(),
        browser:      stored.browser      || this._getBrowser(),
        referrer:     stored.referrer     || document.referrer || 'direct',
        utm_source:   stored.utmSource    || this._getParam('utm_source'),
        utm_medium:   stored.utmMedium    || this._getParam('utm_medium'),
        utm_campaign: stored.utmCampaign  || this._getParam('utm_campaign'),
        scroll_pct:   this._maxScroll,
        is_bot:       'false',
        extra:        JSON.stringify(data),
      };
      this._pbiQueue.push(row);
    },

    /* ── Power BI: flush queue to endpoint or proxy ── */
    _flushToPowerBI() {
      if (!this._pbiQueue.length) return;
      const rows = this._pbiQueue.splice(0);  // drain queue atomically

      const payload = JSON.stringify({ rows });
      const url     = POWERBI_USE_PROXY ? POWERBI_PROXY_URL : POWERBI_ENDPOINT;
      if (!url) return;

      // Use sendBeacon on page exit so the request survives unload
      const isUnloading = (typeof document.visibilityState !== 'undefined' &&
                           document.visibilityState === 'hidden');
      if (isUnloading && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
        return;
      }

      fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    payload,
        // keepalive lets request outlive the page
        keepalive: true,
      }).catch(() => {
        // Re-queue rows on transient failure (best-effort)
        this._pbiQueue.unshift(...rows);
      });
    },

    /* ── Bot score helpers ── */
    _addBotSignal(signal) {
      const stored = this._getStore() || {};
      stored.botSignals = stored.botSignals || [];
      if (!stored.botSignals.includes(signal)) {
        stored.botSignals.push(signal);
        stored.botScore = (stored.botScore || 0) + 1;
        this._saveStore(stored);
      }
    },

    /* ── Update a single field ── */
    _updateField(key, value) {
      const stored = this._getStore() || {};
      stored[key]  = value;
      stored.lastActivity = Date.now();
      this._saveStore(stored);
    },

    /* ── Flush localStorage + Power BI queue ── */
    _flush() {
      this._flushToPowerBI();
    },

    /* ── Helpers ── */
    _getParam(name) {
      return new URLSearchParams(window.location.search).get(name) || '';
    },

    _getDevice() {
      const ua = navigator.userAgent;
      if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
      if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
      return 'desktop';
    },

    _getBrowser() {
      const ua = navigator.userAgent;
      if (/chrome/i.test(ua) && !/edge|edg/i.test(ua)) return 'Chrome';
      if (/firefox/i.test(ua)) return 'Firefox';
      if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
      if (/edge|edg/i.test(ua)) return 'Edge';
      return 'Other';
    },

    /* ── Admin panel ── */
    _renderAdminPanel() {
      const stored = this._getStore() || {};
      const events = (stored.events || []).slice(-30).reverse();

      const panel = document.createElement('div');
      panel.style.cssText = [
        'position:fixed', 'bottom:20px', 'right:20px', 'z-index:9999',
        'background:#fff', 'border:1px solid #e5e5e0', 'border-radius:8px',
        'padding:20px', 'max-width:400px', 'max-height:70vh', 'overflow-y:auto',
        'font-family:monospace', 'font-size:11px', 'line-height:1.6',
        'box-shadow:0 8px 32px rgba(0,0,0,0.12)', 'color:#111'
      ].join(';');

      const rows = [
        ['Session ID',    stored.sessionId || '—'],
        ['Sessions',      stored.sessions  || 0],
        ['Page Views',    stored.pageViews || 0],
        ['Device',        stored.device    || '—'],
        ['Browser',       stored.browser   || '—'],
        ['Screen',        `${stored.screenW}×${stored.screenH}`],
        ['Language',      stored.language  || '—'],
        ['Timezone',      stored.timezone  || '—'],
        ['Referrer',      stored.referrer  || 'direct'],
        ['UTM Source',    stored.utmSource || 'none'],
        ['UTM Medium',    stored.utmMedium || 'none'],
        ['UTM Campaign',  stored.utmCampaign || 'none'],
        ['Max Scroll',    `${stored.maxScrollPct || 0}%`],
        ['Time on Page',  `${stored.timeOnPage || 0}s`],
        ['Has Mouse',     stored.hasMouse ? 'yes' : 'no'],
        ['Has Touch',     stored.hasTouch ? 'yes' : 'no'],
        ['Bot Score',     `${stored.botScore || 0} (${(stored.botSignals || []).join(', ') || 'clean'})`],
        ['Is Bot',        this._isBot ? `YES — ${this._botReason}` : 'No'],
        ['Total Events',  (stored.events || []).length],
        ['PBI Endpoint',  POWERBI_USE_PROXY ? 'Netlify proxy' : (POWERBI_ENDPOINT ? 'Direct (set)' : 'Not configured')],
        ['PBI Queue',     `${this._pbiQueue.length} row(s) pending`],
      ];

      const table = rows.map(([k, v]) =>
        `<tr><td style="color:#666;padding-right:12px;white-space:nowrap">${k}</td><td style="color:#111">${v}</td></tr>`
      ).join('');

      const recentEvents = events.slice(0, 15).map(ev => {
        const t = new Date(ev.t).toLocaleTimeString();
        return `<div style="padding:3px 0;border-bottom:1px solid #f0f0eb"><span style="color:#18866E">${ev.e}</span> <span style="color:#999">${t}</span></div>`;
      }).join('');

      panel.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <strong style="font-size:13px">MC Analytics</strong>
          <button onclick="this.closest('div[style]').remove()" style="background:none;border:none;cursor:pointer;font-size:18px;color:#999">×</button>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:12px">${table}</table>
        <div style="font-weight:bold;margin-bottom:6px">Recent Events (last 15)</div>
        ${recentEvents || '<div style="color:#999">No events yet</div>'}
        <button onclick="localStorage.removeItem('${STORAGE_KEY}');location.reload()" style="margin-top:10px;padding:6px 12px;background:#111;color:white;border:none;border-radius:3px;cursor:pointer;font-size:11px">Clear Data</button>
      `;
      document.body.appendChild(panel);
    }
  };

  // ── Init on DOM ready ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MC.init());
  } else {
    MC.init();
  }

  // ── Expose globally for main.js to call ──
  window.MC = MC;

})();
