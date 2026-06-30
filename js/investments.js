function calculateEstimatedInterest(balance, annualRate) {
  return parseAmount(balance) * (parseAmount(annualRate) / 100);
}

function refreshBankRows() {
  if (!bankAccountsTableBody) return;
  const rows = bankAccountsTableBody.querySelectorAll('tr[data-bank-row]');
  if (rows.length !== bankAccounts.length) { renderBankAccountsTable(); return; }
  let total = 0;
  bankAccounts.forEach((account, i) => {
    const interest = calculateEstimatedInterest(account.balance, account.annualRate);
    const cell = rows[i] ? rows[i].querySelector('[data-bank-interest]') : null;
    if (cell) cell.textContent = formatCurrency(interest);
    total += parseAmount(account.balance);
  });
  if (bankAccountsTotalValueEl) bankAccountsTotalValueEl.textContent = formatCurrency(total);
  updateTotalPatrimony();
}

function renderBankAccountsTable() {
  if (!bankAccountsTableBody) {
    return;
  }

  const totalBankAvoirs = bankAccounts.reduce((total, account) => total + parseAmount(account.balance), 0);

  bankAccountsTableBody.innerHTML = '';

  if (bankAccounts.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="5">Aucun compte bancaire enregistré.</td>';
    bankAccountsTableBody.appendChild(row);
  } else {
    bankAccounts.forEach((account, index) => {
      const row = document.createElement('tr');
      row.setAttribute('data-bank-row', index);
      const estimatedInterest = calculateEstimatedInterest(account.balance, account.annualRate);

      row.innerHTML = `
        <td>${account.name}</td>
        <td>
          <input type="number" min="0" step="0.01" value="${account.balance}" data-bank-index="${index}" data-bank-field="balance" inputmode="decimal" class="bank-balance-input" />
        </td>
        <td>${account.annualRate.toFixed(2)} %</td>
        <td data-bank-interest>${formatCurrency(estimatedInterest)}</td>
        <td><button type="button" class="danger-btn icon-btn" data-bank-remove-index="${index}" aria-label="Supprimer le compte"><i class="fa-solid fa-trash-can"></i></button></td>
      `;

      bankAccountsTableBody.appendChild(row);
    });
  }

  const totalRow = document.createElement('tr');
  totalRow.className = 'bank-total-row';
  totalRow.innerHTML = `
    <td colspan="3">Total des avoirs bancaires</td>
    <td>${formatCurrency(totalBankAvoirs)}</td>
    <td></td>
  `;
  bankAccountsTableBody.appendChild(totalRow);

  if (bankAccountsTotalValueEl) {
    bankAccountsTotalValueEl.textContent = formatCurrency(totalBankAvoirs);
  }
}

function updateBankAccount(index, field, value) {
  if (!bankAccounts[index]) {
    return;
  }

  if (field === 'balance') {
    bankAccounts[index].balance = parseAmount(value);
  }

  saveFormData();
  updateDashboard();
}

function removeBankAccount(index) {
  bankAccounts.splice(index, 1);
  saveFormData();
  updateDashboard();
  renderBankAccountsTable();
}

function addBankAccount() {
  const name = bankAccountNameInput.value.trim();
  const annualRate = parseAmount(bankAccountRateInput.value);
  const balance = parseAmount(bankAccountBalanceInput.value);

  if (!name) {
    return;
  }

  bankAccounts.push({
    name,
    annualRate,
    balance,
  });

  bankAccountNameInput.value = '';
  bankAccountRateInput.value = '';
  bankAccountBalanceInput.value = '';

  saveFormData();
  updateDashboard();
  renderBankAccountsTable();
}

function bindBankAccountsListeners() {
  if (addBankAccountButton) {
    addBankAccountButton.addEventListener('click', addBankAccount);
  }

  if (bankAccountsTableBody) {
    bankAccountsTableBody.addEventListener('input', (event) => {
      const index = event.target.dataset.bankIndex;
      const field = event.target.dataset.bankField;

      if (index === undefined || field === undefined) {
        return;
      }

      updateBankAccount(Number(index), field, event.target.value);
    });

    bankAccountsTableBody.addEventListener('click', (event) => {
      const removeIndex = event.target.closest('[data-bank-remove-index]')?.dataset.bankRemoveIndex;

      if (removeIndex === undefined) {
        return;
      }

      removeBankAccount(Number(removeIndex));
    });
  }
}

function resetSpecificSection(sectionKey) {
  const label = SPECIFIC_RESET_LABELS[sectionKey] || sectionKey;

  if (!confirm(`Voulez-vous vraiment réinitialiser la section ${label} ?`)) {
    return;
  }

  if (sectionKey === SPECIFIC_RESET_STORAGE_KEYS.chargesFixesData) {
    dynamicSections.fixedCharges = [];
    localStorage.removeItem(sectionKey);
    saveMainStorageSnapshot();
    renderAllDynamicSections();
    updateDashboard();
    showResetToast(label);
    return;
  }

  if (sectionKey === SPECIFIC_RESET_STORAGE_KEYS.depensesPersoData) {
    dynamicSections.personalExpenses = [];
    localStorage.removeItem(sectionKey);
    saveMainStorageSnapshot();
    renderAllDynamicSections();
    updateDashboard();
    showResetToast(label);
    return;
  }

  if (sectionKey === SPECIFIC_RESET_STORAGE_KEYS.natixisData) {
    natixisPlacements = [];
    localStorage.removeItem(sectionKey);
    saveMainStorageSnapshot();
    renderNatixisTable();
    updateDashboard();
    showResetToast(label);
    return;
  }

  if (sectionKey === SPECIFIC_RESET_STORAGE_KEYS.peaData) {
    peaActions = [];
    localStorage.removeItem(sectionKey);
    saveMainStorageSnapshot();
    renderPeaActions();
    updateDashboard();
    showResetToast(label);
    return;
  }

  if (sectionKey === SPECIFIC_RESET_STORAGE_KEYS.cryptoData) {
    cryptoAssets = normalizeCryptoAssets([...DEFAULT_CRYPTOS]);
    localStorage.removeItem(sectionKey);
    saveMainStorageSnapshot();
    renderCryptoTable();
    updateCryptoValues();
    updateDashboard();
    showResetToast(label);
  }
}

