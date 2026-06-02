function getCurrentDashboardValues() {
  const salary = parseAmount(fields.salary.value);
  const bonus = parseAmount(fields.bonus.value);
  const fixedCharges = getDynamicTotal('fixedCharges');
  const personalExpenses = getDynamicTotal('personalExpenses');
  const groceryExpenses = getDynamicTotal('groceryExpenses');
  const manualTransfer = getManualTransferAmount();

  // Archives : FLUX mensuel (revenus - dépenses), pas le solde CC courant
  const totalIncome = salary + bonus + getPonctualsTotal();
  const totalObligations = fixedCharges + personalExpenses + groceryExpenses + manualTransfer;
  const remainingIncome = totalIncome - totalObligations;

  const savings = manualTransfer;

  // Reste final = flux mensuel net (hors épargne déjà comptée dans obligations)
  const finalBalance = remainingIncome;

  return {
    totalIncome,
    totalObligations,
    remainingIncome,
    savings,
    finalBalance,
  };
}

function loadArchives() {
  const savedArchives = localStorage.getItem(ARCHIVE_STORAGE_KEY);

  if (!savedArchives) {
    monthlyArchives = [];
    return;
  }

  try {
    const parsedArchives = JSON.parse(savedArchives);

    monthlyArchives = Array.isArray(parsedArchives)
      ? parsedArchives.map((archive) => ({
          ...archive,
          netWorth: typeof archive?.netWorth === 'number' && Number.isFinite(archive.netWorth)
            ? archive.netWorth
            : parseAmount(archive?.finalBalance),
        }))
      : [];
  } catch {
    monthlyArchives = [];
  }
}

function saveArchives() {
  localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(monthlyArchives));
}

