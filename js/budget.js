function getDynamicTotal(sectionKey) {
  return dynamicSections[sectionKey].reduce((total, item) => total + parseAmount(item.amount), 0);
}

function updateAlertSystem(resteAVivre) {
  const remainingCard = document.querySelector('.metric-card.accent-remaining');
  const remainingIcon = document.getElementById('remainingIncomeWarningIcon');

  if (resteAVivre < seuilAlerte) {
    if (remainingCard) {
      remainingCard.classList.add('alert-mode');
    }

    if (remainingIcon) {
      remainingIcon.classList.add('remaining-warning-icon');
      remainingIcon.style.display = 'inline-flex';
      remainingIcon.hidden = false;
    }
  } else {
    if (remainingCard) {
      remainingCard.classList.remove('alert-mode');
    }

    if (remainingIcon) {
      remainingIcon.style.display = 'none';
      remainingIcon.hidden = true;
    }
  }
}

function calculerRestant() {
  // Si un preset est actif, recalcule le montant du virement selon le salaire courant
  applyActiveTransferPreset();

  const salary = parseAmount(fields.salary.value);
  const bonus = parseAmount(fields.bonus.value);
  const fixedCharges = getDynamicTotal('fixedCharges');
  const personalExpenses = getDynamicTotal('personalExpenses');
  const groceryExpenses = getDynamicTotal('groceryExpenses');
  const manualTransfer = getManualTransferAmount();

  const totalIncome = salary + bonus + getPonctualsTotal();
  const totalObligations = fixedCharges + personalExpenses + groceryExpenses + manualTransfer;

  // Reste à vivre = revenus − obligations
  const remainingIncome = totalIncome - totalObligations;

  const startBalance = checkingBalance;
  const ccDynamic = startBalance + totalIncome - totalObligations;
  const ccDetailEl = document.getElementById('checkingCalcDetail');
  if (ccDetailEl) {
    ccDetailEl.textContent =
      `${formatCurrency(startBalance)} (départ) + ${formatCurrency(totalIncome)} (entrées) − ${formatCurrency(totalObligations)} (sorties)`;
  }
  const checkingProjectedEl = document.getElementById('checkingSummary');
  if (checkingProjectedEl) {
    checkingProjectedEl.textContent = `Solde projeté fin de mois : ${formatCurrency(ccDynamic)}`;
    checkingProjectedEl.style.color = ccDynamic >= 0 ? '#34d399' : '#f87171';
  }

  const savingCapacity = remainingIncome * 0.15;

  const totalLiquid = bankAccounts.reduce((sum, account) => sum + parseAmount(account.balance), 0);
  const cushionMonths = totalObligations > 0 ? totalLiquid / totalObligations : 0;
  const cushionEl = document.getElementById('securityCushion');
  const cushionStatus = document.getElementById('securityCushionStatus');
  if (cushionEl) cushionEl.textContent = cushionMonths.toFixed(1) + ' mois';
  if (cushionStatus) {
    let statusColor, statusText;
    if (cushionMonths < 3) {
      statusColor = '#f87171';
      statusText = '⚠ Insuffisant — cible : 3 mois minimum';
    } else if (cushionMonths < 6) {
      statusColor = '#fbbf24';
      statusText = '● Correct — cible : 6 mois idéal';
    } else {
      statusColor = '#34d399';
      statusText = '✓ Solide — matelas sécurisé';
    }
    cushionStatus.innerHTML = `<span class="calc-detail">${formatCurrency(totalLiquid)} (banque) ÷ ${formatCurrency(totalObligations)} (obligations/mois)</span><span style="display:block;color:${statusColor}">${statusText}</span>`;
  }

  totalIncomeEl.textContent = formatCurrency(totalIncome);
  totalObligationsEl.textContent = formatCurrency(totalObligations);
  remainingIncomeEl.textContent = formatCurrency(remainingIncome);
  savingCapacityEl.textContent = formatCurrency(savingCapacity);

  // Budget / jour restant dans le mois
  const dailyBudgetEl = document.getElementById('dailyBudget');
  const dailyBudgetSubEl = document.getElementById('dailyBudgetSub');
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate();
  if (dailyBudgetEl) {
    if (daysLeft > 0 && remainingIncome > 0) {
      dailyBudgetEl.textContent = `${formatCurrency(remainingIncome / daysLeft)} /j`;
    } else {
      dailyBudgetEl.textContent = '—';
    }
  }
  if (dailyBudgetSubEl) {
    dailyBudgetSubEl.textContent = `${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''} ce mois`;
  }

  // Deltas vs dernier mois archivé
  const incomeDeltaEl = document.getElementById('incomeDelta');
  const obligationsDeltaEl = document.getElementById('obligationsDelta');
  if (monthlyArchives && monthlyArchives.length > 0) {
    const sorted = [...monthlyArchives].sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    const last = sorted[sorted.length - 1];
    if (incomeDeltaEl) {
      const diff = totalIncome - (last.totalIncome || 0);
      incomeDeltaEl.textContent = `${diff >= 0 ? '+' : ''}${formatCurrency(diff)} vs ${last.displayDate}`;
      incomeDeltaEl.style.color = diff >= 0 ? 'var(--accent)' : '#f87171';
    }
    if (obligationsDeltaEl) {
      const diff = totalObligations - (last.totalObligations || 0);
      obligationsDeltaEl.textContent = `${diff >= 0 ? '+' : ''}${formatCurrency(diff)} vs ${last.displayDate}`;
      obligationsDeltaEl.style.color = diff <= 0 ? 'var(--accent)' : '#f87171';
    }
  } else {
    if (incomeDeltaEl) incomeDeltaEl.textContent = '';
    if (obligationsDeltaEl) obligationsDeltaEl.textContent = '';
  }

  updateManualTransferSummary();
  updateAlertSystem(remainingIncome);
  updateSavingsRateIndicator(totalIncome);

  return remainingIncome;
}