function resetSection(sectionName) {
  if (!confirm('Êtes-vous sûr de vouloir vider cette section ?')) {
    return;
  }

  if (sectionName === 'charges') {
    dynamicSections = { ...DEFAULT_DYNAMIC_SECTIONS };
    localStorage.removeItem(SECTION_STORAGE_KEYS.charges);
    saveMainStorageSnapshot();
    renderAllDynamicSections();
    updateDashboard();
    showResetToast('Charges');
    return;
  }

  if (sectionName === 'investments') {
    cryptoAssets = normalizeCryptoAssets([...DEFAULT_CRYPTOS]);
    peaActions = [];
    natixisPlacements = [];
    localStorage.removeItem(SECTION_STORAGE_KEYS.investments);
    saveMainStorageSnapshot();
    renderCryptoTable();
    updateCryptoValues();
    renderPeaActions();
    renderNatixisTable();
    updateDashboard();
    showResetToast('Investissements');
    return;
  }

  if (sectionName === 'mortgage') {
    fields.homePrice.value = 0;
    fields.personalContribution.value = 0;
    fields.loanAmount.value = 0;
    fields.interestRate.value = 0;
    fields.loanDuration.value = 0;
    localStorage.removeItem(SECTION_STORAGE_KEYS.mortgage);
    saveMainStorageSnapshot();
    updateMortgageTable();
    updateDashboard();
    showResetToast('Immobilier');
    return;
  }

  if (sectionName === 'bank') {
    bankAccounts = [];
    localStorage.removeItem(SECTION_STORAGE_KEYS.bank);
    saveMainStorageSnapshot();
    renderBankAccountsTable();
    updateDashboard();
    showResetToast('Banque');
    return;
  }

}

function bindResetSectionButtons() {
  document.querySelectorAll('[data-reset-specific-section]').forEach((button) => {
    button.addEventListener('click', () => {
      resetSpecificSection(button.dataset.resetSpecificSection);
    });
  });

  document.querySelectorAll('[data-reset-section]').forEach((button) => {
    button.addEventListener('click', () => {
      resetSection(button.dataset.resetSection);
    });
  });
}

function updatePeaPortfolioSummary() {
  const totalInvested = peaActions.reduce((total, action) => total + getPeaTotalInvested(action), 0);
  const totalCurrentValue = peaActions.reduce((total, action) => total + action.quantity * action.currentPrice, 0);
  const totalGain = totalCurrentValue - totalInvested;
  const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  peaTotalInvestedEl.textContent = formatCurrency(totalInvested);
  peaTotalCurrentValueEl.textContent = formatCurrency(totalCurrentValue);
  peaTotalGainEl.textContent = formatCurrency(totalGain);
  peaTotalGainPercentEl.textContent = `${totalGainPercent.toFixed(2)} %`;
  updateTotalPatrimony();
}

function calculateNatixisCurrentValue(placement) {
  return parseAmount(placement.initialCapital) * (1 + parseAmount(placement.performanceRate) / 100);
}

function getPeaCurrentValue() {
  return peaActions.reduce((total, action) => total + action.quantity * action.currentPrice, 0);
}

function getCryptoCurrentValue() {
  return cryptoAssets.reduce((total, asset) => total + getCryptoValueForAsset(asset), 0);
}

function getNatixisCurrentValue() {
  return natixisPlacements.reduce((total, placement) => total + calculateNatixisCurrentValue(placement), 0);
}

function getInvestmentBreakdown() {
  return {
    pea: getPeaCurrentValue(),
    crypto: getCryptoCurrentValue(),
    natixis: getNatixisCurrentValue(),
    banque: bankAccounts.reduce((total, account) => total + parseAmount(account.balance), 0),
    checking: checkingBalance,
  };
}

function getInvestmentBreakdownText() {
  const breakdown = getInvestmentBreakdown();
  return `PEA : ${formatCurrency(breakdown.pea)} | Crypto : ${formatCurrency(breakdown.crypto)} | Natixis : ${formatCurrency(breakdown.natixis)} | Banque : ${formatCurrency(breakdown.banque)} | CC : ${formatCurrency(breakdown.checking)}`;
}

function getTotalPatrimony() {
  const breakdown = getInvestmentBreakdown();
  return breakdown.pea + breakdown.crypto + breakdown.natixis + breakdown.banque + breakdown.checking;
}

