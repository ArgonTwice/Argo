function getManualTransferAmount() {
  const el = document.getElementById('manualTransferAmount');
  return el ? parseAmount(el.value) : 0;
}
function saveManualTransfer() {
  // Sauvegarde TOUJOURS le montant et le preset, peu importe l'état
  const amount = getManualTransferAmount();
  const preset = localStorage.getItem(TRANSFER_PRESET_KEY) || 'custom';
  localStorage.setItem(MANUAL_TRANSFER_KEY, String(amount));
  localStorage.setItem(TRANSFER_PRESET_KEY, preset);
}
function loadManualTransfer() {
  const el = document.getElementById('manualTransferAmount');
  if (!el) return;

  // 1. Lire le preset sauvegardé
  const savedPreset = localStorage.getItem(TRANSFER_PRESET_KEY);

  // 2. Activer visuellement le bon bouton
  if (savedPreset) {
    const radio = document.querySelector(`input[name="transferPreset"][value="${savedPreset}"]`);
    if (radio) radio.checked = true;
  }

  // 3 & 4. Injecter le montant selon le type de preset
  if (savedPreset && savedPreset !== 'custom') {
    // Preset numérique : recalculer depuis salary + bonus
    const rate = parseFloat(savedPreset);
    if (Number.isFinite(rate) && rate > 0) {
      const income = parseAmount(fields.salary?.value) + parseAmount(fields.bonus?.value);
      el.value = (income * rate).toFixed(2);
    }
  } else {
    // Preset 'custom' ou absent : restaurer la valeur saisie
    const v = Number(localStorage.getItem(MANUAL_TRANSFER_KEY));
    el.value = Number.isFinite(v) && v >= 0 ? v : 0;
  }

  // 5. Readonly ou éditable
  syncTransferInputState(savedPreset);

  // 6. Mettre à jour le résumé
  updateManualTransferSummary();
}
function updateManualTransferSummary() {
  const el = document.getElementById('manualTransferSummary');
  if (el) el.textContent = `Virement retenu ce mois : ${formatCurrency(getManualTransferAmount())}`;
}

// ── Helpers preset virement ──────────────────────────────────────────────────
function getActiveTransferPreset() {
  const checked = document.querySelector('input[name="transferPreset"]:checked');
  return checked ? checked.value : null;
}

function syncTransferInputState(preset) {
  const el = document.getElementById('manualTransferAmount');
  if (!el) return;
  const isPreset = preset && preset !== 'custom';
  if (isPreset) {
    el.setAttribute('readonly', '');
  } else {
    el.removeAttribute('readonly');
  }
}

function applyActiveTransferPreset() {
  const preset = getActiveTransferPreset();
  if (!preset || preset === 'custom') return;
  const rate = parseFloat(preset);
  if (!Number.isFinite(rate)) return;
  const income = parseAmount(fields.salary?.value) + parseAmount(fields.bonus?.value);
  const amount = Math.round(income * rate * 100) / 100;
  const el = document.getElementById('manualTransferAmount');
  if (el) el.value = amount;
}

function bindTransferPresets() {
  document.querySelectorAll('input[name="transferPreset"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      syncTransferInputState(radio.value);
      applyActiveTransferPreset();
      saveManualTransfer();
      calculerRestant();
    });
  });
}

function updateRealReturn() {
  const inflation   = parseAmount(document.getElementById('currentInflationRate')?.value);
  const livretRate  = parseAmount(document.getElementById('carrefourInterest')?.value);

  // Synchronise l'affichage du taux livret (readonly)
  const livretDisplay = document.getElementById('livretRateDisplay');
  if (livretDisplay) livretDisplay.value = livretRate;

  const realReturn = livretRate - inflation;
  const el = document.getElementById('realReturnDisplay');
  if (!el) return;

  const sign = realReturn >= 0 ? '+' : '';
  el.innerHTML = `
    <p class="real-return-value ${realReturn >= 0 ? 'positive' : 'negative'}">
      Rendement réel : ${sign}${realReturn.toFixed(2)}%
    </p>
    <p class="real-return-hint">
      ${realReturn >= 0
        ? '✓ Ton épargne préserve son pouvoir d\'achat.'
        : '⚠ Ton épargne perd ' + Math.abs(realReturn).toFixed(2) + '% de valeur par an. Investir est nécessaire.'}
    </p>`;
}

function setActiveSection(sectionKey) {
  document.querySelectorAll('.page-section').forEach((section) => {
    const isVisible = section.id === `${sectionKey}-section`;
    section.classList.toggle('is-visible', isVisible);
    section.style.display = isVisible ? 'block' : 'none';
  });

  document.querySelectorAll('.nav-link, .tab-btn').forEach((button) => {
    const isActive = button.dataset.section === sectionKey;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-current', isActive ? 'page' : 'false');
  });

}

function bindSectionNavigation() {
  document.querySelectorAll('.nav-link, .tab-btn').forEach((button) => {
    button.addEventListener('click', () => {
      setActiveSection(button.dataset.section);
    });
  });
}

// ─── THÈME : SOMBRE / CLAIR / SYSTÈME ───────────────────────
const THEME_KEY = 'dashboard-financier-theme';
// Valeurs possibles : 'dark' | 'light' | 'system'

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(preference) {
  const resolved = preference === 'system' ? getSystemTheme() : preference;
  document.documentElement.setAttribute('data-theme', resolved);

  const btn = document.getElementById('themeToggleBtn');
  if (!btn) return;
  const icon  = btn.querySelector('i');
  const label = btn.querySelector('span');

  if (preference === 'light') {
    // on EST en clair → prochain clic = système
    if (icon)  icon.className    = 'fa-solid fa-display';
    if (label) label.textContent = 'Système';
  } else if (preference === 'dark') {
    // on EST en sombre → prochain clic = clair
    if (icon)  icon.className    = 'fa-solid fa-sun';
    if (label) label.textContent = 'Clair';
  } else {
    // on EST en système → prochain clic = sombre
    if (icon)  icon.className    = 'fa-solid fa-moon';
    if (label) label.textContent = 'Sombre';
  }
}

