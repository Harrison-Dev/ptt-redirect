# PTT Redirect (Unofficial)

A tiny, **automatic** redirector from PTT mirror articles back to original posts on [ptt.cc](https://www.ptt.cc/). Native **Chrome Manifest V3**, zero runtime dependencies.

- **No backend, no additional network requests, no analytics, no build step.**
- No `permissions` or background service worker; the content script only runs on the explicitly listed mirror sites.
- Redirects only to validated canonical `https://www.ptt.cc/bbs/<board>/M.<timestamp>.A.<id>.html` article URLs.
- Uses `location.replace()` to avoid leaving the mirror page in Back history. Unknown pages stay unchanged.

## Install (Chrome / Edge)

1. Download and unzip this repository (or clone it).
2. Open `chrome://extensions` (Edge: `edge://extensions`) and enable **Developer mode**.
3. Select **Load unpacked** and choose the **`app/` folder** containing `manifest.json`.
4. Navigate to a supported mirror article; it redirects automatically if its original URL can be found.

To update, pull/re-download and press **Reload** on the extension card.

## How it works

`app/scripts/redirect.js` first reconstructs original post URLs from known mirror URL layouts. On sites with opaque IDs (such as `pttgamer.com`), it reads the page's **文章網址** attribution or a labelled PTT anchor. No API calls, server, cookies or external libraries are required.

Destination host, board name and PTT article ID are strictly validated. If no valid original is found, the extension leaves the page alone. Historical domains are best-effort and may have gone offline; deleted originals or age gates may still produce PTT errors.

The match list is in `app/manifest.json`. The extension uses no remotely hosted code.

## Tests

Node.js 20+ is used **only for tests** (not required to install/run the extension):

```sh
node --test tests/*.test.cjs
```

To publish, ZIP the **contents of `app/`**, not the repository root.

## Privacy and attribution

Browsing data is not collected, stored, or transmitted to an extension backend. The script reads only the loaded mirror page, as needed to identify the PTT source. This is an **unofficial** community extension not affiliated with PTT.

Based on [yurenju/ptt-redirect](https://github.com/yurenju/ptt-redirect), licensed MIT. Original `LICENSE` is retained.