function updateTotalPatrimony() {
  const total = getTotalPatrimony();
  const breakdownText = getInvestmentBreakdownText();

  if (totalPatrimonyEl) {
    totalPatrimonyEl.textContent = formatCurrency(total);
    totalPatrimonyEl.title = breakdownText;
  }

  const investmentBreakdownEl = document.getElementById('investmentBreakdown');

  if (investmentBreakdownEl) {
    investmentBreakdownEl.textContent = breakdownText;
    investmentBreakdownEl.title = breakdownText;
  }

  if (chargesChart) {
    const breakdown = getInvestmentBreakdown();
    chargesChart.data.datasets[0].data = [breakdown.pea, breakdown.crypto, breakdown.natixis, breakdown.banque];
    chargesChart.update();
  }

  // ── Répartition sécurisé vs croissance ───────────────────────
  const secure = bankAccounts.reduce((s, a) => s + a.balance, 0);
  const growth    = getPeaCurrentValue() + getCryptoCurrentValue() + getNatixisCurrentValue();
  const splitTotal = secure + growth;
  const securePct  = splitTotal > 0 ? (secure / splitTotal * 100) : 50;
  const growthPct  = 100 - securePct;

  const secureLabel = document.getElementById('splitSecureLabel');
  const growthLabel = document.getElementById('splitGrowthLabel');
  const secureBar   = document.getElementById('splitSecureBar');
  const growthBar   = document.getElementById('splitGrowthBar');
  const advice      = document.getElementById('splitAdvice');

  if (secureLabel) secureLabel.textContent = `Sécurisé — ${formatCurrency(secure)} (${securePct.toFixed(0)}%)`;
  if (growthLabel) growthLabel.textContent = `Croissance — ${formatCurrency(growth)} (${growthPct.toFixed(0)}%)`;
  if (secureBar)   secureBar.style.width   = securePct + '%';
  if (growthBar)   growthBar.style.width   = growthPct + '%';
  if (advice) {
    if (securePct > 80) {
      advice.textContent = '⚠ Trop sécurisé — ton argent ne travaille pas assez.';
    } else if (growthPct > 80) {
      advice.textContent = '⚠ Trop exposé — renforce ton matelas liquide.';
    } else {
      advice.textContent = '✓ Répartition équilibrée.';
    }
  }
}

function getPeaTotalInvested(action) {
  return parseAmount(action.buyPrice);
}

function getPeaUnitPrice(action) {
  const quantity = parseAmount(action.quantity);
  return quantity > 0 ? getPeaTotalInvested(action) / quantity : 0;
}

function refreshPeaRows() {
  const rows = peaActionsList.querySelectorAll('tbody tr');

  rows.forEach((row, index) => {
    const action = peaActions[index];

    if (!action) {
      return;
    }

    const totalInvested = getPeaTotalInvested(action);
    const unitPrice = getPeaUnitPrice(action);
    const currentValue = action.quantity * action.currentPrice;
    const gain = currentValue - totalInvested;
    const performance = totalInvested > 0 ? (gain / totalInvested) * 100 : 0;

    row.querySelector('[data-pea-metric="pru"]').textContent = formatCurrency(unitPrice);
    row.querySelector('[data-pea-metric="value"]').textContent = formatCurrency(currentValue);

    const gainCell = row.querySelector('[data-pea-metric="gain"]');
    gainCell.textContent = formatCurrency(gain);
    gainCell.className = gain >= 0 ? 'pea-gain-positive' : 'pea-gain-negative';

    const performanceCell = row.querySelector('[data-pea-metric="performance"]');
    performanceCell.textContent = `${performance.toFixed(2)} %`;
    performanceCell.className = gain >= 0 ? 'pea-gain-positive' : 'pea-gain-negative';
  });

  updatePeaPortfolioSummary();
}