function cycleTheme() {
  const current = localStorage.getItem(THEME_KEY) || 'dark';
  const next = current === 'dark'  ? 'light'
             : current === 'light' ? 'system'
             : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(saved);

  // Réagit aux changements OS en mode système
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if ((localStorage.getItem(THEME_KEY) || 'dark') === 'system') {
      applyTheme('system');
    }
  });
}

// ─── ALERTES BUDGET ─────────────────────────────────────────
const BUDGET_ALERTS_KEY = 'dashboard-financier-budget-alerts';
function loadBudgetAlerts() {
  try { return JSON.parse(localStorage.getItem(BUDGET_ALERTS_KEY)) || {}; } catch { return {}; }
}
function saveBudgetAlerts(a) { localStorage.setItem(BUDGET_ALERTS_KEY, JSON.stringify(a)); }
function checkBudgetAlerts() {
  [['fixedCharges','Charges fixes'],['personalExpenses','Dépenses perso'],['groceryExpenses','Courses']].forEach(([key]) => {
    const limit = parseAmount((loadBudgetAlerts()[key] || 0));
    const actual = getDynamicTotal(key);
    const el = document.getElementById(`budget-alert-status-${key}`);
    if (!el) return;
    if (limit > 0 && actual > limit) {
      el.textContent = `⚠ Dépassement : ${formatCurrency(actual)} / ${formatCurrency(limit)}`;
      el.className = 'budget-alert-status budget-alert-over';
    } else if (limit > 0) {
      el.textContent = `✓ ${formatCurrency(actual)} / ${formatCurrency(limit)}`;
      el.className = 'budget-alert-status budget-alert-ok';
    } else {
      el.textContent = 'Aucun seuil défini';
      el.className = 'budget-alert-status';
    }
  });
}
function bindBudgetAlerts() {
  ['fixedCharges','personalExpenses','groceryExpenses'].forEach(key => {
    const el = document.getElementById(`budget-limit-${key}`);
    if (!el) return;
    const a = loadBudgetAlerts();
    el.value = a[key] || 0;
    el.addEventListener('input', () => {
      const cur = loadBudgetAlerts();
      cur[key] = parseAmount(el.value);
      saveBudgetAlerts(cur);
      checkBudgetAlerts();
    });
  });
}

// ─── OBJECTIFS MULTIPLES ────────────────────────────────────
const GOALS_KEY = 'dashboard-financier-goals';
function loadGoals() { try { return JSON.parse(localStorage.getItem(GOALS_KEY)) || []; } catch { return []; } }
function saveGoals(g) { localStorage.setItem(GOALS_KEY, JSON.stringify(g)); }
function renderGoals() {
  const c = document.getElementById('goalsContainer');
  if (!c) return;
  const goals = loadGoals();
  const patrimony = getTotalPatrimony();
  if (!goals.length) { c.innerHTML = '<p class="dynamic-empty">Aucun objectif défini.</p>'; return; }
  c.innerHTML = goals.map((g, i) => {
    const pct = g.target > 0 ? Math.min(100, (patrimony / g.target) * 100) : 0;
    const isDone = pct >= 100;
    return `<div class="goal-card${isDone ? ' goal-card-done' : ''}">
      <div class="goal-card-header">
        <div class="goal-card-title">
          <span class="goal-icon">${g.icon || '🎯'}</span>
          <div>
            <p class="goal-card-kicker">Objectif financier</p>
            <strong class="goal-card-name">${g.name}</strong>
          </div>
        </div>
        <button class="danger-btn icon-btn" data-goal-remove="${i}" aria-label="Supprimer l'objectif"><i class="fa-solid fa-trash-can"></i></button>
      </div>
      <div class="goal-stats">
        <div class="goal-amounts">
          <span class="goal-current">${formatCurrency(patrimony)}</span>
          <span class="goal-sep">/</span>
          <span class="goal-target-val">${formatCurrency(g.target)}</span>
        </div>
        <strong class="goal-percent${isDone ? ' goal-percent-done' : ''}">${pct.toFixed(1)}%</strong>
      </div>
      <div class="goal-progress-track">
        <div class="goal-progress-fill${isDone ? ' goal-progress-fill-done' : ''}" style="width:${pct}%"></div>
      </div>
      ${isDone ? '<p class="goal-done-badge"><i class="fa-solid fa-circle-check"></i> Objectif atteint !</p>' : ''}
    </div>`;
  }).join('');
  c.querySelectorAll('[data-goal-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      const g = loadGoals(); g.splice(Number(btn.dataset.goalRemove),1); saveGoals(g); renderGoals();
    });
  });
}

function bindGoalsForm() {
  const btn = document.getElementById('addGoalButton');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const name = document.getElementById('goalName')?.value.trim();
    const target = parseAmount(document.getElementById('goalTarget')?.value);
    const icon = document.getElementById('goalIcon')?.value.trim() || '🎯';
    if (!name || target <= 0) return;
    const g = loadGoals(); g.push({name, target, icon}); saveGoals(g); renderGoals();
    ['goalName','goalTarget','goalIcon'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
  });
}

// ─── DASHBOARD DE VIE ───────────────────────────────────────
const LIFE_GOALS_KEY = 'dashboard-financier-life-goals';

function loadLifeGoals() {
  try { return JSON.parse(localStorage.getItem(LIFE_GOALS_KEY)) || []; }
  catch { return []; }
}

function saveLifeGoals(g) {
  localStorage.setItem(LIFE_GOALS_KEY, JSON.stringify(g));
}

function renderLifeGoals() {
  const c = document.getElementById('lifeGoalsContainer');
  if (!c) return;
  const goals = loadLifeGoals();
  if (!goals.length) {
    c.innerHTML = '<p class="dynamic-empty">Aucun projet de vie défini.</p>';
    return;
  }
  c.innerHTML = goals.map((g, i) => `
    <div class="life-goal-card">
      <div class="life-goal-header">
        <span class="life-goal-emoji">${g.emoji || '🎯'}</span>
        <div>
          <strong>${escapeHtml(g.name)}</strong>
          ${g.deadline ? `<span class="life-goal-deadline">${escapeHtml(g.deadline)}</span>` : ''}
        </div>
        <button class="danger-btn icon-btn" data-life-remove="${i}">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
      <div class="life-goal-bar-wrap">
        <div class="life-goal-bar">
          <div class="life-goal-fill" style="width:${g.progress || 0}%"></div>
        </div>
        <span class="life-goal-pct">${g.progress || 0}%</span>
      </div>
    </div>
  `).join('');

  c.querySelectorAll('[data-life-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const goals = loadLifeGoals();
      goals.splice(Number(btn.dataset.lifeRemove), 1);
      saveLifeGoals(goals);
      renderLifeGoals();
    });
  });
}