function updateDashboard() {
  calculerRestant();

  updateTotalPatrimony();
  updateHomeCharts();
  refreshBankRows();
  updateForecast();
  updateInflation();
  checkBudgetAlerts();
  renderGoals();
  createOrUpdateSixMonthChart();
  updateDebtRatio();
  updateHealthScoreBadge();
  updateUpcomingCharges();
  updateHeroBar();
  updateBudgetDonutChart();
}

function getSavingsContributionTotal() {
  const peaSavings = peaActions.reduce((total, action) => total + getPeaTotalInvested(action), 0);
  const cryptoSavings = cryptoAssets.reduce((total, asset) => total + (parseAmount(asset.quantity) * parseAmount(asset.buyPrice)), 0);
  const natixisSavings = natixisPlacements.reduce((total, placement) => total + parseAmount(placement.initialCapital), 0);
  const bankSavings = bankAccounts.reduce((total, account) => total + parseAmount(account.balance), 0);

  return peaSavings + cryptoSavings + natixisSavings + bankSavings;
}

function getSavingsRateColor(rate) {
  if (rate > 20) {
    return '#10b981';
  }

  if (rate >= 10) {
    return '#f59e0b';
  }

  return '#ef4444';
}

function getSavedObjectiveAmount() {
  const rawValue = localStorage.getItem(OBJECTIVE_STORAGE_KEY);

  if (!rawValue) {
    return objectifMontant;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return objectifMontant;
  }

  return parsedValue;
}

function saveObjectiveAmount(value) {
  localStorage.setItem(OBJECTIVE_STORAGE_KEY, String(value));
}

function getSavingsRateLabel(rate) {
  if (rate > 20) {
    return 'Excellent';
  }

  if (rate >= 10) {
    return 'À surveiller';
  }

  return 'À renforcer';
}