function renderPeaActions() {
  peaActionsList.innerHTML = '';

  if (peaActions.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'dynamic-empty';
    emptyState.textContent = 'Aucune action ajoutée pour le moment.';
    peaActionsList.appendChild(emptyState);
    updatePeaPortfolioSummary();
    return;
  }

  const table = document.createElement('table');
  table.className = 'pea-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>Nom</th>
        <th>Quantité</th>
        <th>Total investi (€)</th>
        <th>PRU</th>
        <th>Prix actuel</th>
        <th>Frais (%)</th>
        <th>Valeur</th>
        <th>Plus-value</th>
        <th>Perf.</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector('tbody');

  peaActions.forEach((action, index) => {
    const totalInvested = getPeaTotalInvested(action);
    const unitPrice = getPeaUnitPrice(action);
    const currentValue = action.quantity * action.currentPrice;
    const gain = currentValue - totalInvested;
    const performance = totalInvested > 0 ? (gain / totalInvested) * 100 : 0;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <input type="text" value="${action.name}" data-pea-index="${index}" data-pea-field="name" placeholder="Ex : Hopium" />
      </td>
      <td>
        <input type="number" min="0" step="1" value="${action.quantity}" data-pea-index="${index}" data-pea-field="quantity" inputmode="numeric" />
      </td>
      <td>
        <input type="number" min="0" step="0.01" value="${action.buyPrice}" data-pea-index="${index}" data-pea-field="buyPrice" inputmode="decimal" placeholder="Ex : 1250" />
      </td>
      <td>
        <span class="pea-pru-readonly" data-pea-metric="pru" title="Calculé automatiquement">${formatCurrency(unitPrice)}</span>
      </td>
      <td>
        <input type="number" min="0" step="0.01" value="${action.currentPrice}" data-pea-index="${index}" data-pea-field="currentPrice" inputmode="decimal" />
      </td>
      <td>
        <input type="number" min="0" step="0.01" value="${action.fees || 0}" data-pea-index="${index}" data-pea-field="fees" inputmode="decimal" style="width:70px"/>
      </td>
      <td data-pea-metric="value">${formatCurrency(currentValue)}</td>
      <td data-pea-metric="gain" class="${gain >= 0 ? 'pea-gain-positive' : 'pea-gain-negative'}">${formatCurrency(gain)}</td>
      <td data-pea-metric="performance" class="${gain >= 0 ? 'pea-gain-positive' : 'pea-gain-negative'}">${performance.toFixed(2)} %</td>
      <td><button type="button" class="danger-btn" data-pea-remove-index="${index}">Supprimer</button></td>
    `;

    tbody.appendChild(row);
  });

  peaActionsList.appendChild(table);
  updatePeaPortfolioSummary();
}

function refreshNatixisRows() {
  const rows = natixisTableBody ? natixisTableBody.querySelectorAll('tr[data-natixis-row]') : [];
  if (rows.length !== natixisPlacements.length) { renderNatixisTable(); return; }
  natixisPlacements.forEach((p, i) => {
    const cell = rows[i] ? rows[i].querySelector('[data-natixis-value]') : null;
    if (cell) cell.textContent = formatCurrency(calculateNatixisCurrentValue(p));
  });
  if (natixisTotalValueEl) natixisTotalValueEl.textContent = formatCurrency(getNatixisCurrentValue());
  updateTotalPatrimony();
}

function renderNatixisTable() {
  natixisTableBody.innerHTML = '';

  if (natixisPlacements.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="6">Aucun placement Natixis ajouté.</td>';
    natixisTableBody.appendChild(row);
    natixisTotalValueEl.textContent = formatCurrency(0);
    updateTotalPatrimony();
    return;
  }

  natixisPlacements.forEach((placement, index) => {
    const currentValue = calculateNatixisCurrentValue(placement);
    const row = document.createElement('tr');
    row.setAttribute('data-natixis-row', index);

    row.innerHTML = `
      <td><input type="text" data-natixis-index="${index}" data-natixis-field="name" value="${placement.name}" placeholder="Ex : SICAV Rentrée" /></td>
      <td><input type="number" min="0" step="0.01" data-natixis-index="${index}" data-natixis-field="initialCapital" value="${placement.initialCapital}" inputmode="decimal" /></td>
      <td><input type="number" min="-100" step="0.01" data-natixis-index="${index}" data-natixis-field="performanceRate" value="${placement.performanceRate}" inputmode="decimal" /></td>
      <td><input type="number" min="0" step="0.01" data-natixis-index="${index}" data-natixis-field="fees" value="${placement.fees || 0}" inputmode="decimal" style="width:70px"/></td>
      <td data-natixis-value><strong>${formatCurrency(currentValue)}</strong></td>
      <td><button type="button" class="danger-btn" data-natixis-remove-index="${index}">Supprimer</button></td>
    `;

    natixisTableBody.appendChild(row);
  });

  natixisTotalValueEl.textContent = formatCurrency(getNatixisCurrentValue());
  updateTotalPatrimony();
}

function addPeaAction() {
  peaActions.push({ name: '', quantity: 0, buyPrice: 0, currentPrice: 0 });
  renderPeaActions();
  saveFormData();
}

function addNatixisPlacement() {
  natixisPlacements.push({ name: '', initialCapital: 0, performanceRate: 0 });
  renderNatixisTable();
  saveFormData();
}

function updateNatixisPlacement(index, field, value) {
  if (!natixisPlacements[index]) {
    return;
  }

  if (field === 'name') {
    natixisPlacements[index].name = String(value);
  }

  if (field === 'initialCapital') {
    natixisPlacements[index].initialCapital = parseAmount(value);
  }

  if (field === 'performanceRate') {
    natixisPlacements[index].performanceRate = parseAmount(value);
  }

  if (field === 'fees') {
    natixisPlacements[index].fees = parseAmount(value);
  }

  refreshNatixisRows();
  saveFormData();
}

function removeNatixisPlacement(index) {
  natixisPlacements.splice(index, 1);
  renderNatixisTable();
  saveFormData();
}

function updatePeaAction(index, field, value) {
  if (!peaActions[index]) {
    return;
  }

  if (field === 'name') {
    peaActions[index].name = String(value);
  }

  if (field === 'quantity') {
    peaActions[index].quantity = parseAmount(value);
  }

  if (field === 'buyPrice') {
    peaActions[index].buyPrice = parseAmount(value);
  }

  if (field === 'currentPrice') {
    peaActions[index].currentPrice = parseAmount(value);
  }

  if (field === 'fees') {
    peaActions[index].fees = parseAmount(value);
  }

  refreshPeaRows();
  saveFormData();
}

function removePeaAction(index) {
  peaActions.splice(index, 1);
  renderPeaActions();
  saveFormData();
}

function bindPeaActionsListeners() {
  addPeaActionButton.addEventListener('click', addPeaAction);

  peaActionsList.addEventListener('input', (event) => {
    const { peaIndex, peaField } = event.target.dataset;

    if (peaIndex === undefined || peaField === undefined) {
      return;
    }

    updatePeaAction(Number(peaIndex), peaField, event.target.value);
  });

  peaActionsList.addEventListener('click', (event) => {
    const removeIndex = event.target.dataset.peaRemoveIndex;

    if (removeIndex === undefined) {
      return;
    }

    removePeaAction(Number(removeIndex));
  });

  peaActionsList.addEventListener('keydown', (e) => {
    if (e.key === '.' || e.key === ',') e.stopPropagation();
  });
}

function bindNatixisListeners() {
  addNatixisButton.addEventListener('click', addNatixisPlacement);

  natixisTableBody.addEventListener('input', (event) => {
    const { natixisIndex, natixisField } = event.target.dataset;

    if (natixisIndex === undefined || natixisField === undefined) {
      return;
    }

    updateNatixisPlacement(Number(natixisIndex), natixisField, event.target.value);
  });

  natixisTableBody.addEventListener('click', (event) => {
    const removeIndex = event.target.dataset.natixisRemoveIndex;

    if (removeIndex === undefined) {
      return;
    }

    removeNatixisPlacement(Number(removeIndex));
  });

  natixisTableBody.addEventListener('keydown', (e) => {
    if (e.key === '.' || e.key === ',') e.stopPropagation();
  });
}

function populateCryptoSuggestions() {
  if (!newCryptoSymbolInput || !newCryptoSymbolInput.list) {
    return;
  }

  const datalist = document.getElementById(newCryptoSymbolInput.list.id);

  if (!datalist) {
    return;
  }

  datalist.innerHTML = '';

  CRYPTO_SUGGESTIONS.forEach((suggestion) => {
    const option = document.createElement('option');
    option.value = suggestion.value;
    option.label = suggestion.label;
    datalist.appendChild(option);
  });
}

function saveManualPrice(index, rawValue) {
  const selectedAsset = cryptoAssets[index];

  if (!selectedAsset) {
    return;
  }

  const trimmed = String(rawValue ?? '').trim();

  if (trimmed === '') {
    selectedAsset.currentPrice = null;
    selectedAsset.priceSource = 'none';
    saveFormData();
    updateCryptoValues();
    return;
  }

  const numericValue = Number(trimmed);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    selectedAsset.currentPrice = null;
    selectedAsset.priceSource = 'none';
    saveFormData();
    updateCryptoValues();
    return;
  }

  selectedAsset.currentPrice = numericValue;
  selectedAsset.priceSource = 'manual';
  saveFormData();
  updateCryptoValues();
}

function renderCryptoTable() {
  cryptoTableBody.innerHTML = '';

  cryptoAssets.forEach((asset, index) => {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>
        <input type="text" class="crypto-symbol-input" data-index="${index}" value="${asset.symbol}" maxlength="32" placeholder="bitcoin" />
      </td>
      <td>
        <input type="number" class="crypto-quantity-input" data-index="${index}" min="0" step="0.001" value="${asset.quantity}" inputmode="decimal" />
      </td>
      <td>
        <input type="number" class="crypto-buy-input" data-index="${index}" min="0" step="0.01" value="${asset.buyPrice}" inputmode="decimal" />
      </td>
      <td class="crypto-price-cell" data-index="${index}">
        <div class="crypto-price-display">
          <span class="crypto-price-badge ${getCryptoPriceBadgeClass(asset)}">${getCryptoPriceBadgeLabel(asset)}</span>
          <input
            type="number"
            class="crypto-price-edit-input"
            data-index="${index}"
            min="0"
            step="0.01"
            inputmode="decimal"
            placeholder="Saisir le cours"
            value="${hasCurrentCryptoPrice(asset) ? asset.currentPrice : ''}"
          />
        </div>
      </td>
      <td class="crypto-change-cell" data-index="${index}">${format24hChange(asset.change24h ?? null)}</td>
      <td><strong class="crypto-current-value" data-index="${index}">${formatCurrency(getCryptoValueForAsset(asset))}</strong></td>
      <td><strong class="crypto-pnl" data-index="${index}">${formatCurrency(getCryptoPnlForAsset(asset))}</strong></td>
      <td><button type="button" class="danger-btn" data-delete-index="${index}">Supprimer</button></td>
    `;

    cryptoTableBody.appendChild(row);
  });

  cryptoTableBody.querySelectorAll('.crypto-symbol-input').forEach((input) => {
    input.addEventListener('input', (event) => {
      const index = Number(event.target.dataset.index);
      cryptoAssets[index].symbol = normalizeCryptoSymbol(event.target.value);
      saveFormData();
      fetchCryptoPrices();
    });
  });

  cryptoTableBody.querySelectorAll('.crypto-quantity-input').forEach((input) => {
    input.addEventListener('input', (event) => {
      const index = Number(event.target.dataset.index);
      cryptoAssets[index].quantity = parseAmount(event.target.value);
      saveFormData();
      updateCryptoValues();
    });
  });

  cryptoTableBody.querySelectorAll('.crypto-buy-input').forEach((input) => {
    input.addEventListener('input', (event) => {
      const index = Number(event.target.dataset.index);
      cryptoAssets[index].buyPrice = parseAmount(event.target.value);
      saveFormData();
      updateCryptoValues();
    });
  });

  cryptoTableBody.querySelectorAll('.crypto-price-edit-input').forEach((input) => {
    input.addEventListener('input', (event) => {
      const index = Number(event.target.dataset.index);
      saveManualPrice(index, event.target.value);
    });
  });

  cryptoTableBody.querySelectorAll('[data-delete-index]').forEach((button) => {
    button.addEventListener('click', (event) => {
      const index = Number(event.target.dataset.deleteIndex);
      cryptoAssets.splice(index, 1);
      saveFormData();
      renderCryptoTable();
      fetchCryptoPrices();
    });
  });
}

