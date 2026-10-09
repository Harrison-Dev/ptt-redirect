'use strict';
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const script = readFileSync(join(__dirname, '../app/scripts/redirect.js'), 'utf8');
const canonical = 'https://www.ptt.cc/bbs/Steam/M.1783337200.A.9F3.html';

function resolve(href, { text = '', links = [] } = {}) {
  let destination = null;
  const window = { location: { href, replace(url) { destination = url; } } };
  const document = { body: { textContent: text }, querySelectorAll() { return links; } };
  vm.runInNewContext(script, { window, document, URL, Set });
  return destination;
}
test('pttweb.cc direct URL', () => {
  assert.equal(resolve('https://www.pttweb.cc/bbs/Steam/M.1783337200.A.9f3'), canonical);
});
test('historical dotted URL', () => {
  assert.equal(resolve('https://pttgame.com/Steam/M.1783337200.A.9F3.html'), canonical);
});
test('historical dashed URL', () => {
  assert.equal(resolve('https://ptthito.com/Steam/M-1783337200-A-9f3'), canonical);
});
test('MoPTT and UCPTT', () => {
  assert.equal(resolve('https://moptt.tw/p/Steam.M.1783337200.A.9F3'), canonical);
  assert.equal(resolve('https://www.ucptt.com/article/Steam/1783337200/9f3'), canonical);
});
test('webptt encoded query and unexpected targets', () => {
  assert.equal(resolve('https://webptt.com/?n=bbs%2FSteam%2FM.1783337200.A.9F3.html'), canonical);
  assert.equal(resolve('https://webptt.com/?n=https%3A%2F%2Fevil.example%2F'), null);
});
test('PTTGossip fixed board', () => {
  assert.equal(resolve('https://pttgossip.com/123/M.1783337200.A.9F3.html'),
    'https://www.ptt.cc/bbs/Gossiping/M.1783337200.A.9F3.html');
});
test('themed mirrors use PTT attribution', () => {
  assert.equal(resolve('https://pttgamer.com/Steam/1gIv3mdp', {
    text: 'Steam article -- ※ 文章網址: ' + canonical + ' ※ 編輯: user'
  }), canonical);
});
test('prefer current attribution over quoted article', () => {
  const quote = 'https://www.ptt.cc/bbs/Steam/M.1783337200.A.123.html';
  assert.equal(resolve('https://pttgamer.com/Steam/1gIv3mdp', {
    text: 'Quoted ※ 文章網址: ' + quote + '\nCurrent ※ 文章網址: ' + canonical
  }), canonical);
});
test('labelled anchor on mirror', () => {
  assert.equal(resolve('https://disp.cc/ptt/Steam', {
    links: [{ href: canonical, parentElement: { textContent: '※ 文章網址' } }]
  }), canonical);
});
test('unrelated PTT links and sites are unchanged', () => {
  assert.equal(resolve('https://pttgamer.com/Steam/random', { text: 'reference ' + canonical }), null);
  assert.equal(resolve('https://example.com/Steam/M.1783337200.A.9F3.html', { text: '文章網址: ' + canonical }), null);
});
test('rejects spoofed PTT destination and invalid article IDs', () => {
  assert.equal(resolve('https://pttgamer.com/Steam/random', {
    text: '文章網址: https://www.ptt.cc.evil.example/bbs/Steam/M.1783337200.A.9F3.html'
  }), null);
  assert.equal(resolve('https://pttweb.cc/bbs/Steam/M.1783337200.A.invalid'), null);
  assert.equal(resolve('https://pttweb.cc/bbs/../M.1783337200.A.9F3'), null);
});
test('board index and missing source stay unchanged', () => {
  assert.equal(resolve('https://pttweb.cc/bbs/Steam'), null);
  assert.equal(resolve('https://pttgamer.com/Steam/compactId'), null);
});