function getSavedSavingsRateSnapshot() {
  const rawSnapshot = localStorage.getItem(SAVINGS_RATE_STORAGE_KEY);

  if (!rawSnapshot) {
    return null;
  }

  try {
    const parsedSnapshot = JSON.parse(rawSnapshot);

    if (!parsedSnapshot || typeof parsedSnapshot !== 'object') {
      return null;
    }

    return {
      currentMonthKey: typeof parsedSnapshot.currentMonthKey === 'string' ? parsedSnapshot.currentMonthKey : null,
      currentRate: Number.isFinite(Number(parsedSnapshot.currentRate)) ? Number(parsedSnapshot.currentRate) : null,
      previousMonthKey: typeof parsedSnapshot.previousMonthKey === 'string' ? parsedSnapshot.previousMonthKey : null,
      previousRate: Number.isFinite(Number(parsedSnapshot.previousRate)) ? Number(parsedSnapshot.previousRate) : null,
    };
  } catch {
    return null;
  }
}

function saveSavingsRateSnapshot(snapshot) {
  localStorage.setItem(SAVINGS_RATE_STORAGE_KEY, JSON.stringify(snapshot));
}

function updateSavingsRateIndicator(totalIncome) {
  const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const savedSnapshot = getSavedSavingsRateSnapshot();
  const savingsTotal = getSavingsContributionTotal();
  const savingsRate = totalIncome > 0 ? (savingsTotal / totalIncome) * 100 : 0;
  const rateColor = getSavingsRateColor(savingsRate);
  const progressAngle = Math.max(0, Math.min(360, savingsRate * 3.6));
  let previousRate = null;

  if (savedSnapshot?.currentMonthKey === currentMonthKey) {
    previousRate = savedSnapshot.previousRate;
  } else if (savedSnapshot?.currentMonthKey) {
    previousRate = savedSnapshot.currentRate;
  }

  const nextSnapshot = {
    currentMonthKey,
    currentRate: savingsRate,
    previousMonthKey: savedSnapshot?.currentMonthKey ?? null,
    previousRate: savedSnapshot?.currentMonthKey === currentMonthKey ? savedSnapshot.previousRate : savedSnapshot?.currentRate ?? null,
  };

  saveSavingsRateSnapshot(nextSnapshot);

  if (savingsRateGaugeEl) {
    savingsRateGaugeEl.style.background = `conic-gradient(${rateColor} ${progressAngle}deg, rgba(56, 189, 248, 0.16) ${progressAngle}deg 360deg)`;
  }

  if (savingsRatePercentEl) {
    savingsRatePercentEl.textContent = `${savingsRate.toFixed(1)}%`;
    savingsRatePercentEl.style.color = rateColor;
  }

  if (savingsRateStatusEl) {
    savingsRateStatusEl.textContent = getSavingsRateLabel(savingsRate);
    savingsRateStatusEl.style.color = rateColor;
  }

  if (savingsRateDetailEl) {
    savingsRateDetailEl.textContent = `Revenus : ${formatCurrency(totalIncome)} • Épargne estimée : ${formatCurrency(savingsTotal)}`;
  }

  if (savingsRateTrendEl && savingsRateTrendIconEl) {
    if (previousRate === null || previousRate === undefined) {
      savingsRateTrendEl.textContent = 'Aucune donnée du mois précédent.';
      savingsRateTrendIconEl.className = 'fa-solid fa-minus';
      savingsRateTrendIconEl.style.color = 'var(--muted)';
      return;
    }

    const difference = savingsRate - previousRate;

    if (difference >= 0) {
      savingsRateTrendIconEl.className = 'fa-solid fa-arrow-up';
      savingsRateTrendIconEl.style.color = '#10b981';
      savingsRateTrendEl.textContent = `${difference.toFixed(1)} pts vs mois précédent`;
      return;
    }

    savingsRateTrendIconEl.className = 'fa-solid fa-arrow-down';
    savingsRateTrendIconEl.style.color = '#ef4444';
    savingsRateTrendEl.textContent = `${Math.abs(difference).toFixed(1)} pts vs mois précédent`;
  }
}