function updateCryptoValues() {
  cryptoAssets.forEach((asset, index) => {
    const valueEl   = cryptoTableBody.querySelector(`.crypto-current-value[data-index="${index}"]`);
    const pnlEl     = cryptoTableBody.querySelector(`.crypto-pnl[data-index="${index}"]`);
    const priceInput = cryptoTableBody.querySelector(`.crypto-price-edit-input[data-index="${index}"]`);
    const changeCell = cryptoTableBody.querySelector(`.crypto-change-cell[data-index="${index}"]`);

    if (valueEl) valueEl.textContent = formatCurrency(getCryptoValueForAsset(asset));
    if (pnlEl)   pnlEl.textContent   = formatCurrency(getCryptoPnlForAsset(asset));

    if (changeCell) {
      changeCell.innerHTML = format24hChange(asset.change24h ?? null);
    }

    if (priceInput) {
      priceInput.value = hasCurrentCryptoPrice(asset) ? String(asset.currentPrice) : '';
      const badge = priceInput.closest('.crypto-price-display')?.querySelector('.crypto-price-badge');
      if (badge) {
        badge.className = `crypto-price-badge ${getCryptoPriceBadgeClass(asset)}`;
        badge.textContent = getCryptoPriceBadgeLabel(asset);
      }
    }
  });

  updateTotalPatrimony();

  const unavailableCount = cryptoAssets.filter((asset) => asset.symbol && asset.priceSource !== 'manual' && asset.currentPrice === null).length;

  if (cryptoAssets.some((asset) => asset.symbol) && unavailableCount === 0) {
    cryptoSyncStatusEl.textContent = 'Cours à jour pour les cryptos suivies.';
  } else if (unavailableCount > 0) {
    cryptoSyncStatusEl.textContent = `Cours indisponible pour ${unavailableCount} crypto${unavailableCount > 1 ? 's' : ''}.`;
  } else {
    cryptoSyncStatusEl.textContent = 'Ajoutez une crypto pour lancer le suivi des prix.';
  }
}