function renderArchivesTable() {
  archiveTableBody.innerHTML = '';

  if (!monthlyArchives.length) {
    archiveStatusEl.textContent = 'Aucune archive pour le moment.';

    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="5">Aucune archive enregistrée.</td>';
    archiveTableBody.appendChild(row);
    updateHomeCharts();
    return;
  }

  const sortedArchives = [...monthlyArchives].sort((a, b) => b.monthKey.localeCompare(a.monthKey));

  sortedArchives.forEach((archive) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${archive.displayDate}</td>
      <td>${formatCurrency(archive.totalIncome)}</td>
      <td>${formatCurrency(archive.totalObligations)}</td>
      <td>${formatCurrency(archive.savings)}</td>
      <td>${formatCurrency(archive.finalBalance)}</td>
    `;

    archiveTableBody.appendChild(row);
  });

  archiveStatusEl.textContent = `${sortedArchives.length} archive${sortedArchives.length > 1 ? 's' : ''} enregistrée${sortedArchives.length > 1 ? 's' : ''}.`;
  updateHomeCharts();
}

function closeCurrentMonth() {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const displayDate = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).replace(/^./, (character) => character.toUpperCase());
  const snapshot = getCurrentDashboardValues();

  const archive = {
    monthKey,
    displayDate,
    totalIncome: snapshot.totalIncome,
    totalObligations: snapshot.totalObligations,
    remainingIncome: snapshot.remainingIncome,
    savings: snapshot.savings,
    finalBalance: snapshot.finalBalance,
    netWorth: getTotalPatrimony(),
  };

  const existingIndex = monthlyArchives.findIndex((item) => item.monthKey === monthKey);

  if (existingIndex >= 0) {
    monthlyArchives[existingIndex] = archive;
  } else {
    monthlyArchives.push(archive);
  }

  saveArchives();
  renderArchivesTable();
  archiveStatusEl.textContent = `Archive enregistrée pour ${displayDate}.`;
  cleanupNonRecurringCharges();

  // Réinitialiser les rentrées exceptionnelles du mois
  ponctuels = [];
  renderPonctuals();
  updatePonctualsTotal();
  savePonctuels();
  calculerRestant();
}

// ─── PRÉVISION FIN DE MOIS ──────────────────────────────────
function updateForecast() {
  const el = document.getElementById('forecastEndOfMonth');
  if (!el) return;
  const now = new Date();
  const day = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
  const daysLeft = daysInMonth - day;
  const salary = parseAmount(fields.salary?.value);
  const bonus = parseAmount(fields.bonus?.value);
  const income = salary + bonus + getPonctualsTotal();
  const fixed = getDynamicTotal('fixedCharges');
  const perso = getDynamicTotal('personalExpenses');
  const grocery = getDynamicTotal('groceryExpenses');
  const manual = getManualTransferAmount();
  const total = fixed + perso + grocery + manual;
  const remaining = income - total;
  const projected = checkingBalance + remaining;
  const daily = daysLeft > 0 && projected > 0 ? projected / daysLeft : 0;
  const hasCC = checkingBalance !== 0;
  el.innerHTML = `
    ${hasCC ? `<div class="forecast-row"><span>Solde CC actuel</span><strong class="${checkingBalance>=0?'forecast-positive':'forecast-negative'}">${formatCurrency(checkingBalance)}</strong></div>` : ''}
    <div class="forecast-row"><span>Revenus du mois</span><strong>${formatCurrency(income)}</strong></div>
    <div class="forecast-row"><span>Dépenses estimées</span><strong>${formatCurrency(total)}</strong></div>
    <div class="forecast-row forecast-highlight"><span>${hasCC ? 'Solde projeté au' : 'Reste estimé au'} ${daysInMonth}/${now.getMonth()+1}</span><strong class="${projected>=0?'forecast-positive':'forecast-negative'}">${formatCurrency(projected)}</strong></div>
    <div class="forecast-row"><span>Jours restants</span><strong>${daysLeft}j</strong></div>
    <div class="forecast-row"><span>Budget / jour restant</span><strong>${daily>0?formatCurrency(daily)+' /j':'—'}</strong></div>
  `;
}

// ─── INFLATION PERSONNELLE ──────────────────────────────────
function updateInflation() {
  const el = document.getElementById('personalInflationRate');
  if (!el) return;
  const sorted = [...monthlyArchives].sort((a,b) => a.monthKey.localeCompare(b.monthKey));
  if (sorted.length < 2) { el.textContent = 'Données insuffisantes (min. 2 mois archivés)'; return; }
  const prev = sorted[sorted.length-2], curr = sorted[sorted.length-1];
  const prevObl = prev.totalObligations||0, currObl = curr.totalObligations||0;
  if (!prevObl) { el.textContent = '—'; return; }
  const rate = ((currObl - prevObl) / prevObl) * 100;
  el.innerHTML = `<span class="${rate>=0?'forecast-negative':'forecast-positive'}">${rate>=0?'+':''}${rate.toFixed(1)}%</span> vs ${prev.displayDate}`;
}

// ─── EXPORT PDF ─────────────────────────────────────────────
function exportMonthlyPDF() {
  const now = new Date();
  const monthLabel = now.toLocaleDateString('fr-FR', {month:'long', year:'numeric'});
  const income = parseAmount(fields.salary?.value) + parseAmount(fields.bonus?.value);
  const patrimony = getTotalPatrimony();
  const breakdown = getInvestmentBreakdown();
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>Rapport ${monthLabel}</title>
  <style>body{font-family:'Segoe UI',sans-serif;color:#1e293b;padding:2rem;max-width:800px;margin:0 auto}
  h1{color:#0369a1;border-bottom:2px solid #0369a1;padding-bottom:.5rem}h2{color:#0284c7;margin-top:1.5rem}
  table{width:100%;border-collapse:collapse;margin-top:1rem}th{background:#0369a1;color:#fff;padding:.6rem 1rem;text-align:left}
  td{padding:.55rem 1rem;border-bottom:1px solid #e2e8f0}tr:nth-child(even) td{background:#f0f9ff}
  .total{font-weight:700;background:#dbeafe!important}.pos{color:#059669}.neg{color:#dc2626}
  footer{margin-top:2rem;font-size:.85rem;color:#94a3b8;text-align:center}</style></head><body>
  <h1>📊 Rapport Financier — ${monthLabel}</h1>
  <h2>Résumé</h2>
  <table><tr><th>Indicateur</th><th>Montant</th></tr>
    <tr><td>Revenus totaux</td><td>${formatCurrency(income)}</td></tr>
    <tr><td>Obligations totales</td><td>${formatCurrency(getDynamicTotal('fixedCharges')+getDynamicTotal('personalExpenses')+getDynamicTotal('groceryExpenses')+getManualTransferAmount())}</td></tr>
    <tr class="total"><td>Patrimoine total</td><td>${formatCurrency(patrimony)}</td></tr>
  </table>
  <h2>Répartition du patrimoine</h2>
  <table><tr><th>Poche</th><th>Valeur</th></tr>
    <tr><td>PEA</td><td>${formatCurrency(breakdown.pea)}</td></tr>
    <tr><td>Crypto</td><td>${formatCurrency(breakdown.crypto)}</td></tr>
    <tr><td>Natixis</td><td>${formatCurrency(breakdown.natixis)}</td></tr>
    <tr><td>Banque</td><td>${formatCurrency(breakdown.banque)}</td></tr>
  </table>
  <footer>Généré le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR')} — Dashboard Financier PWA</footer>
  </body></html>`;
  const blob = new Blob([html], {type:'text/html'});
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) win.addEventListener('load', () => { win.print(); URL.revokeObjectURL(url); });
  showToast('Rapport prêt à imprimer / sauvegarder en PDF.');
}
