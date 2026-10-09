/* global window, document */
(() => {
  'use strict';

  // Runs locally on matched mirror pages. No background script or network API.
  const page = new URL(window.location.href);
  const host = page.hostname.toLowerCase().replace(/^www\./, '');
  const articleId = /^M\.\d{10}\.A\.[0-9a-f]{3}$/i;
  const boardName = /^[a-z0-9_-]+$/i;

  const dottedHosts = new Set([
    '94ptt.com', 'ptt.av01.online', 'ptt.social', 'ptt.techroomage.com',
    'pttent.com', 'pttgame.com', 'pttlocal.com', 'pttman.com',
    'pttsport.com', 'sexptt.tk', 'webptt.xyz', 'pttdata.com'
  ]);
  const dashedHosts = new Set(['pttweb.tw', 'pttread.com', 'ptthito.com']);
  const themedHosts = new Set([
    'pttgamer.com', 'pttcomics.com', 'pttconsumer.com', 'pttsports.com',
    'pttcareers.com', 'pttstudios.com', 'pttdigits.com',
    'pttsuperstar.com', 'pttboygirl.com', 'pttfoodtravel.com',
    'ptttaiwan.com'
  ]);
  const metadataHosts = new Set([
    'disp.cc', 'btrend.amassly.com', 'ptt.jimpop.org', 'laiptt.online'
  ]);
  const specialHosts = new Set([
    'pttweb.cc', 'moptt.tw', 'webptt.com', 'ucptt.com', 'pttgossip.com'
  ]);

  // Never navigate to a non-PTT address sourced from a mirror's DOM.
  function articleUrl(board, id) {
    if (!boardName.test(board) || !articleId.test(id)) return null;
    return 'https://www.ptt.cc/bbs/' + board + '/' + id.toUpperCase() + '.html';
  }

  function safeSourceUrl(value) {
    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol)) return null;
      if (!['ptt.cc', 'www.ptt.cc'].includes(url.hostname.toLowerCase())) return null;
      const match = url.pathname.match(/^\/bbs\/([^/]+)\/(M\.\d{10}\.A\.[0-9a-f]{3})\.html$/i);
      return match ? articleUrl(match[1], match[2]) : null;
    } catch {
      return null;
    }
  }

  function fromUrl() {
    let match;
    if (host === 'pttweb.cc') {
      match = page.pathname.match(/^\/bbs\/([^/]+)\/(M\.\d{10}\.A\.[0-9a-f]{3})(?:\.html)?\/?$/i);
      return match ? articleUrl(match[1], match[2]) : null;
    }
    if (dottedHosts.has(host)) {
      match = page.pathname.match(/^\/([^/]+)\/(M\.\d{10}\.A\.[0-9a-f]{3})(?:\.html)?\/?$/i);
      return match ? articleUrl(match[1], match[2]) : null;
    }
    if (dashedHosts.has(host)) {
      match = page.pathname.match(/^\/([^/]+)\/(M-\d{10}-A-[0-9a-f]{3})(?:\.html)?\/?$/i);
      return match ? articleUrl(match[1], match[2].replace(/-/g, '.')) : null;
    }
    if (host === 'moptt.tw') {
      match = page.pathname.match(/^\/p\/([^/.]+)\.(M\.\d{10}\.A\.[0-9a-f]{3})(?:\.html)?\/?$/i);
      return match ? articleUrl(match[1], match[2]) : null;
    }
    if (host === 'ucptt.com') {
      match = page.pathname.match(/^\/article\/([^/]+)\/(\d{10})\/([0-9a-f]{3})\/?$/i);
      return match ? articleUrl(match[1], 'M.' + match[2] + '.A.' + match[3]) : null;
    }
    if (host === 'pttgossip.com') {
      match = page.pathname.match(/\/(M\.\d{10}\.A\.[0-9a-f]{3})\.html\/?$/i);
      return match ? articleUrl('Gossiping', match[1]) : null;
    }
    if (host === 'webptt.com') {
      const n = page.searchParams.get('n');
      return n ? safeSourceUrl(new URL(n.replace(/^\/+/, ''), 'https://www.ptt.cc/').href) : null;
    }
    return null;
  }

  function fromPage() {
    // PTT's attribution footer often survives on mirrors with opaque IDs.
    const text = document.body?.textContent || '';
    let attributedUrl = null;
    // Prefer the final footer when the page quotes an earlier PTT post.
    for (const match of text.matchAll(/文章網址\s*[:：]?\s*(https?:\/\/[^\s<>"']+)/gi)) {
      attributedUrl = safeSourceUrl(match[1]) || attributedUrl;
    }
    if (attributedUrl) return attributedUrl;

    // Some sites make the source URL a link without showing its text.
    for (const link of document.querySelectorAll('a[href*="ptt.cc/bbs/"]')) {
      const context = link.parentElement?.textContent?.slice(0, 200) || '';
      if (/文章網址|原文網址|原始網址/i.test(context)) {
        const url = safeSourceUrl(link.href);
        if (url) return url;
      }
    }
    return null;
  }

  if (![dottedHosts, dashedHosts, themedHosts, metadataHosts, specialHosts].some(set => set.has(host))) return;
  const target = fromUrl() || fromPage();
  if (target && target !== page.href) window.location.replace(target);
})();
