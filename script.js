// =========================
// Utilities
// =========================
const $$ = (sel, ctx = document) => ctx.querySelector(sel);
const $$$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const fmt = (n) => Number(n).toFixed(2);

// =========================
// Demo Data
// =========================
const MATCHES = [
  { id: 'f1', sport: 'Football', comp: 'Premier Cup', time: 'Today 19:00', teams: ['Arsenal', 'Chelsea'], odds: { '1': 1.85, 'X': 3.50, '2': 4.20 } },
  { id: 'f2', sport: 'Football', comp: 'Premier Cup', time: 'Today 21:00', teams: ['Liverpool', 'Man City'], odds: { '1': 2.10, 'X': 3.20, '2': 3.00 } },
  { id: 't1', sport: 'Tennis', comp: 'ATP 500', time: 'Today 15:00', teams: ['Medvedev', 'Zverev'], odds: { '1': 1.70, '2': 2.10 } },
  { id: 't2', sport: 'Tennis', comp: 'WTA 1000', time: 'Today 17:00', teams: ['Swiatek', 'Sabalenka'], odds: { '1': 1.90, '2': 1.80 } },
  { id: 'b1', sport: 'Basketball', comp: 'NBA', time: 'Today 20:00', teams: ['Lakers', 'Clippers'], odds: { '1': 1.50, '2': 'abc' } },
  { id: 'b2', sport: 'Basketball', comp: 'NBA', time: 'Tomorrow 19:30', teams: ['Warriors', 'Celtics'], odds: { '1': 1.80, '2': 2.00 } },
];

const TRENDING = [
  { label: 'England Premier League', icon: '#icon-ball' },
  { label: 'UEFA Champions League', icon: '#icon-ball' },
  { label: 'UEFA League Europe', icon: '#icon-ball' },
  { label: 'NBA', icon: '#icon-basket' },
  { label: 'NFL', icon: '#icon-ball' },
  { label: 'MLB', icon: '#icon-ball' },
  { label: 'Rolland Garros', icon: '#icon-tennis' },
  { label: 'Wimbeldon', icon: '#icon-tennis' },
  { label: 'US Open', icon: '#icon-tennis' },
];

// =========================
// State (with persistence)
// =========================
const SLIP_KEY = 'mbets-slip-v1';
let slip = JSON.parse(localStorage.getItem(SLIP_KEY) || '[]');
function saveSlip() { localStorage.setItem(SLIP_KEY, JSON.stringify(slip)); }

// =========================
/* Rendering */
// =========================
function renderTrending() {
  const list = $$('#trendingList');
  const shuffled = TRENDING.slice().sort(() => Math.random() - 0.5);
  list.innerHTML = shuffled.map(item => (
    `<li class="side-item"><svg class="icon" width="18" height="18"><use href="${item.icon}"/></svg>${item.label}</li>`
  )).join('');
}

function displayName(sport, outcome, teams) {
  if (sport === 'Football') {
    if (outcome === '1') return `${teams[0]} Win`;
    if (outcome === 'X') return 'Draw';
    if (outcome === '2') return `${teams[1]} Win`;
  }
  if (outcome === '1') return `${teams[0]} Win`;
  if (outcome === '2') return `${teams[1]} Win`;
  return outcome;
}