function bindLifeGoals() {
  document.getElementById('addLifeGoalBtn')?.addEventListener('click', () => {
    const name     = document.getElementById('lifeGoalName')?.value.trim();
    const emoji    = document.getElementById('lifeGoalEmoji')?.value.trim() || '🎯';
    const deadline = document.getElementById('lifeGoalDeadline')?.value.trim();
    const progress = Math.min(100, Math.max(0, Number(document.getElementById('lifeGoalProgress')?.value) || 0));
    if (!name) return;
    const goals = loadLifeGoals();
    goals.push({ name, emoji, deadline, progress });
    saveLifeGoals(goals);
    renderLifeGoals();
    ['lifeGoalName', 'lifeGoalEmoji', 'lifeGoalDeadline', 'lifeGoalProgress']
      .forEach((id) => { const el = document.getElementById(id); if (el) el.value = ''; });
  });
}

// ─── RENTRÉES EXCEPTIONNELLES — RENDU ───────────────────────
function renderPonctuals() {
  if (!ponctualsListEl) return;
  ponctualsListEl.innerHTML = '';
  if (ponctuels.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'dynamic-empty';
    empty.textContent = 'Aucune rentrée exceptionnelle ce mois-ci.';
    ponctualsListEl.appendChild(empty);
    return;
  }
  ponctuels.forEach((p, index) => {
    const row = document.createElement('div');
    row.className = 'ponctual-entry';
    row.innerHTML = `
      <label>
        <span>Description</span>
        <input type="text" value="${escapeHtml(p.description)}" data-ponctual-index="${index}" data-ponctual-field="description" placeholder="Ex : Vente carte Pokémon" />
      </label>
      <label>
        <span>Montant (€)</span>
        <input type="number" min="0" step="0.01" value="${p.amount}" data-ponctual-index="${index}" data-ponctual-field="amount" inputmode="decimal" />
      </label>
      <button type="button" class="danger-btn icon-btn" data-remove-ponctual="${index}" aria-label="Supprimer cette rentrée">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    `;
    ponctualsListEl.appendChild(row);
  });
}

// ─── RECHERCHE RAPIDE ───────────────────────────────────────
function initSearch() {
  const input = document.getElementById('quickSearchInput');
  const results = document.getElementById('quickSearchResults');
  if (!input || !results) return;
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    results.innerHTML = '';
    if (q.length < 2) { results.style.display = 'none'; return; }
    const hits = [];
    dynamicSections.fixedCharges.forEach(i => { if(i.name.toLowerCase().includes(q)) hits.push({label:i.name,val:formatCurrency(i.amount),sec:'Charges fixes',ico:'fa-receipt'}); });
    dynamicSections.personalExpenses.forEach(i => { if(i.name.toLowerCase().includes(q)) hits.push({label:i.name,val:formatCurrency(i.amount),sec:'Dépenses perso',ico:'fa-wallet'}); });
    dynamicSections.groceryExpenses.forEach(i => { if(i.name.toLowerCase().includes(q)) hits.push({label:i.name,val:formatCurrency(i.amount),sec:'Courses',ico:'fa-cart-shopping'}); });
    peaActions.forEach(a => { if(a.name.toLowerCase().includes(q)) hits.push({label:a.name,val:formatCurrency(a.quantity*a.currentPrice),sec:'PEA',ico:'fa-chart-line'}); });
    cryptoAssets.forEach(a => { if(a.symbol.toLowerCase().includes(q)) hits.push({label:a.symbol,val:formatCurrency(getCryptoValueForAsset(a)),sec:'Crypto',ico:'fa-bitcoin-sign'}); });
    bankAccounts.forEach(a => { if(a.name.toLowerCase().includes(q)) hits.push({label:a.name,val:formatCurrency(a.balance),sec:'Banque',ico:'fa-building-columns'}); });
    results.innerHTML = hits.length
      ? hits.map(r=>`<div class="search-result-item"><i class="fa-solid ${r.ico}"></i><div><strong>${r.label}</strong><span>${r.sec}</span></div><em>${r.val}</em></div>`).join('')
      : '<p class="search-empty">Aucun résultat.</p>';
    results.style.display = 'block';
  });
  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !results.contains(e.target)) results.style.display = 'none';
  });
}

// ─── CATÉGORIES DE DÉPENSES ─────────────────────────────────
const BUDGET_CATS_KEY = 'dashboard-financier-budget-cats';

function loadBudgetCats() {
  try { return JSON.parse(localStorage.getItem(BUDGET_CATS_KEY)) || []; } catch { return []; }
}

function saveBudgetCats(cats) {
  localStorage.setItem(BUDGET_CATS_KEY, JSON.stringify(cats));
}