function updateHealthScoreBadge() {
  const badge = document.getElementById('healthScoreBadge');
  if (!badge) return;

  const income = parseAmount(fields.salary.value) + parseAmount(fields.bonus.value) + getPonctualsTotal();
  if (income <= 0) {
    badge.textContent = '';
    badge.className = 'health-score-badge';
    return;
  }

  const savings = getManualTransferAmount();
  const savingsRate = (savings / income) * 100;

  const fixed = getDynamicTotal('fixedCharges');
  const debtRatio = (fixed / income) * 100;

  const totalObl = fixed + getDynamicTotal('personalExpenses') + getDynamicTotal('groceryExpenses') + savings;
  // Disponible réel : inclut le solde CC (si négatif, c'est pénalisant)
  const remaining = checkingBalance + income - totalObl;
  const balancePct = (remaining / income) * 100;

  // Score sur 100 : épargne 40% + taux d'endettement 40% + solde positif 20%
  const savScore = savingsRate >= 20 ? 100 : savingsRate >= 10 ? 50 + (savingsRate - 10) * 5 : savingsRate * 5;
  const debtScore = debtRatio <= 20 ? 100 : debtRatio <= 33 ? 100 - ((debtRatio - 20) / 13) * 40 : debtRatio <= 50 ? 60 - ((debtRatio - 33) / 17) * 60 : 0;
  const balScore = balancePct >= 20 ? 100 : balancePct > 0 ? balancePct * 5 : 0;

  const score = Math.round(savScore * 0.4 + debtScore * 0.4 + balScore * 0.2);

  let label, cls;
  if (score >= 80)      { label = '🏆 Excellent';     cls = 'health-green'; }
  else if (score >= 60) { label = '✅ Bonne santé';    cls = 'health-yellow'; }
  else if (score >= 40) { label = '⚠ À surveiller';   cls = 'health-orange'; }
  else                  { label = '🚨 À améliorer';   cls = 'health-red'; }

  badge.textContent = `Score ${score}/100 — ${label}`;
  badge.className = `health-score-badge ${cls}`;
}

function renderDynamicSection(sectionKey) {
  const container = DYNAMIC_SECTION_BINDINGS[sectionKey];
  const items = dynamicSections[sectionKey];

  container.innerHTML = '';

  if (items.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'dynamic-empty';
    emptyState.textContent = 'Aucune ligne ajoutée pour le moment.';
    container.appendChild(emptyState);
    return;
  }

  items.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'dynamic-entry';

    const showDayField = sectionKey === 'fixedCharges';
    const showDate = sectionKey === 'personalExpenses' || sectionKey === 'groceryExpenses';

    row.innerHTML = `
      <label>
        <span>Nom</span>
        <input type="text" value="${item.name}" data-section="${sectionKey}" data-index="${index}" data-field="name" placeholder="Ex : Café, Netflix..." />
      </label>
      <label>
        <span>Montant (€)</span>
        <input type="number" min="0" step="0.01" value="${item.amount}" data-section="${sectionKey}" data-index="${index}" data-field="amount" inputmode="decimal" />
      </label>
      ${showDayField ? `
        <label>
          <span>Jour</span>
          <input type="number" min="1" max="31" step="1" value="${item.day ?? 1}" data-section="${sectionKey}" data-index="${index}" data-field="day" inputmode="numeric" />
        </label>
        <label class="recurring-toggle-label" title="Se renouvelle automatiquement au mois suivant">
          <input type="checkbox" class="recurring-checkbox" data-section="${sectionKey}" data-index="${index}" data-field="recurring" ${item.recurring ? 'checked' : ''} />
          <span class="recurring-toggle-text"><i class="fa-solid fa-rotate"></i> Récurrent</span>
        </label>
      ` : ''}
      ${showDate ? `
        <label>
          <span>Date</span>
          <input type="date" data-section="${sectionKey}" data-index="${index}" data-field="date" value="${item.date || ''}" />
        </label>
      ` : ''}
      <button type="button" class="danger-btn icon-btn" data-remove-section="${sectionKey}" data-index="${index}" aria-label="Supprimer la ligne">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    `;

    container.appendChild(row);
  });
}

function renderAllDynamicSections() {
  Object.keys(DYNAMIC_SECTION_BINDINGS).forEach((sectionKey) => {
    renderDynamicSection(sectionKey);
  });
}

