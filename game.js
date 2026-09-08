const state = {
  questions: [], categories: null, site: null, selectedPool: [], current: 0, score: 0,
  categoryType: null, categoryValue: null, questionCount: null, selectedChoice: null, answered: false
};

function sampleQuestions(items, count) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

function shuffleQuestionChoices(question) {
  const originalAnswerIndex = Number(question.answerIndex);
  const indexed = question.choices.map((choice, index) => ({
    choice,
    originalIndex: index
  }));

  // Fisher-Yates shuffle:
  // 元と同じ並びになる場合も含め、純粋にランダムに並び替えます。
  for (let i = indexed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
  }

  return {
    ...question,
    choices: indexed.map(item => item.choice),
    answerIndex: indexed.findIndex(item => item.originalIndex === originalAnswerIndex)
  };
}

function escapeHTML(s='') {
  return String(s).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}

function formatCategoryName(value = '') {
  return escapeHTML(value).replace(/\r?\n/g, '<br>');
}

function categoryNamePlain(value = '') {
  return String(value).replace(/\r?\n/g, '');
}

function categoryList(type) {
  return type === 'difficulty' ? state.categories.difficulties : state.categories.genres;
}

function getCategory(type, id) {
  return categoryList(type).find(item => String(item.id) === String(id));
}


function hasAssignedValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function matchesDifficulty(question, difficultyId) {
  if (!hasAssignedValue(question.difficulty)) return false;
  return String(question.difficulty) === String(difficultyId);
}

function matchesGenre(question, genreId) {
  if (!hasAssignedValue(question.genre)) return false;
  return String(question.genre) === String(genreId);
}

function categoryCards(type) {
  return categoryList(type).map(item => `
    <button class="mode-card category-card" data-type="${escapeHTML(type)}" data-value="${escapeHTML(item.id)}">
      <strong>${formatCategoryName(item.name)}</strong>
      <small>${escapeHTML(item.description || (type === 'difficulty' ? '難易度' : 'ジャンル'))}</small>
    </button>`).join('');
}

function renderSelection() {
  const root = document.querySelector('#game-root');
  state.categoryType = null;
  state.categoryValue = null;
  state.questionCount = null;
  root.innerHTML = `
    <div class="panel">
      <span class="eyebrow">SELECT MODE</span>
      <h1>遊び方を選ぼう</h1>
      <p>問題数を選んだあと、難易度またはジャンルから1つ選んでください。該当する問題からランダムに出題します。</p>
      <div class="selection-block">
        <h2>①問題数を選ぶ</h2>
        <div class="choice-grid question-count-grid">
          ${[5,10].map(n => `<button class="mode-card count-card" data-count="${n}"><strong>${n}問で遊ぶ</strong><small>${n === 5 ? '気軽にチャレンジ' : 'じっくりチャレンジ'}</small></button>`).join('')}
        </div>
      </div>
      <div class="selection-block">
        <h2>②カテゴリーを選ぶ</h2>
        <h3>難易度で選ぶ</h3>
        <div class="choice-grid dynamic-grid">${categoryCards('difficulty')}</div>
      </div>
      <div class="selection-block">
        <h3>ジャンルで選ぶ</h3>
        <div class="choice-grid dynamic-grid">${categoryCards('genre')}</div>
      </div>
      <div class="actions"><button class="btn btn-primary" id="begin-btn" disabled>ゲームスタート</button></div>
    </div>`;

  const updateBeginButton = () => {
    document.querySelector('#begin-btn').disabled = !(state.questionCount && state.categoryType && state.categoryValue !== null);
  };

  root.querySelectorAll('.count-card').forEach(btn => {
    btn.addEventListener('click', () => {
      root.querySelectorAll('.count-card').forEach(x => x.classList.remove('selected'));
      btn.classList.add('selected');
      state.questionCount = Number(btn.dataset.count);
      updateBeginButton();
    });
  });

  root.querySelectorAll('.category-card').forEach(btn => {
    btn.addEventListener('click', () => {
      root.querySelectorAll('.category-card').forEach(x => x.classList.remove('selected'));
      btn.classList.add('selected');
      state.categoryType = btn.dataset.type;
      state.categoryValue = btn.dataset.value;
      updateBeginButton();
    });
  });
  document.querySelector('#begin-btn').addEventListener('click', startQuiz);
  scrollToPageTop();
}