function setMarketRefreshButtonState(isLoading) {
  if (!marketRefreshButton) {
    return;
  }

  marketRefreshButton.disabled = isLoading;

  const icon = marketRefreshButton.querySelector('i');

  if (icon) {
    icon.classList.toggle('fa-spin', isLoading);
  }
}

function showMarketRefreshNotice(message) {
  if (!marketRefreshNoticeEl) {
    return;
  }

  marketRefreshNoticeEl.textContent = message;
  marketRefreshNoticeEl.classList.add('is-visible');

  window.clearTimeout(marketRefreshNoticeTimeout);
  marketRefreshNoticeTimeout = window.setTimeout(() => {
    // Après le message temporaire, remet le countdown s'il tourne encore
    if (cryptoAutoRefreshInterval) {
      _updateCryptoCountdown();
    } else {
      marketRefreshNoticeEl.classList.remove('is-visible');
    }
  }, 2200);
}

async function refreshMarketData() {
  if (isMarketRefreshInProgress) {
    return;
  }

  const activeAssets = cryptoAssets.filter((asset) => asset.symbol && asset.priceSource !== 'manual');

  if (activeAssets.length === 0) {
    showMarketRefreshNotice('Aucune crypto à mettre à jour.');
    return;
  }

  isMarketRefreshInProgress = true;
  setMarketRefreshButtonState(true);

  await fetchCryptoPrices();
  updateHomeCharts();

  const unavailableCount = cryptoAssets.filter((asset) => asset.symbol && asset.priceSource !== 'manual' && asset.currentPrice === null).length;

  if (unavailableCount === 0) {
    showMarketRefreshNotice('Cours mis à jour.');
  } else {
    showMarketRefreshNotice('Mise à jour partielle : certains cours restent indisponibles.');
  }

  isMarketRefreshInProgress = false;
  setMarketRefreshButtonState(false);
}