function renderBudgetCategories() {
  const container = document.getElementById('budgetCategoriesContainer');
  if (!container) return;
  const cats = loadBudgetCats();

  if (!cats.length) {
    container.innerHTML = '<p class="dynamic-empty">Aucune catégorie définie. Ajoutez-en une ci-dessus.</p>';
    return;
  }

  container.innerHTML = cats.map((cat, i) => {
    const spent = (cat.expenses || []).reduce((s, e) => s + parseAmount(e.amount), 0);
    const pct = cat.budget > 0 ? Math.min(100, (spent / cat.budget) * 100) : 0;
    const isOver = cat.budget > 0 && spent > cat.budget;
    const ringColor = isOver ? '#f87171' : pct > 75 ? '#fbbf24' : '#67e8f9';
    const expRows = (cat.expenses || []).map((e, j) => `
      <div class="budget-cat-expense-row">
        <span class="budget-cat-exp-name">${e.name}</span>
        <span class="budget-cat-exp-amt">${formatCurrency(e.amount)}</span>
        <button class="danger-btn icon-btn icon-btn-xs" data-cat-idx="${i}" data-exp-idx="${j}" aria-label="Supprimer"><i class="fa-solid fa-xmark"></i></button>
      </div>`).join('');

    return `<div class="budget-cat-card${isOver ? ' budget-cat-over' : ''}">
      <div class="budget-cat-card-top">
        <div class="budget-cat-card-info">
          <span class="budget-cat-icon">${cat.icon || '📦'}</span>
          <div>
            <p class="budget-cat-kicker">Catégorie</p>
            <strong class="budget-cat-name">${cat.name}</strong>
          </div>
        </div>
        <button class="danger-btn icon-btn" data-cat-remove="${i}" aria-label="Supprimer la catégorie"><i class="fa-solid fa-trash-can"></i></button>
      </div>
      <div class="budget-cat-body">
        <div class="budget-cat-ring-wrap">
          <svg viewBox="0 0 36 36" class="budget-cat-ring" aria-hidden="true">
            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="rgba(96,165,250,0.15)" stroke-width="3.8"/>
            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="${ringColor}" stroke-width="3.8"
              stroke-dasharray="${pct.toFixed(2)} 100" stroke-linecap="round"
              transform="rotate(-90 18 18)"/>
          </svg>
          <span class="budget-cat-ring-pct" style="color:${ringColor}">${pct.toFixed(0)}%</span>
        </div>
        <div class="budget-cat-stats">
          <div class="budget-cat-amounts">
            <span class="budget-cat-spent${isOver ? ' budget-cat-spent-over' : ''}">${formatCurrency(spent)}</span>
            <span class="budget-cat-sep">/</span>
            <span class="budget-cat-max">${formatCurrency(cat.budget)}</span>
          </div>
          <p class="budget-cat-remaining${isOver ? ' budget-cat-remaining-over' : ''}">
            ${isOver ? `⚠ Dépassement : ${formatCurrency(spent - cat.budget)}` : `Reste : ${formatCurrency(cat.budget - spent)}`}
          </p>
        </div>
      </div>
      <div class="budget-cat-expenses">
        <div class="budget-cat-expense-list">${expRows || '<p class="budget-cat-empty">Aucune dépense enregistrée.</p>'}</div>
        <div class="budget-cat-add-expense">
          <input type="text" placeholder="Nom de la dépense" class="cat-exp-name" data-cat="${i}" />
          <input type="number" placeholder="€" min="0" step="0.01" class="cat-exp-amount" data-cat="${i}" inputmode="decimal" />
          <button type="button" class="action-btn icon-btn" data-cat-add-expense="${i}" aria-label="Ajouter une dépense"><i class="fa-solid fa-plus"></i></button>
        </div>
      </div>
    </div>`;
  }).join('');

  container.querySelectorAll('[data-cat-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cats = loadBudgetCats();
      cats.splice(Number(btn.dataset.catRemove), 1);
      saveBudgetCats(cats);
      renderBudgetCategories();
    });
  });

  container.querySelectorAll('[data-cat-add-expense]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.catAddExpense);
      const nameInput = container.querySelector(`.cat-exp-name[data-cat="${idx}"]`);
      const amtInput = container.querySelector(`.cat-exp-amount[data-cat="${idx}"]`);
      const name = nameInput?.value.trim();
      const amount = parseAmount(amtInput?.value);
      if (!name) return;
      const cats = loadBudgetCats();
      if (!cats[idx]) return;
      if (!cats[idx].expenses) cats[idx].expenses = [];
      cats[idx].expenses.push({ name, amount });
      saveBudgetCats(cats);
      renderBudgetCategories();
    });
  });

  container.querySelectorAll('[data-exp-idx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const catIdx = Number(btn.dataset.catIdx);
      const expIdx = Number(btn.dataset.expIdx);
      const cats = loadBudgetCats();
      if (!cats[catIdx]?.expenses) return;
      cats[catIdx].expenses.splice(expIdx, 1);
      saveBudgetCats(cats);
      renderBudgetCategories();
    });
  });
}

function bindBudgetCatsForm() {
  const btn = document.getElementById('addCatButton');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const icon = document.getElementById('catIcon')?.value.trim() || '📦';
    const name = document.getElementById('catName')?.value.trim();
    const budget = parseAmount(document.getElementById('catBudget')?.value);
    if (!name || budget <= 0) return;
    const cats = loadBudgetCats();
    cats.push({ icon, name, budget, expenses: [] });
    saveBudgetCats(cats);
    renderBudgetCategories();
    ['catIcon', 'catName', 'catBudget'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  });
}