function startQuiz() {
  const pool = state.questions.filter(q => {
    if (state.categoryType === 'difficulty') {
      return matchesDifficulty(q, state.categoryValue);
    }
    return matchesGenre(q, state.categoryValue);
  });

  if (pool.length < state.questionCount) {
    const category = getCategory(state.categoryType, state.categoryValue);
    alert(`「${category ? categoryNamePlain(category.name) : state.categoryValue}」の問題が${state.questionCount}問未満です。questions.jsonに問題を追加してください。`);
    return;
  }
  state.selectedPool = sampleQuestions(pool, state.questionCount).map(shuffleQuestionChoices);
  state.current = 0; state.score = 0; state.selectedChoice = null; state.answered = false;
  renderQuestion();
}

function renderQuestion() {
  const q = state.selectedPool[state.current];
  const category = getCategory(state.categoryType, state.categoryValue);
  state.selectedChoice = null; state.answered = false;
  const root = document.querySelector('#game-root');
  root.innerHTML = `
    <div class="progress">
      <div class="progress-meta"><span>${escapeHTML(category ? categoryNamePlain(category.name) : state.categoryValue)}</span><span>${state.current + 1} / ${state.questionCount}</span></div>
      <div class="progress-track"><div class="progress-bar" style="width:${((state.current)/state.questionCount)*100}%"></div></div>
    </div>
    <section class="panel">
      <div class="quiz-head"><h1>${escapeHTML(q.heading)}</h1><div class="count-badge">${state.current + 1}</div></div>
      <div class="question-text">Q. ${escapeHTML(q.question)}</div>
      <div class="options">
        ${q.choices.map((choice,i)=>`<label class="option"><input type="radio" name="choice" value="${i}"><span><strong>${i+1}.</strong> ${escapeHTML(choice)}</span></label>`).join('')}
      </div>
      <div class="hint" id="hint"><button type="button" id="hint-btn">💡 ヒントを開く</button><div class="hint-content">${escapeHTML(q.hint)}</div></div>
      <div class="actions"><button class="btn btn-primary" id="answer-btn" disabled>回答する</button></div>
      <div id="result-area"></div>
    </section>`;

  root.querySelectorAll('input[name="choice"]').forEach(input => input.addEventListener('change', e => {
    state.selectedChoice = Number(e.target.value);
    root.querySelectorAll('.option').forEach(x => x.classList.remove('selected'));
    e.target.closest('.option').classList.add('selected');
    document.querySelector('#answer-btn').disabled = false;
  }));
  document.querySelector('#hint-btn').addEventListener('click', () => {
    const hint = document.querySelector('#hint');
    hint.classList.toggle('open');
    document.querySelector('#hint-btn').textContent = hint.classList.contains('open') ? '💡 ヒントを閉じる' : '💡 ヒントを開く';
  });
  document.querySelector('#answer-btn').addEventListener('click', submitAnswer);
  scrollToPageTop();
}