async function fetchCryptoPrices() {
  const activeAssets = cryptoAssets.filter((asset) => asset.symbol && asset.priceSource !== 'manual');

  if (activeAssets.length === 0) {
    updateCryptoValues();
    cryptoSyncStatusEl.textContent = 'Ajoutez une crypto pour lancer le suivi des prix.';
    return;
  }

  const ids = activeAssets.map((asset) => resolveCryptoApiId(asset.symbol)).filter(Boolean);

  if (ids.length === 0) {
    cryptoSyncStatusEl.textContent = 'Symbole non reconnu. Utilisez une crypto de la liste ou ajoutez un mapping manuel.';
    updateCryptoValues();
    return;
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8000);

  try {
    // /coins/markets donne prix + variation 24h en un seul appel
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&ids=${ids.join(',')}&order=market_cap_desc&per_page=250&sparkline=false`;
    const response = await fetchWithCorsProxy(url, { signal: controller.signal });

    if (!response.ok) throw new Error(`Erreur API CoinGecko (${response.status})`);

    const data = await response.json();

    // Index par id pour lookup O(1)
    const byId = {};
    data.forEach((coin) => { byId[coin.id] = coin; });

    cryptoAssets = cryptoAssets.map((asset) => {
      if (asset.priceSource === 'manual') return asset;
      const id   = resolveCryptoApiId(asset.symbol);
      const coin = id ? byId[id] : null;
      if (!coin) return asset; // prix non reçu = on garde l'existant
      return {
        ...asset,
        currentPrice: typeof coin.current_price === 'number'
          ? coin.current_price
          : asset.currentPrice,
        change24h: typeof coin.price_change_percentage_24h === 'number'
          ? coin.price_change_percentage_24h
          : asset.change24h,
        priceSource: 'api',
        lastUpdated: Date.now(),
      };
    });

    saveFormData();
    updateCryptoValues();
  } catch (error) {
    // En cas d'erreur réseau : ne pas écraser les prix existants
    cryptoAssets = cryptoAssets.map((asset) => ({ ...asset }));
    updateCryptoValues();

    const msg = error.message.includes('CORS') || error.message.includes('inaccessible')
      ? 'API crypto temporairement inaccessible. Réessayez dans quelques minutes.'
      : error.name === 'AbortError'
        ? 'Délai dépassé — cours indisponible.'
        : 'Impossible de récupérer les cours.';
    if (cryptoSyncStatusEl) cryptoSyncStatusEl.textContent = msg;
    showToast(msg, 'warning');
  } finally {
    window.clearTimeout(timeoutId);
  }
}

// ─── Variation 24h : formatage ───────────────────────────────────────────────
function format24hChange(change) {
  if (change === null || change === undefined) return '<span class="crypto-change-neutral">—</span>';
  const sign = change >= 0 ? '+' : '';
  const cls  = change > 0 ? 'crypto-change-up' : change < 0 ? 'crypto-change-down' : 'crypto-change-neutral';
  const arrow = change > 0 ? '↑' : change < 0 ? '↓' : '';
  return `<span class="${cls}">${arrow} ${sign}${change.toFixed(2)} %</span>`;
}

// ─── Fetch liste complète CoinGecko pour l'autocomplete ─────────────────────
async function fetchCoinsList() {
  const datalist = document.getElementById('cryptoApiSuggestions');
  if (!datalist) return;
  try {
    const controller = new AbortController();
    const tid = window.setTimeout(() => controller.abort(), 15000);
    const response = await fetchWithCorsProxy(
      'https://api.coingecko.com/api/v3/coins/list',
      { signal: controller.signal }
    );
    window.clearTimeout(tid);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    coinsList = await response.json();
    // Alimente le datalist (id comme value, name en label)
    const frag = document.createDocumentFragment();
    coinsList.forEach((coin) => {
      const opt = document.createElement('option');
      opt.value = coin.id;
      opt.label = coin.name;
      frag.appendChild(opt);
    });
    datalist.innerHTML = '';
    datalist.appendChild(frag);
  } catch (error) {
    // Non bloquant : l'autocomplete reste simplement vide
    if (error.name !== 'AbortError') {
      showToast('Impossible de charger la liste des cryptos pour l\'autocomplete.', 'warning');
    }
  }
}

// ─── Auto-refresh 60 secondes avec countdown ────────────────────────────────
function startCryptoAutoRefresh() {
  stopCryptoAutoRefresh(); // nettoie les éventuels anciens timers

  cryptoCountdownValue = 60;
  _updateCryptoCountdown();

  // Countdown affiché chaque seconde
  cryptoCountdownTimer = window.setInterval(() => {
    cryptoCountdownValue--;
    _updateCryptoCountdown();
  }, 1000);

  // Refresh réel toutes les 60 secondes
  cryptoAutoRefreshInterval = window.setInterval(() => {
    refreshMarketData().then(() => {
      // Repart à 60 après chaque refresh
      cryptoCountdownValue = 60;
    });
  }, 60000);
}

function stopCryptoAutoRefresh() {
  if (cryptoAutoRefreshInterval) { window.clearInterval(cryptoAutoRefreshInterval); cryptoAutoRefreshInterval = null; }
  if (cryptoCountdownTimer)      { window.clearInterval(cryptoCountdownTimer);      cryptoCountdownTimer = null; }
  if (marketRefreshNoticeEl) marketRefreshNoticeEl.classList.remove('is-visible');
}

function _updateCryptoCountdown() {
  if (!marketRefreshNoticeEl) return;
  const secs = Math.max(0, cryptoCountdownValue);
  marketRefreshNoticeEl.textContent = `Actualisation dans ${secs}s`;
  marketRefreshNoticeEl.classList.add('is-visible');
  // Retire la classe quand un showMarketRefreshNotice() temporaire prend la main
  // (le clearTimeout existant dans showMarketRefreshNotice gère le masquage)
}

function addCryptoAsset() {
  const enteredSymbol = newCryptoSymbolInput.value.trim();
  const normalizedSymbol = normalizeCryptoSymbol(enteredSymbol);
  const quantity = parseAmount(newCryptoQuantityInput.value);

  if (!normalizedSymbol) {
    cryptoSyncStatusEl.textContent = 'Veuillez saisir une crypto valide.';
    return;
  }

  const apiId = resolveCryptoApiId(normalizedSymbol);

  if (!apiId) {
    cryptoSyncStatusEl.textContent = 'Crypto non reconnue. Choisissez une valeur dans la liste ou ajoutez un mapping manuel.';
    return;
  }

  if (cryptoAssets.some((asset) => resolveCryptoApiId(asset.symbol) === apiId)) {
    cryptoSyncStatusEl.textContent = `${apiId} est deja dans votre liste.`;
    return;
  }

  cryptoAssets.push({ symbol: apiId, quantity, buyPrice: 0, currentPrice: null, priceSource: 'none' });
  saveFormData();
  renderCryptoTable();
  newCryptoSymbolInput.value = '';
  newCryptoQuantityInput.value = '0';
  fetchCryptoPrices();
}

// ─── SIMULATEUR D'ÉPARGNE COMPOUND ──────────────────────────
let compoundChart = null;
const COMPOUND_KEYS = ['compoundMonthly', 'compoundRate', 'compoundDuration'];

function computeFV(monthly, annualRate, months) {
  const r = annualRate / 100 / 12;
  if (r === 0) return monthly * months;
  return monthly * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
}

function renderCompoundSimulator() {
  const monthly = parseAmount(document.getElementById('compoundMonthly')?.value);
  const annualRate = parseAmount(document.getElementById('compoundRate')?.value);
  const maxYears = Math.max(1, Math.min(40, parseAmount(document.getElementById('compoundDuration')?.value) || 20));

  const milestonesEl = document.getElementById('compoundMilestones');
  if (milestonesEl) {
    const targets = [5, 10, 20].filter((y) => y <= maxYears);
    if (!targets.includes(maxYears)) targets.push(maxYears);
    milestonesEl.innerHTML = targets.map((y) => {
      const fv = computeFV(monthly, annualRate, y * 12);
      const invested = monthly * y * 12;
      const gain = fv - invested;
      return `<div class="compound-milestone">
        <p class="compound-milestone-year">${y} an${y > 1 ? 's' : ''}</p>
        <strong class="compound-milestone-val">${formatCurrency(fv)}</strong>
        <p class="compound-milestone-gain">+${formatCurrency(gain)} intérêts</p>
        <p class="compound-milestone-invested">${formatCurrency(invested)} versé</p>
      </div>`;
    }).join('');
  }

  const canvas = document.getElementById('compoundChart');
  if (!canvas || typeof Chart === 'undefined') return;

  const step = Math.max(1, Math.floor((maxYears * 12) / 60));
  const labels = [];
  const growthData = [];
  const investedData = [];
  for (let m = 0; m <= maxYears * 12; m += step) {
    labels.push(m % 12 === 0 ? `${m / 12}a` : '');
    growthData.push(parseFloat(computeFV(monthly, annualRate, m).toFixed(2)));
    investedData.push(parseFloat((monthly * m).toFixed(2)));
  }

  if (compoundChart) {
    compoundChart.data.labels = labels;
    compoundChart.data.datasets[0].data = growthData;
    compoundChart.data.datasets[1].data = investedData;
    compoundChart.update();
    return;
  }

  compoundChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Valeur avec intérêts',
          data: growthData,
          borderColor: '#67e8f9',
          backgroundColor: 'rgba(103,232,249,0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
        {
          label: 'Capital versé',
          data: investedData,
          borderColor: '#60a5fa',
          borderDash: [5, 5],
          backgroundColor: 'transparent',
          fill: false,
          tension: 0,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { labels: { color: '#dbeafe', usePointStyle: true } },
        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label} : ${formatCurrency(Number(ctx.raw))}` } },
      },
      scales: {
        x: {
          ticks: { color: '#b7d8ff', maxTicksLimit: 10 },
          grid: { color: 'rgba(56,189,248,0.08)' },
        },
        y: {
          ticks: { color: '#b7d8ff', callback: (v) => formatCurrency(v) },
          grid: { color: 'rgba(56,189,248,0.08)' },
        },
      },
    },
  });
}