function renderCards() {
  const wrap = $$('#cards');
  wrap.innerHTML = '';
  MATCHES.forEach(m => {
    const odds = Object.entries(m.odds).map(([k, v]) => (
      `<button class="odd-btn" data-match="${m.id}" data-outcome="${k}" data-odd="${v}">
         <span class="lbl">${displayName(m.sport, k, m.teams)}</span>
         <span class="val">${fmt(v)}</span>
       </button>`
    )).join('');

    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="match-head">
        <span>${m.comp} • ${m.sport}</span>
        <span>${m.time}</span>
      </div>
      <div class="teams">${m.teams[0]} vs ${m.teams[1]}</div>
      <div class="market-row">${odds}</div>
    `;
    wrap.appendChild(card);
  });

  updateOddSelections();
}

function updateOddSelections() {
  $$$('.odd-btn').forEach(b => b.classList.remove('selected'));
  slip.forEach(s => {
    const btn = $$(`.odd-btn[data-match="${s.matchId}"][data-outcome="${s.outcome}"]`);
    if (btn) btn.classList.add('selected');
  });
}

function renderSlip() {
  const empty = $$('#slipEmpty');
  const list = $$('#slipList');
  list.innerHTML = '';

  if (!slip.length) {
    empty.removeAttribute('hidden');
    list.setAttribute('hidden', 'true');
  } else {
    empty.setAttribute('hidden', 'true');
    list.removeAttribute('hidden');
    slip.forEach(item => {
      const el = document.createElement('div');
      el.className = 'slip-item';
      el.innerHTML = `
        <div class="meta">
          <div class="teams">${item.teams[0]} vs ${item.teams[1]}</div>
          <div class="market">${item.market}</div>
        </div>
        <div class="odds">${fmt(item.odd)}</div>
        <button class="remove" aria-label="Remove" data-remove="${item.matchId}">×</button>
      `;
      list.appendChild(el);
    });
  }

  const stake = Number($$('#stake').value) || 0;
  const total = slip.reduce((acc, b) => acc * Number(b.odd), 1) || 1;
  $$('#totalOdds').textContent = fmt(total);
  $$('#payout').textContent = fmt(stake * total);
  $$('#place').disabled = !(slip.length && stake > 0);
}

// =========================
// Interactions
// =========================
document.addEventListener('click', (e) => {
  const oddBtn = e.target.closest('.odd-btn');
  if (oddBtn) {
    const matchId = oddBtn.dataset.match;
    const outcome = oddBtn.dataset.outcome;
    const odd = Number(oddBtn.dataset.odd);
    const match = MATCHES.find(m => m.id === matchId);
    const market = displayName(match.sport, outcome, match.teams);

    const idx = slip.findIndex(b => b.matchId === matchId);
    if (idx > -1 && slip[idx].outcome === outcome) {
      slip.splice(idx, 1);
    } else if (idx > -1) {
      slip[idx] = { matchId, teams: match.teams, outcome, odd, market };
    } else {
      slip.push({ matchId, teams: match.teams, outcome, odd, market });
    }
    saveSlip();
    updateOddSelections();
    renderSlip();
    return;
  }

  const removeBtn = e.target.closest('[data-remove]');
  if (removeBtn) {
    const id = removeBtn.dataset.remove;
    slip = slip.filter(s => s.matchId !== id);
    saveSlip();
    updateOddSelections();
    renderSlip();
    return;
  }

  if (e.target.id === 'mClose' || e.target.closest('#mClose') || e.target.id === 'modal') {
    closeModal();
  }
});

// Stake input
$$('#stake').addEventListener('input', renderSlip);

// Place bet (modal)
$$('#place').addEventListener('click', () => {
  if (!slip.length) return;
  const stake = Number($$('#stake').value) || 0;
  if (stake <= 0) return;

  const total = slip.reduce((acc, b) => acc * Number(b.odd), 1) || 1;
  const list = slip.map(b => `<li>${b.teams[0]} vs ${b.teams[1]} — <strong>${b.market}</strong> @ ${fmt(b.odd)}</li>`).join('');
  showModal('Bet Confirmation', `
    <p>Stake: <strong>${fmt(stake)}</strong></p>
    <p>Total Odds: <strong>${fmt(total)}</strong></p>
    <p>Potential Payout: <strong>${fmt(stake * total)}</strong></p>
    <ul>${list}</ul>
  `);
  // To clear the slip after placing, uncomment:
  // slip = []; saveSlip(); updateOddSelections(); renderSlip();
});

// Theme toggle (kept as-is)
const themeBtn = $$('#themeToggle');
const THEME_KEY = 'mbets-theme';
const savedTheme = localStorage.getItem(THEME_KEY);
if (savedTheme === 'light') document.documentElement.style.filter = 'invert(1) hue-rotate(180deg)';
themeBtn.addEventListener('click', () => {
  const inverted = document.documentElement.style.filter.includes('invert');
  if (inverted) {
    document.documentElement.style.filter = '';
    themeBtn.innerHTML = '<svg width="18" height="18"><use href="#icon-moon"/></svg>';
    localStorage.setItem(THEME_KEY, 'light'); // (note: this saves the inverse)
  } else {
    document.documentElement.style.filter = 'invert(1) hue-rotate(180deg)';
    themeBtn.innerHTML = '<svg width="18" height="18"><use href="#icon-sun"/></svg>';
    localStorage.setItem(THEME_KEY, 'dark');  // (note: this saves the inverse)
  }
});

// Modal helpers
function showModal(title, html) {
  $$('#mTitle').textContent = title;
  $$('#mBody').innerHTML = html;
  $$('#modal').classList.add('open');
  $$('#modal').setAttribute('aria-hidden', 'false');
}
function closeModal() {
  $$('#modal').classList.remove('open');
  $$('#modal').setAttribute('aria-hidden', 'true');
}

// --- DOB limits: 18+ only ---
(() => {
  const dob = document.getElementById('suDob');
  if (!dob) return;
  const today = new Date();
  const max = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate()).toISOString().slice(0, 10);
  dob.max = max;
  dob.min = '1900-01-01';
})();

// ==== RECENT BETS — build panel, record on Place Bet (document-capture), render list ====
(function recentBetsInit() {
  const KEY = 'mbets-placed-v1';
  const fmt2 = (n) => Number(n).toFixed(2);

  // Build panel under TRENDING
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) { console.warn('[Recent] .sidebar not found'); return; }
  const anchor = document.getElementById('trendingList')?.parentElement || sidebar;
  let panel = document.getElementById('recentPanel');
  if (!panel) {
    panel = document.createElement('section');
    panel.id = 'recentPanel';
    panel.style.marginTop = '18px';
    panel.innerHTML = `
      <div class="side-sub">RECENT BETS</div>
      <ul id="recentList" class="side-list" style="margin-top:6px;"></ul>
      <button id="clearRecent" class="btn btn-login" style="width:100%;margin-top:8px;padding:8px 10px;">
        Clear
      </button>
    `;
    anchor.appendChild(panel);
  }

  const listEl  = panel.querySelector('#recentList');
  const clearEl = panel.querySelector('#clearRecent');

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
  const save = (arr) => localStorage.setItem(KEY, JSON.stringify(arr.slice(-5))); // keep last 5

  function renderRecent() {
    const arr = load();
    if (!arr.length) {
      listEl.innerHTML = `<li class="side-item muted">No bets placed yet.</li>`;
      return;
    }
    listEl.innerHTML = arr.slice().reverse().map(p => `
      <li class="side-item" style="align-items:flex-start;">
        <div style="display:flex;flex-direction:column;gap:2px;width:100%;">
          <div style="display:flex;justify-content:space-between;width:100%;">
            <strong>${p.time}</strong>
            <span class="pill" style="border-color:var(--divider);">${fmt2(p.total)}</span>
          </div>
          <div class="muted" style="font-size:12px;">
            ${p.count} sel • Stake ${fmt2(p.stake)} • Payout ${fmt2(p.payout)}
          </div>
        </div>
      </li>
    `).join('');
  }
  window.renderRecent = renderRecent;

  clearEl.addEventListener('click', () => { localStorage.removeItem(KEY); renderRecent(); });

  // Record on Place Bet (document-capture so no other listener can block it)
  document.addEventListener('click', (ev) => {
    const isPlace = ev.target.closest('#place');
    if (!isPlace) return;

    const stake = Number(document.getElementById('stake').value) || 0;
    if (!window.slip?.length || stake <= 0) return;

    const total  = window.slip.reduce((a, b) => a * Number(b.odd), 1) || 1;
    const payout = stake * total;
    const when   = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const data  = load();
    const rec   = { time: when, count: window.slip.length, stake, total, payout };

    const last = data[data.length - 1];
    const same = last
      && last.count === rec.count
      && fmt2(last.stake)  === fmt2(rec.stake)
      && fmt2(last.total)  === fmt2(rec.total)
      && fmt2(last.payout) === fmt2(rec.payout);

    if (!same) {
      data.push(rec);
      save(data);
      renderRecent();
      console.log('[Recent] recorded', rec);
    }
  }, true);

  renderRecent();
  console.log('[Recent] ready');
})();

// ===== Auth Modals and Nav toggle =====
const navToggleBtn = $$('#navToggle');
const navBackdrop = $$('#navBackdrop');
if (navToggleBtn && navBackdrop) {
  navToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('nav-open');
    navBackdrop.hidden = !document.body.classList.contains('nav-open');
  });
  navBackdrop.addEventListener('click', () => {
    document.body.classList.remove('nav-open');
    navBackdrop.hidden = true;
  });
}

const openLoginBtn = $$('#openLogin');
const openSignupBtn = $$('#openSignup');
const loginModal = $$('#loginModal');
const signupModal = $$('#signupModal');

function openAuth(el){ if (el){ el.classList.add('open'); el.setAttribute('aria-hidden','false'); } }
function closeAuth(el){ if (el){ el.classList.remove('open'); el.setAttribute('aria-hidden','true'); } }

openLoginBtn && openLoginBtn.addEventListener('click', ()=> openAuth(loginModal));
openSignupBtn && openSignupBtn.addEventListener('click', ()=> openAuth(signupModal));

document.addEventListener('click', (e) => {
  const closeAttr = e.target.getAttribute && e.target.getAttribute('data-close');
  if (closeAttr){
    const el = document.getElementById(closeAttr);
    closeAuth(el);
  }
  if (e.target === loginModal) closeAuth(loginModal);
  if (e.target === signupModal) closeAuth(signupModal);
});

// Remember email support
const remembered = localStorage.getItem('rememberEmail') || '';
const loginEmail = $$('#loginEmail'); const suEmail = $$('#suEmail');
if (remembered) { if (loginEmail) loginEmail.value = remembered; if (suEmail) suEmail.value = remembered; }

// Login submit
const loginFormEl = $$('#loginForm');
loginFormEl && loginFormEl.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = $$('#loginEmail').value.trim();
  const pwd = $$('#loginPassword').value;
  const remember = $$('#loginRemember').checked;
  if (!email || !email.includes('@') || pwd.length < 6) {
    showModal('Login Error', '<p>Please enter a valid email and a password with at least 6 characters.</p>');
    return;
  }
  if (remember) localStorage.setItem('rememberEmail', email);

  closeAuth(loginModal);
  showModal('Logged In', `<p>Welcome back, <strong>${email}</strong>.</p>`);
});

// Sign up submit (with validation + DOB 18+)
const signupFormEl = $$('#signupForm');

function calcAge(isoDateStr) {
  const d = new Date(isoDateStr);
  if (isNaN(d)) return NaN;
  const t = new Date();
  let age = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) age--;
  return age;
}

signupFormEl && signupFormEl.addEventListener('submit', (e) => {
  e.preventDefault();

  const first   = ($$('#suFirst')?.value || '').trim();
  const last    = ($$('#suLast')?.value  || '').trim();
  const dobStr  = ($$('#suDob')?.value   || '').trim();
  const email   = ($$('#suEmail')?.value || '').trim();
  const pwd     = ($$('#suPassword')?.value || '');
  const confirm = ($$('#suConfirm')?.value  || '');
  const remember= !!($$('#suRemember')?.checked);
  const terms   = !!($$('#suTerms')?.checked);

  const errors = [];
  const nameRe = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,}$/;
  if (!nameRe.test(first)) errors.push('First name must be at least 2 letters.');
  if (!nameRe.test(last))  errors.push('Last name must be at least 2 letters.');

  if (!dobStr) {
    errors.push('Birth date is required.');
  } else {
    const age = calcAge(dobStr);
    if (isNaN(age)) errors.push('Invalid birth date.');
    else if (age < 18) errors.push('You must be at least 18 years old.');
  }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) errors.push('Enter a valid email address.');

  if (pwd.length < 8) errors.push('Password must be at least 8 characters.');
  if (pwd !== confirm) errors.push('Passwords do not match.');

  if (!terms) errors.push('You must accept the Terms & Conditions.');

  if (errors.length) {
    showModal('Sign Up Error', `<ul>${errors.map(e => `<li>${e}</li>`).join('')}</ul>`);
    return;
  }

  if (remember) localStorage.setItem('rememberEmail', email);
  else localStorage.removeItem('rememberEmail');

  closeAuth($$('#signupModal'));
  showModal(
    'Account Created',
    `<p>Welcome, <strong>${first} ${last}</strong>. Your account for <strong>${email}</strong> is set.</p>`
  );
});

// Forgot password + Social demo handlers (hooks up to your existing HTML)
(() => {
  const form = document.querySelector('#loginForm');
  if (!form) return;

  const forgot = document.querySelector('#forgotLink');
  forgot?.addEventListener('click', (e) => {
    e.preventDefault();
    const html = `
      <form id="resetForm" class="auth-form">
        <label>
          <span>Email</span>
          <input type="email" id="resetEmail" class="input" required />
        </label>
        <button class="btn btn-join place" type="submit">Send reset link</button>
      </form>
    `;
    showModal('Reset password', html);

    const modal = document.querySelector('#modal');
    const handler = (ev) => {
      if (ev.target && ev.target.id === 'resetForm') {
        ev.preventDefault();
        const email = document.querySelector('#resetEmail').value.trim();
        if (!email || !email.includes('@')) return;
        showModal('Email sent', `<p>We’ve sent a reset link to <strong>${email}</strong> (demo).</p>`);
        modal.removeEventListener('submit', handler, true);
      }
    };
    modal.addEventListener('submit', handler, true);
  });

  const demo = (p) => showModal(`${p} Login`, `<p>This is a demo. No real ${p} OAuth connection.</p>`);
  document.getElementById('fbLogin')?.addEventListener('click', () => demo('Facebook'));
  document.getElementById('gLogin')?.addEventListener('click', () => demo('Google'));
})();

/* ==== RECENT BETS (left sidebar) ==== */
(() => {
  const KEY = 'mbets-placed-v1';
  const fmt2 = (n) => Number(n).toFixed(2);

  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  // Build the panel ONCE and place it right after the trending list
  let panel = document.getElementById('recentPanel');
  if (!panel) {
    panel = document.createElement('section');
    panel.id = 'recentPanel';
    panel.style.marginTop = '18px';
    panel.innerHTML = `
      <div class="side-sub">RECENT BETS</div>
      <ul id="recentList" class="side-list" style="margin-top:6px;"></ul>
      <button id="clearRecent" class="btn btn-login" style="width:100%;margin-top:8px;padding:8px 10px;">Clear</button>
    `;
    const trendingUl = document.getElementById('trendingList');
    if (trendingUl) {
      // insert AFTER the UL (not inside it)
      trendingUl.insertAdjacentElement('afterend', panel);
    } else {
      sidebar.appendChild(panel);
    }
  }

  const listEl  = panel.querySelector('#recentList');
  const clearEl = panel.querySelector('#clearRecent');

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
  const save = (arr) => localStorage.setItem(KEY, JSON.stringify(arr.slice(-5))); // keep last 5

  function renderRecent() {
    const arr = load();
    listEl.innerHTML = arr.length
      ? arr.slice().reverse().map(p => `
          <li class="side-item" style="align-items:flex-start;">
            <div style="display:flex;flex-direction:column;gap:2px;width:100%;">
              <div style="display:flex;justify-content:space-between;width:100%;">
                <strong>${p.time}</strong>
                <span class="pill" style="border-color:var(--divider);">${fmt2(p.total)}</span>
              </div>
              <div class="muted" style="font-size:12px;">
                ${p.count} sel • Stake ${fmt2(p.stake)} • Payout ${fmt2(p.payout)}
              </div>
            </div>
          </li>
        `).join('')
      : `<li class="side-item muted">No bets placed yet.</li>`;
  }

  // Clear history
  clearEl.addEventListener('click', () => { localStorage.removeItem(KEY); renderRecent(); });

  // Record on Place Bet (document capture so other handlers can't block us)
  document.addEventListener('click', (ev) => {
    if (!ev.target.closest('#place')) return;

    const stake = Number(document.getElementById('stake').value) || 0;
    // IMPORTANT: use local `slip` (NOT window.slip)
    if (!slip.length || stake <= 0) return;

    const total  = slip.reduce((a, b) => a * Number(b.odd), 1) || 1; // tolerate bad odds
    const payout = stake * total;
    const when   = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const arr = load();
    const rec = { time: when, count: slip.length, stake, total, payout };

    // De-dupe identical consecutive entries
    const last = arr[arr.length - 1];
    const same = last
      && last.count === rec.count
      && fmt2(last.stake)  === fmt2(rec.stake)
      && fmt2(last.total)  === fmt2(rec.total)
      && fmt2(last.payout) === fmt2(rec.payout);

    if (!same) { arr.push(rec); save(arr); renderRecent(); }
  }, true);

  /* ==== ODDS FORMAT (Dec / Frac / US) — HTML-driven ==== */
(() => {
  if (window.__oddsFmtInit) return; 
  window.__oddsFmtInit = true;

  const select = document.getElementById('oddsFormat');
  if (!select) return; // selector not on page

  const KEY = 'mbets-oddsfmt';
  const gcd = (a,b)=> b ? gcd(b, a % b) : a;
  const toFrac = (d) => {
    if (!isFinite(d) || d <= 1) return '-';
    const n = Math.round((d - 1) * 100), den = 100, g = gcd(n, den) || 1;
    return `${n/g}/${den/g}`;
  };
  const toUS = (d) => {
    if (!isFinite(d) || d <= 1) return '-';
    return d >= 2 ? `+${Math.round((d - 1) * 100)}`
                  : `-${Math.round(100 / (d - 1))}`;
  };
  const formatOdd = (dec, mode) => {
    const d = Number(dec);
    if (!isFinite(d)) return '-';
    if (mode === 'dec')  return d.toFixed(2);
    if (mode === 'frac') return toFrac(d);
    return toUS(d);
  };

  // state
  let mode = localStorage.getItem(KEY) || 'dec';
  select.value = mode;

  function repaint() {
    // cards
    document.querySelectorAll('.odd-btn').forEach(btn => {
      const v = Number(btn.dataset.odd);
      const el = btn.querySelector('.val');
      if (el) el.textContent = formatOdd(v, mode);
    });
    // slip items
    document.querySelectorAll('.slip-item').forEach(it => {
      const id = it.querySelector('[data-remove]')?.dataset.remove;
      const s  = id && slip.find(x => x.matchId === id);
      const el = it.querySelector('.odds');
      if (s && el) el.textContent = formatOdd(s.odd, mode);
    });
    // total odds label (display only)
    const total = slip.reduce((a,b)=> a * Number(b.odd), 1) || 1;
    const totEl = document.getElementById('totalOdds');
    if (totEl) totEl.textContent = formatOdd(total, mode);
  }

  // hook your renders
  const rCards = window.renderCards;
  window.renderCards = function(){ rCards && rCards(); repaint(); };

  const rSlip  = window.renderSlip;
  window.renderSlip  = function(){ rSlip && rSlip(); repaint(); };

  // initial paint
  repaint();

  // save + repaint on change
  select.addEventListener('change', () => {
    mode = select.value;
    localStorage.setItem(KEY, mode);
    repaint();
  });
})();

  // Initial paint
  renderRecent();
})();

// Init
renderTrending();
renderCards();
renderSlip();
