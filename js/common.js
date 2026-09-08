async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function escapeHTML(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function isSafeLink(url) {
  const value = String(url || '').trim();
  return /^(https?:\/\/|mailto:)/i.test(value) || /^(\.\.?\/|\/|#)/.test(value);
}

// JSON本文で [表示文字](URL) と書くとリンクとして表示します。
// 例: 詳細は[JAAS公式サイト](https://jaas.science/)をご覧ください。
// 改行は JSON 内の \n をそのまま反映します。
function formatRichText(value = '') {
  const text = String(value);
  const linkPattern = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;
  let html = '';
  let lastIndex = 0;
  let match;

  while ((match = linkPattern.exec(text)) !== null) {
    html += escapeHTML(text.slice(lastIndex, match.index));

    const label = escapeHTML(match[1]);
    const rawUrl = match[2].trim();
    if (isSafeLink(rawUrl)) {
      const url = escapeHTML(rawUrl);
      const external = /^https?:\/\//i.test(rawUrl);
      const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
      html += `<a class="content-link" href="${url}"${attrs}>${label}</a>`;
    } else {
      html += escapeHTML(match[0]);
    }

    lastIndex = linkPattern.lastIndex;
  }

  html += escapeHTML(text.slice(lastIndex));
  return html.replace(/\n/g, '<br>');
}

// SPA風に画面内容を差し替えたとき、スマホでも確実にページ先頭へ戻します。
// DOM更新直後はSafariなどでスクロールが反映されないことがあるため、
// 描画後と少し遅れてからの2段階で位置をリセットします。
function scrollToPageTop() {
  const reset = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(reset);
  });

  setTimeout(reset, 120);
}

function setActiveNav() {
  const file = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-tabs a').forEach(a => {
    if (a.getAttribute('href') === file) a.classList.add('active');
  });
}

function renderStaticPage(key) {
  loadJSON('data/site.json').then(data => {
    const page = data[key];
    document.querySelector('[data-page-title]').textContent = page.title;
    const target = document.querySelector('[data-page-content]');
    if (page.sections) {
      target.innerHTML = page.sections.map(s => {
        const bullets = Array.isArray(s.bullets) && s.bullets.length
          ? `<ul class="content-bullets">${s.bullets.map(item => `<li>${formatRichText(item)}</li>`).join('')}</ul>`
          : '';
        const button = s.button && s.button.url && isSafeLink(s.button.url)
          ? `<p class="content-action"><a class="btn btn-primary" href="${escapeHTML(s.button.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(s.button.label || '詳しく見る')}</a></p>`
          : '';
        return `
        <section class="prose-card">
          <h2>${escapeHTML(s.heading)}</h2>
          ${s.body ? `<div class="rich-text">${formatRichText(s.body)}</div>` : ''}
          ${bullets}
          ${button}
        </section>`;
      }).join('');
    }
    if (page.items) {
      target.innerHTML = `<section class="prose-card">${page.items.map(item => `
        <article class="news-item">
          <time datetime="${escapeHTML(item.date)}">${escapeHTML(item.date)}</time>
          <h2>${escapeHTML(item.title)}</h2>
          <div class="rich-text">${formatRichText(item.body)}</div>
        </article>`).join('')}</section>`;
    }
  }).catch(showLoadError);
}

function showLoadError(err) {
  console.error(err);
  const main = document.querySelector('main');
  if (main) main.innerHTML = `<div class="content-shell"><div class="prose-card"><h1>データを読み込めませんでした</h1><p>ローカルで確認する場合は、簡易Webサーバー経由で開いてください。</p></div></div>`;
}

document.addEventListener('DOMContentLoaded', setActiveNav);