function calculateFeesImpact(capital, annualReturn, fees, years) {
  const withFees    = capital * Math.pow(1 + (annualReturn - fees) / 100, years);
  const withoutFees = capital * Math.pow(1 + annualReturn / 100, years);
  return withoutFees - withFees;
}

function bindFeesSimulator() {
  const ids = ['feesCapital', 'feesReturn', 'feesRate', 'feesDuration'];
  const resultEl = document.getElementById('feesResult');
  if (!resultEl || ids.some(id => !document.getElementById(id))) return;

  function renderFees() {
    const capital  = parseAmount(document.getElementById('feesCapital').value);
    const ret      = parseAmount(document.getElementById('feesReturn').value);
    const fees     = parseAmount(document.getElementById('feesRate').value);
    const years    = Math.max(1, parseAmount(document.getElementById('feesDuration').value));
    const loss     = calculateFeesImpact(capital, ret, fees, years);
    const withFees = capital * Math.pow(1 + (ret - fees) / 100, years);
    const noFees   = capital * Math.pow(1 + ret / 100, years);
    resultEl.innerHTML =
      `<strong>Perte due aux frais : ${formatCurrency(loss)} sur ${years} ans</strong><br>`
      + `Avec frais (${fees}%/an) : ${formatCurrency(withFees)}&nbsp;&nbsp;|&nbsp;&nbsp;`
      + `Sans frais : ${formatCurrency(noFees)}`;
  }

  ids.forEach(id => document.getElementById(id).addEventListener('input', renderFees));
  renderFees();
}

function bindCompoundSimulator() {
  COMPOUND_KEYS.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const saved = localStorage.getItem(`dashboard-compound-${id}`);
    if (saved !== null) el.value = saved;
    el.addEventListener('input', () => {
      localStorage.setItem(`dashboard-compound-${id}`, el.value);
      renderCompoundSimulator();
    });
  });
  renderCompoundSimulator();
}