function addDynamicLine(sectionKey) {
  dynamicSections[sectionKey].push(
    sectionKey === 'fixedCharges'
      ? { name: '', amount: 0, day: 1, recurring: false }
      : { name: '', amount: 0, date: '' }
  );
  renderDynamicSection(sectionKey);
  saveFormData();
  updateDashboard();
}

function updateDynamicLine(sectionKey, index, field, value) {
  if (!dynamicSections[sectionKey] || !dynamicSections[sectionKey][index]) {
    return;
  }

  if (field === 'name') {
    dynamicSections[sectionKey][index].name = String(value);
  }

  if (field === 'amount') {
    dynamicSections[sectionKey][index].amount = parseAmount(value);
  }

  if (field === 'day') {
    dynamicSections[sectionKey][index].day = normalizeChargeDay(value);
  }

  if (field === 'recurring') {
    dynamicSections[sectionKey][index].recurring = value === true || value === 'true';
  }

  if (field === 'date') {
    dynamicSections[sectionKey][index].date = value;
  }

  saveFormData();
  updateDashboard();
}

function removeDynamicLine(sectionKey, index) {
  dynamicSections[sectionKey].splice(index, 1);
  renderDynamicSection(sectionKey);
  saveFormData();
  updateDashboard();
}

function bindDynamicSectionListeners() {
  Object.keys(DYNAMIC_SECTION_BINDINGS).forEach((sectionKey) => {
    const container = DYNAMIC_SECTION_BINDINGS[sectionKey];

    container.addEventListener('input', (event) => {
      const { section, index, field } = event.target.dataset;

      if (section === undefined || index === undefined || field === undefined) {
        return;
      }

      const value = field === 'recurring' ? event.target.checked : event.target.value;
      updateDynamicLine(section, Number(index), field, value);
    });

    container.addEventListener('click', (event) => {
      const removeSection = event.target.dataset.removeSection;
      const removeIndex = event.target.dataset.index;

      if (!removeSection || removeIndex === undefined) {
        return;
      }

      removeDynamicLine(removeSection, Number(removeIndex));
    });
  });

  document.querySelectorAll('[data-add-section]').forEach((button) => {
    button.addEventListener('click', () => {
      addDynamicLine(button.dataset.addSection);
    });
  });
}

function getPonctualsTotal() {
  return ponctuels.reduce((sum, p) => sum + parseAmount(p.amount), 0);
}

function updatePonctualsTotal() {
  if (!ponctualsTotalEl) return;
  const total = getPonctualsTotal();
  ponctualsTotalEl.textContent = `Total rentrées : ${formatCurrency(total)}`;
  ponctualsTotalEl.classList.toggle('income-extras-total-active', total > 0);
}

function savePonctuels() {
  localStorage.setItem(PONCTUELS_STORAGE_KEY, JSON.stringify(ponctuels));
}

function loadPonctuels() {
  try {
    const raw = localStorage.getItem(PONCTUELS_STORAGE_KEY);
    ponctuels = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(ponctuels)) ponctuels = [];
  } catch { ponctuels = []; }
  renderPonctuals();
  updatePonctualsTotal();
}

function updateCheckingSummary() {
  if (!checkingSummaryEl) return;
  checkingSummaryEl.textContent = `Solde actuel : ${formatCurrency(checkingBalance)}`;
  checkingSummaryEl.classList.toggle('checking-summary-negative', checkingBalance < 0);
  checkingSummaryEl.classList.toggle('checking-summary-positive', checkingBalance > 0);
}

function saveCheckingBalance() {
  localStorage.setItem(CHECKING_BALANCE_STORAGE_KEY, String(Math.round(checkingBalance * 100) / 100));
}

function loadCheckingBalance() {
  const raw = localStorage.getItem(CHECKING_BALANCE_STORAGE_KEY);
  checkingBalance = raw !== null ? Math.round((parseFloat(raw) || 0) * 100) / 100 : 0;
  if (checkingBalanceInput) checkingBalanceInput.value = checkingBalance !== 0 ? checkingBalance.toFixed(2) : '';
  updateCheckingSummary();
}

