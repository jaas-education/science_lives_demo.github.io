document.addEventListener('DOMContentLoaded', async () => {
  try {
    const { home } = await loadJSON('data/site.json');
    document.querySelector('[data-home-eyebrow]').innerHTML = formatRichText(home.eyebrow);
    document.querySelector('[data-home-title]').innerHTML = `${home.titleTop}<span>${home.titleBottom}</span>`;
    document.querySelector('[data-home-lead]').innerHTML = formatRichText(home.lead);
    document.querySelector('[data-home-start]').textContent = home.startLabel;
    document.querySelector('[data-home-cards]').innerHTML = home.cards.map(c => `
      <article class="info-card"><h3>${escapeHTML(c.title)}</h3><p>${formatRichText(c.text)}</p></article>
    `).join('');
  } catch (e) { showLoadError(e); }
});