// ─── SPLASH SCREEN — Argo, Toison d'Or ─────────────────────
function launchSplash() {
  const splash = document.getElementById('splashScreen');
  if (!splash) return;

  // ─── prefers-reduced-motion : splash statique + fondu 0.5s ──────
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const tEl = splash.querySelector('.splash-title');
    const sEl = splash.querySelector('.splash-sub');
    const iEl = splash.querySelector('.splash-icon');
    if (tEl) tEl.style.opacity = '1';
    if (sEl) sEl.style.opacity = '0.82';
    if (iEl) iEl.style.opacity = '1';
    splash.style.transition = 'opacity 0.5s ease, visibility 0.5s ease';
    setTimeout(() => {
      splash.classList.add('splash-hide');
      setTimeout(() => { if (splash.parentNode) splash.remove(); }, 560);
    }, 400);
    return;
  }

  // ─── Fallback iOS Safari sans Web Animations API ─────────────
  if (!Element.prototype.animate) {
    const tEl = splash.querySelector('.splash-title');
    const sEl = splash.querySelector('.splash-sub');
    if (tEl) {
      const chars = [...tEl.textContent.trim()];
      tEl.textContent = '';
      tEl.style.opacity = '1';
      chars.forEach((ch, i) => {
        const span = document.createElement('span');
        span.className = 'splash-title-letter';
        span.style.animationDelay = `${0.4 + i * 0.1}s`;
        span.textContent = ch;
        tEl.appendChild(span);
      });
    }
    if (sEl) sEl.style.animationDelay = '1s';
    splash.classList.add('splash-fallback');
    setTimeout(() => {
      splash.classList.add('splash-hide');
      setTimeout(() => { if (splash.parentNode) splash.remove(); }, 600);
    }, 2400);
    return;
  }

  const GOLD      = ['#fcd34d','#f59e0b','#fbbf24','#fef3c7','#fde68a','#d97706'];
  const W         = window.innerWidth;
  const H         = window.innerHeight;
  const fallDist  = H + 140;

  const starsCont  = document.getElementById('splashStars');
  const partCont   = document.getElementById('splashParticles');
  const ship       = splash.querySelector('.splash-ship');
  const shipInner  = splash.querySelector('.splash-ship-inner');
  const reflection = splash.querySelector('.splash-ship-reflection');
  const horizLine  = splash.querySelector('.splash-horizon-line');
  const titleEl    = splash.querySelector('.splash-title');
  const subEl      = splash.querySelector('.splash-sub');
  const iconEl     = splash.querySelector('.splash-icon');

  // Dimensions du bateau (CSS clamp reproduit en JS)
  const shipW      = Math.min(200, Math.max(120, W * 0.28));
  const shipCenterX = Math.round((W - shipW) / 2);

  // ═══════════════════════════════════════════════════════════════
  // ACTE 1 (0–800ms) : horizon + étoiles qui s'allument
  // ═══════════════════════════════════════════════════════════════

  if (horizLine) {
    horizLine.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 550, delay: 60, fill: 'forwards', easing: 'ease-out' }
    );
  }

  if (starsCont) {
    for (let i = 0; i < 20; i++) {
      const star = document.createElement('div');
      star.className = 'splash-star';
      const sz = (1 + Math.random() * 2.5).toFixed(1);
      star.style.cssText = `left:${(Math.random()*100).toFixed(1)}%;top:${(2+Math.random()*60).toFixed(1)}%;width:${sz}px;height:${sz}px`;
      starsCont.appendChild(star);
      const peak = 0.5 + Math.random() * 0.5;
      star.animate(
        [{ opacity: 0 }, { opacity: peak }, { opacity: peak * 0.25 }],
        { duration: 900 + Math.random()*1600, delay: Math.random()*650,
          iterations: Infinity, easing: 'ease-in-out', direction: 'alternate' }
      );
    }
    // Libère la mémoire GPU une fois l'acte 1 terminé
    setTimeout(() => {
      starsCont.querySelectorAll('.splash-star').forEach((s) => {
        s.style.willChange = 'auto';
      });
    }, 650);
  }

  // ═══════════════════════════════════════════════════════════════
  // ACTE 2 (600–1700ms) : l'Argo entre, décélère, s'immobilise
  // ═══════════════════════════════════════════════════════════════

  if (ship) {
    ship.animate(
      [
        { transform: 'translateX(-200px)' },
        { transform: `translateX(${Math.round(shipCenterX * 0.55)}px)`, offset: 0.56 },
        { transform: `translateX(${shipCenterX}px)` },
      ],
      { duration: 1100, delay: 600, fill: 'both', easing: 'ease-out' }
    );
  }

  if (shipInner) {
    shipInner.animate(
      [
        { transform: 'translateY(0px)   rotate(0deg)'    },
        { transform: 'translateY(-7px)  rotate(1.2deg)'  },
        { transform: 'translateY(2px)   rotate(-0.4deg)' },
        { transform: 'translateY(0px)   rotate(0deg)'    },
      ],
      { duration: 2800, delay: 600, iterations: Infinity, easing: 'ease-in-out' }
    );
  }

  if (reflection) {
    reflection.animate(
      [{ opacity: 0 }, { opacity: 0.2 }],
      { duration: 400, delay: 1600, fill: 'both', easing: 'ease-in' }
    );
  }

  // Spray à l'entrée de la proue (t=600ms)
  const sprayY = Math.round(H * 0.71);
  for (let i = 0; i < 8; i++) {
    const s  = document.createElement('div');
    const sz = +(2 + Math.random() * 3).toFixed(1);
    const tx = +(6  + Math.random() * 22);
    const ty = +(12 + Math.random() * 28);
    s.style.cssText = [
      'position:fixed',
      `left:${Math.round(shipW * 0.85)}px`,
      `top:${sprayY}px`,
      `width:${sz}px`, `height:${sz}px`,
      'border-radius:50%',
      `background:${Math.random() > 0.5 ? '#67e8f9' : '#fff'}`,
      'pointer-events:none', 'z-index:3', 'will-change:transform,opacity',
    ].join(';');
    splash.appendChild(s);
    s.animate(
      [
        { transform: 'translate(0,0)',                                              opacity: 0   },
        { transform: `translate(${+(tx*0.3).toFixed(1)}px,${-(ty*0.35).toFixed(1)}px)`, opacity: 0.8, offset: 0.2 },
        { transform: `translate(${tx.toFixed(1)}px,${(-ty).toFixed(1)}px)`,         opacity: 0   },
      ],
      { duration: 480 + Math.random() * 260, delay: 600, fill: 'both', easing: 'ease-out' }
    );
  }

  // Particules dorées — la Toison d'Or (max 15)
  if (partCont) {
    for (let i = 0; i < 15; i++) {
      const p   = document.createElement('div');
      p.className = 'splash-particle';
      const sz  = (3 + Math.random() * 9).toFixed(1);
      const lft = (-4 + Math.random() * 108).toFixed(1);
      const dur = 2200 + Math.random() * 1600;
      const dly = 650  + Math.random() * 900;
      const dx  = ((Math.random() - 0.5) * 140).toFixed(1);
      const rot = ((Math.random() - 0.5) * 220).toFixed(1);
      const op  = 0.5 + Math.random() * 0.5;
      const col = GOLD[Math.floor(Math.random() * GOLD.length)];
      p.style.cssText = `left:${lft}%;width:${sz}px;height:${sz}px;background:${col};box-shadow:0 0 ${(sz*1.4).toFixed(0)}px ${col}99`;
      partCont.appendChild(p);
      p.animate(
        [
          { transform: 'translateX(0) translateY(0) rotate(0deg)',                                    opacity: 0  },
          { transform: 'translateX(0) translateY(0) rotate(0deg)',                                    opacity: op, offset: 0.05 },
          { transform: `translateX(${dx*0.6}px) translateY(${(fallDist*0.85).toFixed(0)}px) rotate(${rot*0.7}deg)`, opacity: op, offset: 0.87 },
          { transform: `translateX(${dx}px)      translateY(${fallDist}px)                 rotate(${rot}deg)`,       opacity: 0  },
        ],
        { duration: dur, delay: dly, fill: 'both', easing: 'linear' }
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ACTE 3 : titre lettre par lettre + devise — déclenché après fonts.ready
  // ═══════════════════════════════════════════════════════════════

  const t0 = performance.now();

  const startAct3 = () => {
    const base = Math.max(0, 1800 - (performance.now() - t0));

    if (iconEl) {
      iconEl.animate(
        [{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1, transform: 'scale(1)' }],
        { duration: 380, delay: base, fill: 'forwards', easing: 'cubic-bezier(0.34,1.56,0.64,1)' }
      );
    }

    if (titleEl) {
      const chars = [...titleEl.textContent.trim()];
      titleEl.textContent = '';
      titleEl.style.opacity = '1';
      chars.forEach((ch, i) => {
        const span = document.createElement('span');
        span.className = 'splash-title-letter';
        span.textContent = ch;
        titleEl.appendChild(span);
        span.animate(
          [
            { opacity: 0, transform: 'translateY(22px)' },
            { opacity: 1, transform: 'translateY(0)'    },
          ],
          { duration: 280, delay: base + i * 90, fill: 'forwards',
            easing: 'cubic-bezier(0.34,1.56,0.64,1)' }
        );
      });
    }

    if (subEl) {
      subEl.animate(
        [
          { opacity: 0,    transform: 'translateY(10px)' },
          { opacity: 0.82, transform: 'translateY(0)'    },
        ],
        { duration: 420, delay: base + 600, fill: 'forwards', easing: 'ease-out' }
      );
    }

    // Fermeture 1 100ms après la fin de l'acte 3
    setTimeout(() => {
      if (splash.parentNode) {
        splash.classList.add('splash-hide');
        splash.addEventListener('transitionend', () => splash.remove(), { once: true });
        setTimeout(() => { if (splash.parentNode) splash.remove(); }, 700);
      }
    }, base + 1100);
  };

  // Déclenche acte 3 à 1800ms — attend les polices si nécessaire
  const SPLASH_MAX = 3800;
  setTimeout(() => {
    if (document.fonts.check("800 1em 'Poppins'")) {
      startAct3();
    } else {
      document.fonts.ready.then(startAct3);
    }
  }, 1800);

  // Timeout de sécurité absolu
  setTimeout(() => {
    if (splash.parentNode) {
      splash.classList.add('splash-hide');
      setTimeout(() => { if (splash.parentNode) splash.remove(); }, 400);
    }
  }, SPLASH_MAX);
}

// ─── HERO BAR ────────────────────────────────────────────────
function updateHeroBar() {
  const heroP = document.getElementById('heroPatrimony');
  const heroR = document.getElementById('heroRemaining');
  const heroS = document.getElementById('heroScore');
  const badge = document.getElementById('healthScoreBadge');

  if (heroP) heroP.textContent = formatCurrency(getTotalPatrimony());
  if (heroR) {
    const remaining = parseAmount(fields.salary?.value) + parseAmount(fields.bonus?.value)
      + getPonctualsTotal()
      - getDynamicTotal('fixedCharges') - getDynamicTotal('personalExpenses')
      - getDynamicTotal('groceryExpenses') - getManualTransferAmount();
    heroR.textContent = formatCurrency(remaining);
    heroR.className = 'home-hero-val home-hero-remaining' + (remaining < 0 ? ' hero-negative' : remaining < 300 ? ' hero-warning' : '');
  }
  if (heroS && badge) {
    heroS.textContent = badge.textContent || '—';
    heroS.className = 'hero-score-mini ' + (badge.className.replace('health-score-badge','').trim());
  }
}

// ─── SCORE SANTÉ — DÉTAIL ────────────────────────────────────
function bindHealthScoreDetail() {
  const btn = document.getElementById('heroScore');
  const panel = document.getElementById('healthScoreDetail');
  if (!btn || !panel) return;
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    panel.hidden = expanded;
    if (!expanded) updateHealthScoreDetail();
  });
}