function bindPonctualsListeners() {
  if (addPonctualBtn) {
    addPonctualBtn.addEventListener('click', () => {
      ponctuels.push({ description: '', amount: 0 });
      renderPonctuals();
      savePonctuels();
      updatePonctualsTotal();
      calculerRestant();
    });
  }

  if (ponctualsListEl) {
    ponctualsListEl.addEventListener('input', (e) => {
      const idx = e.target.dataset.ponctualIndex;
      const field = e.target.dataset.ponctualField;
      if (idx === undefined || !field) return;
      const i = parseInt(idx, 10);
      if (field === 'amount') {
        ponctuels[i].amount = parseAmount(e.target.value);
      } else {
        ponctuels[i].description = e.target.value;
      }
      updatePonctualsTotal();
      savePonctuels();
      calculerRestant();
    });

    ponctualsListEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-remove-ponctual]');
      if (!btn) return;
      const i = parseInt(btn.dataset.removePonctual, 10);
      ponctuels.splice(i, 1);
      renderPonctuals();
      updatePonctualsTotal();
      savePonctuels();
      calculerRestant();
    });
  }

  if (checkingBalanceInput) {
    checkingBalanceInput.addEventListener('input', () => {
      checkingBalance = parseFloat(checkingBalanceInput.value) || 0;
      saveCheckingBalance();
      updateTotalPatrimony();
      calculerRestant();
      updateForecast();
    });

    checkingBalanceInput.addEventListener('blur', () => {
      saveCheckingBalance();
    });

    checkingBalanceInput.addEventListener('focus', () => {
      checkingBalanceInput.style.color = 'var(--text)';
    });
  }
}

function cleanupNonRecurringCharges() {
  const before = dynamicSections.fixedCharges.length;
  dynamicSections.fixedCharges = dynamicSections.fixedCharges.filter((c) => c.recurring !== false);
  const removed = before - dynamicSections.fixedCharges.length;
  if (removed > 0) {
    renderDynamicSection('fixedCharges');
    saveFormData();
    updateDashboard();
    showToast(`${removed} charge${removed > 1 ? 's' : ''} non-récurrente${removed > 1 ? 's' : ''} retirée${removed > 1 ? 's' : ''} après clôture.`);
  }
}

function updateDebtRatio() {
  const valueEl = document.getElementById('debtRatioValue');
  const badgeEl = document.getElementById('debtRatioBadge');
  const barEl = document.getElementById('debtRatioBar');
  const labelEl = document.getElementById('debtRatioLabel');
  if (!valueEl || !badgeEl || !barEl || !labelEl) return;

  const income = parseAmount(fields.salary.value) + parseAmount(fields.bonus.value);
  const fixed = getDynamicTotal('fixedCharges');

  if (income <= 0) {
    valueEl.textContent = '—';
    badgeEl.textContent = '—';
    badgeEl.className = 'debt-ratio-badge';
    barEl.style.width = '0%';
    barEl.className = 'debt-ratio-bar-fill';
    labelEl.textContent = 'Renseignez vos revenus pour calculer le ratio.';
    return;
  }

  const ratio = (fixed / income) * 100;
  const clamped = Math.min(100, ratio);
  valueEl.textContent = `${ratio.toFixed(1)} %`;
  barEl.style.width = `${clamped}%`;

  let cls, badge, label;
  if (ratio < 33) {
    cls = 'debt-ratio-good';
    badge = '✓ Sain';
    label = `Ratio sain — en dessous du seuil bancaire de 33 %`;
  } else if (ratio < 40) {
    cls = 'debt-ratio-warning';
    badge = '⚠ Élevé';
    label = `Ratio élevé — au-dessus du seuil bancaire de 33 %, surveillez vos charges.`;
  } else {
    cls = 'debt-ratio-danger';
    badge = '✕ Critique';
    label = `Ratio critique (${ratio.toFixed(1)} %) — accès au crédit difficile au-delà de 33 %.`;
  }

  badgeEl.textContent = badge;
  badgeEl.className = `debt-ratio-badge ${cls}`;
  barEl.className = `debt-ratio-bar-fill ${cls}`;
  labelEl.textContent = label;
}