function renderMoreInfo(items) {
  if (!Array.isArray(items) || items.length === 0) return '';

  const makeLink = (label, rawUrl) => {
    const urlText = String(rawUrl || '').trim();
    if (!urlText || typeof isSafeLink !== 'function' || !isSafeLink(urlText)) {
      return '';
    }

    const url = escapeHTML(urlText);
    const external = /^https?:\/\//i.test(urlText);
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a class="content-link" href="${url}"${attrs}>${escapeHTML(label || urlText)}</a>`;
  };

  const rows = items.map(item => {
    if (typeof item === 'string') {
      return `<li>${escapeHTML(item)}</li>`;
    }

    const type = item && item.type
      ? `<span class="more-info-type">${escapeHTML(item.type)}</span>`
      : '';

    const title = item && item.title ? escapeHTML(item.title) : '参考情報';
    const text = item && item.text
      ? `<div class="more-info-note">${escapeHTML(item.text)}</div>`
      : '';
    const note = item && item.note
      ? `<div class="more-info-note">${escapeHTML(item.note)}</div>`
      : '';

    // 新形式: links: [{ label, url }, ...]
    const links = Array.isArray(item && item.links)
      ? item.links
          .map(link => makeLink(link && link.label, link && link.url))
          .filter(Boolean)
      : [];

    // 旧形式: url: "https://..."
    // links がない場合だけ従来の単一URL形式を使う
    const rawUrl = item && item.url ? String(item.url).trim() : '';
    let titleHTML = title;
    let linksHTML = '';

    if (links.length > 0) {
      linksHTML = `<div class="more-info-links">${links.join(' / ')}</div>`;
    } else if (rawUrl) {
      const legacyLink = makeLink(title, rawUrl);
      if (legacyLink) titleHTML = legacyLink;
    }

    return `<li>${type}${titleHTML}${text}${note}${linksHTML}</li>`;
  }).join('');

  return `
    <section class="more-info-card">
      <h3>もっと知りたい！</h3>
      <ul class="more-info-list">${rows}</ul>
    </section>`;
}

function submitAnswer() {
  if (state.answered) return;
  state.answered = true;
  const q = state.selectedPool[state.current];
  const correct = state.selectedChoice === q.answerIndex;
  if (correct) state.score++;
  document.querySelectorAll('input[name="choice"]').forEach(x => x.disabled = true);
  document.querySelector('#answer-btn').disabled = true;

  const episode = q.episode ? `
    <div class="episode-card">
      <div class="episode-title">「わたし」のエピソードです</div>
      <div class="episode-body">
        <strong>${escapeHTML(q.episode.name)}（${escapeHTML(q.episode.field)}）</strong>
        <p>${escapeHTML(q.episode.bio)}</p>
        <div class="episode-meta">プロフィール：${escapeHTML(q.episode.asOf)}</div>
      </div>
    </div>` : '';

  const moreInfo = renderMoreInfo(q.moreInfo);

  const area = document.querySelector('#result-area');
  area.innerHTML = `
    <div class="feedback ${correct ? 'correct':'incorrect'}">${correct ? '正解！' : '不正解'}　現在 ${state.score} / ${state.current + 1} 点</div>
    <div class="answer-panel">
      <h3>答え</h3><p>${q.answerIndex + 1}. ${escapeHTML(q.choices[q.answerIndex])}</p>
      <h3>解説</h3><p>${escapeHTML(q.explanation)}</p>
      ${episode}
      ${moreInfo}
    </div>
    <div class="actions"><button class="btn btn-primary" id="next-btn">${state.current === state.questionCount - 1 ? 'スコアを見る' : '次の問題へ'}</button></div>`;
  document.querySelector('#next-btn').addEventListener('click', () => {
    if (state.current === state.questionCount - 1) renderScore();
    else { state.current++; renderQuestion(); }
  });
}

function renderSurveyCTA() {
  const survey = state.site && state.site.survey;
  if (!survey) return '';

  const url = String(survey.url || '').trim();
  const validUrl = url && typeof isSafeLink === 'function' && isSafeLink(url);
  const button = validUrl
    ? `<a class="btn btn-primary survey-button" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(survey.buttonLabel || '感想・アンケートに回答する')}</a>`
    : `<button class="btn btn-primary survey-button" type="button" disabled>${escapeHTML(survey.buttonLabel || '感想・アンケートに回答する')}</button>`;

  return `
    <section class="survey-cta">
      <strong>${typeof formatRichText === 'function' ? formatRichText(survey.title || 'Science Livesを遊んでいただきありがとうございました！') : escapeHTML(survey.title || 'Science Livesを遊んでいただきありがとうございました！')}</strong>
      <p>${typeof formatRichText === 'function' ? formatRichText(survey.message || 'よろしければ感想をお聞かせください。') : escapeHTML(survey.message || 'よろしければ感想をお聞かせください。')}</p>
      ${button}
    </section>`;
}

function renderScore() {
  const root = document.querySelector('#game-root');
  const full = state.score === state.questionCount;
  root.innerHTML = `
    <section class="panel center">
      <span class="eyebrow">RESULT</span>
      <h1>クイズ終了！</h1>
      <div class="score-ring">${state.score}/${state.questionCount}</div>
      <p>${full ? '満点です！賞状を保存・印刷できます。' : 'おつかれさまでした。解説を思い出しながら、ぜひもう一度挑戦してみてください。'}</p>
      <div class="actions result-actions" style="justify-content:center">
        ${full ? '<button class="btn btn-primary" id="download-cert">賞状をダウンロード</button><button class="btn btn-secondary" id="print-cert">賞状を印刷</button>' : ''}
      </div>
      <div class="actions result-nav-actions" style="justify-content:center">
        <a class="btn btn-secondary" href="index.html">トップページに戻る</a>
        <button class="btn btn-soft" id="again-btn">もう一度遊ぶ</button>
      </div>
      ${renderSurveyCTA()}
    </section>`;
  document.querySelector('#again-btn').addEventListener('click', renderSelection);
  if (full) {
    document.querySelector('#download-cert').addEventListener('click', downloadCertificate);
    document.querySelector('#print-cert').addEventListener('click', printCertificate);
  }
  scrollToPageTop();
}

function certificateData() {
  const category = getCategory(state.categoryType, state.categoryValue);
  if (category && category.certificate) return category.certificate;
  const name = category ? categoryNamePlain(category.name) : state.categoryValue;
  return {
    title: `${name} 認定証`,
    message: `Science Lives「${name}」を全問正解しました。\n素晴らしいチャレンジをここに称えます。`
  };
}

function drawCertificate(canvas) {
  const c = canvas.getContext('2d');
  const cert = certificateData();
  canvas.width = 1600; canvas.height = 1100;
  c.fillStyle = '#fffdf8'; c.fillRect(0,0,1600,1100);
  c.strokeStyle = '#006b7f'; c.lineWidth = 18; c.strokeRect(45,45,1510,1010);
  c.strokeStyle = '#4f9f70'; c.lineWidth = 4; c.strokeRect(72,72,1456,956);
  c.fillStyle = '#f4d65f'; c.beginPath(); c.arc(1350,190,115,0,Math.PI*2); c.fill();
  c.fillStyle = '#dff3ea'; c.beginPath(); c.arc(235,915,140,0,Math.PI*2); c.fill();
  c.fillStyle = '#112b33'; c.textAlign = 'center';
  c.font = '700 48px sans-serif'; c.fillText('Science Lives', 800, 190);
  c.fillStyle = '#006b7f'; c.font = '900 76px sans-serif'; c.fillText(cert.title, 800, 350);
  c.fillStyle = '#112b33'; c.font = '500 34px sans-serif';
  const lines = wrapText(c, cert.message, 1080);
  lines.forEach((line, i) => c.fillText(line, 800, 500 + i*58));
  c.font = '700 30px sans-serif'; c.fillText(`SCORE ${state.questionCount} / ${state.questionCount}`, 800, 760);
  c.font = '500 26px sans-serif'; c.fillText(new Date().toLocaleDateString('ja-JP'), 800, 850);
  c.font = '900 32px sans-serif'; c.fillStyle = '#006b7f'; c.fillText('SCIENCE LIVES QUIZ', 800, 965);
}

function wrapText(ctx, text, maxWidth) {
  const lines = [];
  String(text).split('\n').forEach(paragraph => {
    const chars = [...paragraph];
    let line = '';
    for (const ch of chars) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = ch; }
      else line = test;
    }
    if (line) lines.push(line);
  });
  return lines;
}

function downloadCertificate() {
  const canvas = document.createElement('canvas');
  drawCertificate(canvas);
  const a = document.createElement('a');
  a.download = `science-lives-certificate-${state.categoryType}-${state.categoryValue}.png`;
  a.href = canvas.toDataURL('image/png');
  a.click();
}

function printCertificate() {
  const canvas = document.createElement('canvas');
  drawCertificate(canvas);
  const data = canvas.toDataURL('image/png');
  const win = window.open('', '_blank');
  win.document.write(`<html><head><title>Science Lives 賞状</title><style>body{margin:0;display:grid;place-items:center}img{max-width:100%;height:auto}@media print{img{width:100%}}</style></head><body><img src="${data}" onload="window.print()"></body></html>`);
  win.document.close();
}

function validateCategories() {
  if (!state.categories || !Array.isArray(state.categories.difficulties) || !Array.isArray(state.categories.genres)) {
    throw new Error('categories.json の形式が正しくありません。');
  }
  for (const [label, items] of [['difficulties', state.categories.difficulties], ['genres', state.categories.genres]]) {
    const ids = items.map(item => String(item.id));
    if (ids.some(id => !id) || new Set(ids).size !== ids.length) {
      throw new Error(`categories.json の ${label} に空または重複した id があります。`);
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    [state.questions, state.categories, state.site] = await Promise.all([
      loadJSON('data/questions.json'),
      loadJSON('data/categories.json'),
      loadJSON('data/site.json')
    ]);
    validateCategories();
    renderSelection();
  } catch (e) { showLoadError(e); }
});