function updateHealthScoreDetail() {
  const gridEl = document.getElementById('healthScoreDetailGrid');
  const tipsEl = document.getElementById('healthTipsList');
  if (!gridEl || !tipsEl) return;

  const income = parseAmount(fields.salary?.value) + parseAmount(fields.bonus?.value) + getPonctualsTotal();
  if (income <= 0) { gridEl.innerHTML = '<p class="dynamic-empty">Renseignez vos revenus pour obtenir le détail.</p>'; tipsEl.innerHTML = ''; return; }

  const savings = getManualTransferAmount();
  const savingsRate = (savings / income) * 100;
  const fixed = getDynamicTotal('fixedCharges');
  const debtRatio = (fixed / income) * 100;
  const totalObl = fixed + getDynamicTotal('personalExpenses') + getDynamicTotal('groceryExpenses') + savings;
  const remaining = checkingBalance + income - totalObl;
  const balancePct = (remaining / income) * 100;

  const savScore = savingsRate >= 20 ? 100 : savingsRate >= 10 ? 50 + (savingsRate - 10) * 5 : savingsRate * 5;
  const debtScore = debtRatio <= 20 ? 100 : debtRatio <= 33 ? 100 - ((debtRatio - 20) / 13) * 40 : debtRatio <= 50 ? 60 - ((debtRatio - 33) / 17) * 60 : 0;
  const balScore = balancePct >= 20 ? 100 : balancePct > 0 ? balancePct * 5 : 0;

  const components = [
    { label: 'Taux d\'épargne', score: Math.round(savScore * 0.4), max: 40, detail: `${savingsRate.toFixed(1)}% du revenu` },
    { label: 'Endettement', score: Math.round(debtScore * 0.4), max: 40, detail: `${debtRatio.toFixed(1)}% (seuil 33%)` },
    { label: 'Solde disponible', score: Math.round(balScore * 0.2), max: 20, detail: `${formatCurrency(remaining)}` },
  ];

  gridEl.innerHTML = components.map(c => {
    const pct = c.max > 0 ? (c.score / c.max * 100) : 0;
    const color = pct >= 75 ? '#34d399' : pct >= 40 ? '#fbbf24' : '#f87171';
    return `<div class="score-detail-row">
      <div class="score-detail-label">${c.label}<span>${c.detail}</span></div>
      <div class="score-detail-bar-wrap">
        <div class="score-detail-bar" style="width:${pct}%;background:${color}"></div>
      </div>
      <span class="score-detail-pts" style="color:${color}">${c.score}/${c.max}</span>
    </div>`;
  }).join('');

  const tips = [];
  if (savingsRate < 10) tips.push('Virer au moins 10% du revenu chaque mois (preset disponible).');
  else if (savingsRate < 20) tips.push('Tu épargnes bien — vise 20% pour sécuriser davantage.');
  if (debtRatio > 33) tips.push(`Taux d'endettement critique (${debtRatio.toFixed(1)}%) — réduire les charges fixes prioritairement.`);
  else if (debtRatio > 20) tips.push('Taux d\'endettement élevé — surveille les nouvelles dépenses fixes.');
  if (balancePct < 10) tips.push('Solde faible après dépenses — reconstitue le matelas de sécurité.');
  if (!tips.length) tips.push('Excellent ! Continue sur cette lancée.');

  tipsEl.innerHTML = tips.map(t => `<li><i class="fa-solid fa-lightbulb"></i> ${t}</li>`).join('');
  updateHealthScoreDetail._lastUpdate = Date.now();
}