function updateUpcomingCharges() {
  const el = document.getElementById('upcomingChargesList');
  if (!el) return;
  const todayDay = new Date().getDate();
  const upcoming = dynamicSections.fixedCharges
    .filter(c => c.day - todayDay >= 0 && c.day - todayDay <= 7)
    .sort((a, b) => a.day - b.day);

  if (!upcoming.length) {
    el.innerHTML = '<p class="dynamic-empty">Aucun prélèvement dans les 7 prochains jours.</p>';
    return;
  }
  el.innerHTML = upcoming.map(c => {
    const diff = c.day - todayDay;
    const label = diff === 0 ? 'Aujourd\'hui' : diff === 1 ? 'Demain' : `Dans ${diff}j`;
    const cls = diff === 0 ? 'upcoming-today' : diff <= 2 ? 'upcoming-soon' : 'upcoming-later';
    return `<div class="upcoming-charge-item ${cls}">
      <div class="upcoming-charge-info">
        <strong>${escapeHtml(c.name)}</strong>
      </div>
      <div class="upcoming-charge-right">
        <span class="upcoming-badge">${label}</span>
        <strong>${formatCurrency(c.amount)}</strong>
      </div>
    </div>`;
  }).join('');
}

function formatMonthLabel(monthStr) {
  const [year, month] = monthStr.split('-');
  return new Date(year, month - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function addSalaryEntry() {
  const month = document.getElementById('salaryHistoryMonth')?.value;
  const salary = parseAmount(document.getElementById('salaryHistorySalary')?.value);
  const bonus = parseAmount(document.getElementById('salaryHistoryBonus')?.value);
  if (!month || salary <= 0) return;

  const entry = { month, salary, bonus, date: new Date().toISOString() };
  const existing = salaryHistory.findIndex(e => e.month === month);
  if (existing >= 0) {
    salaryHistory[existing] = entry;
  } else {
    salaryHistory.push(entry);
  }

  saveSalaryHistory();
  renderSalaryHistory();
  showToast('Salaire enregistré.');
}

function removeSalaryEntry(month) {
  salaryHistory = salaryHistory.filter(e => e.month !== month);
  saveSalaryHistory();
  renderSalaryHistory();
}

function renderSalaryHistory() {
  const tbody = document.getElementById('salaryHistoryTableBody');
  if (!tbody) return;

  const sorted = [...salaryHistory].sort((a, b) => a.month.localeCompare(b.month));

  if (!sorted.length) {
    tbody.innerHTML = '<tr><td colspan="6">Aucun historique.</td></tr>';
  } else {
    tbody.innerHTML = sorted.map((entry, i) => {
      const total = entry.salary + entry.bonus;
      const prev = sorted[i - 1];
      const evolution = prev ? total - (prev.salary + prev.bonus) : null;
      const evoText = evolution === null ? '—' : `${evolution >= 0 ? '+' : ''}${formatCurrency(evolution)}`;
      const evoColor = evolution > 0 ? '#34d399' : evolution < 0 ? '#f87171' : 'var(--muted)';

      return `<tr>
        <td>${formatMonthLabel(entry.month)}</td>
        <td>${formatCurrency(entry.salary)}</td>
        <td>${formatCurrency(entry.bonus)}</td>
        <td><strong>${formatCurrency(total)}</strong></td>
        <td style="color:${evoColor}">${evoText}</td>
        <td>
          <button class="danger-btn icon-btn" data-remove-salary="${entry.month}">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>`;
    }).join('');
  }

  tbody.querySelectorAll('[data-remove-salary]').forEach(btn => {
    btn.addEventListener('click', () => removeSalaryEntry(btn.dataset.removeSalary));
  });

  updateSalaryHistoryChart(sorted);
}

function bindSalaryHistory() {
  document.getElementById('addSalaryHistoryBtn')?.addEventListener('click', addSalaryEntry);
}