// ─── MODE ÉPARGNE FORCÉE ─────────────────────────────────────
const SAVINGS_LOCK_KEY = 'argo-savings-lock';

function initSavingsLock() {
  const container = document.querySelector('.auto-transfer-block');
  if (!container) return;

  // Ajouter le bouton lock après les presets
  const presetGrid = container.querySelector('.transfer-preset-grid');
  if (!presetGrid || container.querySelector('#savingsLockBtn')) return;

  const lockBtn = document.createElement('button');
  lockBtn.id = 'savingsLockBtn';
  lockBtn.type = 'button';
  lockBtn.className = 'savings-lock-btn';
  lockBtn.setAttribute('aria-label', 'Verrouiller le virement automatique');
  lockBtn.innerHTML = '<i class="fa-solid fa-lock-open"></i><span>Verrouiller</span>';
  presetGrid.after(lockBtn);

  const isLocked = localStorage.getItem(SAVINGS_LOCK_KEY) === '1';
  applySavingsLock(isLocked, lockBtn);

  lockBtn.addEventListener('click', () => {
    const locked = localStorage.getItem(SAVINGS_LOCK_KEY) === '1';
    localStorage.setItem(SAVINGS_LOCK_KEY, locked ? '0' : '1');
    applySavingsLock(!locked, lockBtn);
    showToast(locked ? 'Virement déverrouillé.' : 'Virement verrouillé — preset protégé.');
  });
}

function applySavingsLock(locked, btn) {
  if (!btn) btn = document.getElementById('savingsLockBtn');
  if (!btn) return;
  const presets = document.querySelectorAll('input[name="transferPreset"]');
  const amountInput = document.getElementById('manualTransferAmount');

  if (locked) {
    btn.innerHTML = '<i class="fa-solid fa-lock"></i><span>Verrouillé</span>';
    btn.classList.add('savings-lock-active');
    presets.forEach(r => r.disabled = true);
    if (amountInput) amountInput.setAttribute('readonly', '');
  } else {
    btn.innerHTML = '<i class="fa-solid fa-lock-open"></i><span>Verrouiller</span>';
    btn.classList.remove('savings-lock-active');
    presets.forEach(r => r.disabled = false);
    const preset = getActiveTransferPreset();
    syncTransferInputState(preset);
  }
}

// ─── SYSTÈME MULTI-UTILISATEURS ──────────────────────────────
const USERS_REGISTRY_KEY = 'argo-registry';
const ACTIVE_USER_KEY = 'argo-active';

function _getAllDataKeys() {
  const skip = new Set([USERS_REGISTRY_KEY, ACTIVE_USER_KEY]);
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!skip.has(k) && !k.startsWith('argo_usr_')) keys.push(k);
  }
  return keys;
}

function _saveUserSnapshot(uid) {
  const prefix = `argo_usr_${uid}_`;
  _getAllDataKeys().forEach(k => {
    const v = localStorage.getItem(k);
    if (v !== null) localStorage.setItem(prefix + k, v);
  });
}

function _loadUserSnapshot(uid) {
  const prefix = `argo_usr_${uid}_`;
  _getAllDataKeys().forEach(k => localStorage.removeItem(k));
  const toLoad = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k.startsWith(prefix)) toLoad.push(k);
  }
  toLoad.forEach(k => localStorage.setItem(k.slice(prefix.length), localStorage.getItem(k)));
}

function initMultiUser() {
  let registry = [];
  try { registry = JSON.parse(localStorage.getItem(USERS_REGISTRY_KEY) || '[]'); } catch {}
  let activeId = localStorage.getItem(ACTIVE_USER_KEY);

  if (!registry.length) {
    const id = 'u' + Date.now();
    registry = [{ id, name: 'Mon profil', emoji: '👤' }];
    activeId = id;
    localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(registry));
    localStorage.setItem(ACTIVE_USER_KEY, id);
    _saveUserSnapshot(id);
  } else if (!activeId || !registry.find(u => u.id === activeId)) {
    activeId = registry[0].id;
    localStorage.setItem(ACTIVE_USER_KEY, activeId);
    _loadUserSnapshot(activeId);
  }

  renderProfilePicker(registry, activeId);
  bindProfileUI(registry, activeId);
}

function renderProfilePicker(registry, activeId) {
  const activeUser = registry.find(u => u.id === activeId) || registry[0];
  const emojiEl = document.getElementById('activeProfileEmoji');
  const nameEl = document.getElementById('activeProfileName');
  if (emojiEl) emojiEl.textContent = activeUser?.emoji || '👤';
  if (nameEl) nameEl.textContent = activeUser?.name || 'Mon profil';

  const listEl = document.getElementById('profileListContainer');
  if (!listEl) return;
  listEl.innerHTML = registry.map(u => `
    <div class="profile-list-item${u.id === activeId ? ' profile-list-item-active' : ''}">
      <span class="profile-emoji">${u.emoji || '👤'}</span>
      <span class="profile-name">${escapeHtml(u.name)}</span>
      ${u.id === activeId
        ? '<span class="profile-badge-active">Actif</span>'
        : `<button type="button" class="action-btn profile-switch-btn" data-uid="${u.id}">Choisir</button>`}
      ${registry.length > 1 ? `<button type="button" class="danger-btn icon-btn profile-del-btn" data-uid="${u.id}" aria-label="Supprimer"><i class="fa-solid fa-trash-can"></i></button>` : ''}
    </div>
  `).join('');

  listEl.querySelectorAll('.profile-switch-btn').forEach(btn => {
    btn.addEventListener('click', () => switchToUser(btn.dataset.uid, registry, activeId));
  });
  listEl.querySelectorAll('.profile-del-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteUser(btn.dataset.uid, registry, activeId));
  });
}

function bindProfileUI(registry, activeId) {
  const pickerBtn = document.getElementById('profilePickerBtn');
  const modal = document.getElementById('profileModal');
  const overlay = document.getElementById('profileModalOverlay');
  const closeBtn = document.getElementById('closeProfileModalBtn');
  const addBtn = document.getElementById('addProfileBtn');

  const openModal = () => { modal.hidden = false; overlay.hidden = false; };
  const closeModal = () => { modal.hidden = true; overlay.hidden = true; };

  if (pickerBtn) pickerBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (overlay) overlay.addEventListener('click', closeModal);

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const name = document.getElementById('newProfileName')?.value.trim();
      const emoji = document.getElementById('newProfileEmoji')?.value.trim() || '👤';
      if (!name) { showToast('Saisissez un nom de profil.', 'warning'); return; }

      const currentRegistry = JSON.parse(localStorage.getItem(USERS_REGISTRY_KEY) || '[]');
      const id = 'u' + Date.now();
      currentRegistry.push({ id, name, emoji });
      localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(currentRegistry));

      const currentActiveId = localStorage.getItem(ACTIVE_USER_KEY);
      if (currentActiveId) _saveUserSnapshot(currentActiveId);

      _loadUserSnapshot(id);
      localStorage.setItem(ACTIVE_USER_KEY, id);
      showToast(`Profil "${name}" créé.`);
      setTimeout(() => window.location.reload(), 400);
    });
  }
}

function switchToUser(uid, registry, activeId) {
  if (uid === activeId) return;
  _saveUserSnapshot(activeId);
  _loadUserSnapshot(uid);
  localStorage.setItem(ACTIVE_USER_KEY, uid);
  showToast('Changement de profil…');
  setTimeout(() => window.location.reload(), 400);
}

function deleteUser(uid, registry, activeId) {
  if (registry.length <= 1) { showToast('Impossible de supprimer le dernier profil.', 'warning'); return; }
  if (!confirm('Supprimer ce profil et toutes ses données ?')) return;

  const prefix = `argo_usr_${uid}_`;
  const toRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k.startsWith(prefix)) toRemove.push(k);
  }
  toRemove.forEach(k => localStorage.removeItem(k));

  const newRegistry = registry.filter(u => u.id !== uid);
  localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(newRegistry));

  if (uid === activeId) {
    const nextId = newRegistry[0].id;
    localStorage.setItem(ACTIVE_USER_KEY, nextId);
    _loadUserSnapshot(nextId);
    setTimeout(() => window.location.reload(), 200);
  } else {
    renderProfilePicker(newRegistry, activeId);
  }
}

// ─── NOTIFICATIONS PUSH / LOCALES ────────────────────────────
function initNotifications() {
  const btn = document.getElementById('notifPermBtn');
  if (!btn || !('Notification' in window)) {
    if (btn) btn.hidden = true;
    return;
  }

  updateNotifBtnState(btn);

  btn.addEventListener('click', async () => {
    if (Notification.permission === 'granted') {
      checkAndNotify();
      showToast('Vérification des prélèvements…');
      return;
    }
    const perm = await Notification.requestPermission();
    updateNotifBtnState(btn);
    if (perm === 'granted') {
      showToast('Notifications activées !');
      checkAndNotify();
    } else {
      showToast('Notifications refusées par le navigateur.', 'warning');
    }
  });

  if (Notification.permission === 'granted') {
    checkAndNotify();
  }
}

function updateNotifBtnState(btn) {
  if (!btn) return;
  const perm = Notification.permission;
  if (perm === 'granted') {
    btn.innerHTML = '<i class="fa-solid fa-bell"></i><span>Alertes actives</span>';
    btn.classList.add('notif-btn-active');
  } else if (perm === 'denied') {
    btn.innerHTML = '<i class="fa-solid fa-bell-slash"></i><span>Bloquées</span>';
    btn.classList.add('notif-btn-denied');
  } else {
    btn.innerHTML = '<i class="fa-solid fa-bell"></i><span>Notifications</span>';
  }
}

function checkAndNotify() {
  if (Notification.permission !== 'granted') return;
  const todayDay = new Date().getDate();

  dynamicSections.fixedCharges.forEach(c => {
    const diff = c.day - todayDay;
    if (diff < 0 || diff > 1) return;
    const title = diff === 0 ? `💳 Prélèvement aujourd'hui` : `⏰ Prélèvement demain`;
    const body = `${c.name} — ${formatCurrency(c.amount)}`;

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SHOW_NOTIF', title, body });
    } else {
      new Notification(title, { body, icon: './icon.svg', badge: './icon.svg' });
    }
  });
}
