function normalizeCryptoAssets(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((asset) => {
    const priceSource = typeof asset?.priceSource === 'string' && ['api', 'manual', 'none'].includes(asset.priceSource)
      ? asset.priceSource
      : (typeof asset?.currentPrice === 'number' && Number.isFinite(asset.currentPrice) ? 'api' : 'none');

    return {
      symbol: typeof asset?.symbol === 'string' ? asset.symbol.trim() : '',
      quantity: parseAmount(asset?.quantity),
      buyPrice: parseAmount(asset?.buyPrice),
      currentPrice: typeof asset?.currentPrice === 'number' && Number.isFinite(asset.currentPrice) ? asset.currentPrice : null,
      priceSource,
    };
  });
}

function normalizeCryptoSymbol(value) {
  const trimmed = String(value ?? '').trim();

  if (!trimmed) {
    return '';
  }

  const normalized = trimmed.toLowerCase();

  if (Object.prototype.hasOwnProperty.call(MANUAL_CRYPTO_MAP, normalized)) {
    return MANUAL_CRYPTO_MAP[normalized];
  }

  if (Object.prototype.hasOwnProperty.call(COINGECKO_IDS, trimmed.toUpperCase())) {
    return COINGECKO_IDS[trimmed.toUpperCase()];
  }

  return normalized;
}

function resolveCryptoApiId(symbol) {
  const normalized = normalizeCryptoSymbol(symbol);

  if (!normalized) {
    return null;
  }

  if (Object.prototype.hasOwnProperty.call(MANUAL_CRYPTO_MAP, normalized)) {
    return MANUAL_CRYPTO_MAP[normalized];
  }

  const mappedId = Object.values(COINGECKO_IDS).find((id) => id === normalized);

  if (mappedId) {
    return mappedId;
  }

  return normalized;
}

function getCryptoPriceLabel(asset) {
  return asset?.currentPrice === null || asset?.currentPrice === undefined ? 'Cours indisponible' : formatCurrency(asset.currentPrice);
}

function getCryptoPriceBadgeLabel(asset) {
  if (asset?.priceSource === 'manual' && asset.currentPrice !== null) {
    return 'MANUEL';
  }

  if (asset?.priceSource === 'api') {
    return 'API';
  }

  return 'À RENSEIGNER';
}

function getCryptoPriceBadgeClass(asset) {
  if (asset?.priceSource === 'manual' && asset.currentPrice !== null) {
    return 'crypto-badge-manual';
  }

  if (asset?.priceSource === 'api') {
    return 'crypto-badge-api';
  }

  return 'crypto-badge-empty';
}

function hasCurrentCryptoPrice(asset) {
  return typeof asset?.currentPrice === 'number' && Number.isFinite(asset.currentPrice);
}

function getCryptoValueForAsset(asset) {
  if (!hasCurrentCryptoPrice(asset)) {
    return 0;
  }

  return parseAmount(asset.quantity) * parseAmount(asset.currentPrice);
}

function getCryptoPnlForAsset(asset) {
  if (!hasCurrentCryptoPrice(asset)) {
    return 0;
  }

  return parseAmount(asset.quantity) * (parseAmount(asset.currentPrice) - parseAmount(asset.buyPrice));
}

function normalizeDynamicItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => ({
    name: typeof item?.name === 'string' ? item.name : '',
    amount: parseAmount(item?.amount),
    day: normalizeChargeDay(item?.day),
    recurring: typeof item?.recurring === 'boolean' ? item.recurring : true,
  }));
}

function normalizeChargeDay(value) {
  const parsedValue = parseAmount(value);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return 1;
  }

  return Math.min(31, Math.round(parsedValue));
}

function normalizePeaActions(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => ({
    name: typeof item?.name === 'string' ? item.name : '',
    quantity: parseAmount(item?.quantity),
    buyPrice: parseAmount(item?.buyPrice),
    currentPrice: parseAmount(item?.currentPrice),
    fees: parseAmount(item?.fees),
  }));
}

function normalizeNatixisPlacements(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => ({
    name: typeof item?.name === 'string' ? item.name : '',
    initialCapital: parseAmount(item?.initialCapital),
    performanceRate: parseAmount(item?.performanceRate),
    fees: parseAmount(item?.fees),
  }));
}

function getSavedFixedCharges(parsedData) {
  if (Array.isArray(parsedData.fixedCharges) && parsedData.fixedCharges.length) {
    return normalizeDynamicItems(parsedData.fixedCharges);
  }

  if (Array.isArray(parsedData.chargesFixedAbonnements) && parsedData.chargesFixedAbonnements.length) {
    return normalizeDynamicItems(parsedData.chargesFixedAbonnements);
  }

  const legacyCharges = [];

  if (Array.isArray(parsedData.fixedBills)) {
    legacyCharges.push(...parsedData.fixedBills);
  }

  if (Array.isArray(parsedData.subscriptions)) {
    legacyCharges.push(...parsedData.subscriptions);
  }

  return normalizeDynamicItems(legacyCharges);
}

function getSavedPersonalExpenses(parsedData) {
  if (Array.isArray(parsedData.personalExpenses) && parsedData.personalExpenses.length) {
    return normalizeDynamicItems(parsedData.personalExpenses);
  }

  return [];
}

function getSavedGroceryExpenses(parsedData) {
  if (Array.isArray(parsedData.groceryExpenses) && parsedData.groceryExpenses.length) {
    return normalizeDynamicItems(parsedData.groceryExpenses);
  }

  return [];
}

function normalizeBankAccounts(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((account) => ({
    name: typeof account?.name === 'string' ? account.name : '',
    annualRate: parseAmount(account?.annualRate),
    balance: parseAmount(account?.balance),
  }));
}

function normalizeStoredChargesData(data) {
  if (!data || typeof data !== 'object') {
    return { ...DEFAULT_DYNAMIC_SECTIONS };
  }

  return {
    fixedCharges: normalizeDynamicItems(Array.isArray(data.fixedCharges) ? data.fixedCharges : []),
    personalExpenses: normalizeDynamicItems(Array.isArray(data.personalExpenses) ? data.personalExpenses : []),
    groceryExpenses: normalizeDynamicItems(Array.isArray(data.groceryExpenses) ? data.groceryExpenses : []),
  };
}

function normalizeStoredInvestmentsData(data) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  return {
    cryptoAssets: normalizeCryptoAssets(Array.isArray(data.cryptoAssets) ? data.cryptoAssets : []),
    peaActions: normalizePeaActions(data.peaActions),
    natixisPlacements: normalizeNatixisPlacements(data.natixisPlacements),
  };
}

function normalizeStoredMortgageData(data) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  return {
    homePrice: parseAmount(data.homePrice),
    personalContribution: parseAmount(data.personalContribution),
    loanAmount: parseAmount(data.loanAmount),
    interestRate: parseAmount(data.interestRate),
    loanDuration: parseAmount(data.loanDuration),
  };
}

function loadSectionSnapshot(sectionKey) {
  const rawData = localStorage.getItem(SECTION_STORAGE_KEYS[sectionKey]);

  if (!rawData) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawData);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function saveMainStorageSnapshot() {
  const formData = Object.fromEntries(
    Object.entries(fields).map(([key, field]) => [key, field.value])
  );

  formData.cryptoAssets = cryptoAssets;
  formData.fixedCharges = dynamicSections.fixedCharges;
  formData.personalExpenses = dynamicSections.personalExpenses;
  formData.groceryExpenses = dynamicSections.groceryExpenses;
  formData.peaActions = peaActions;
  formData.natixisPlacements = natixisPlacements;
  formData.bankAccounts = bankAccounts;
  formData.ponctuels = ponctuels;
  formData.checkingBalance = checkingBalance;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
}

function saveSectionStorageSnapshot() {
  localStorage.setItem(
    SECTION_STORAGE_KEYS.charges,
    JSON.stringify({
      fixedCharges: dynamicSections.fixedCharges,
      personalExpenses: dynamicSections.personalExpenses,
      groceryExpenses: dynamicSections.groceryExpenses,
    })
  );

  localStorage.setItem(
    SECTION_STORAGE_KEYS.investments,
    JSON.stringify({
      cryptoAssets,
      peaActions,
      natixisPlacements,
    })
  );

  localStorage.setItem(
    SECTION_STORAGE_KEYS.mortgage,
    JSON.stringify({
      homePrice: parseAmount(fields.homePrice.value),
      personalContribution: parseAmount(fields.personalContribution.value),
      loanAmount: parseAmount(fields.loanAmount.value),
      interestRate: parseAmount(fields.interestRate.value),
      loanDuration: parseAmount(fields.loanDuration.value),
    })
  );

  localStorage.setItem(SECTION_STORAGE_KEYS.bank, JSON.stringify({ bankAccounts }));
}

function saveFormData() {
  saveMainStorageSnapshot();
  saveSectionStorageSnapshot();
}

function loadSavedData() {
  const savedData = localStorage.getItem(STORAGE_KEY);
  const chargesSnapshot = loadSectionSnapshot('charges');
  const investmentsSnapshot = loadSectionSnapshot('investments');
  const mortgageSnapshot = loadSectionSnapshot('mortgage');
  const bankSnapshot = loadSectionSnapshot('bank');
  let parsedData = null;

  cryptoAssets = normalizeCryptoAssets([...DEFAULT_CRYPTOS]);
  dynamicSections = { ...DEFAULT_DYNAMIC_SECTIONS };
  peaActions = [];
  natixisPlacements = [];
  bankAccounts = [];
  loadManualTransfer();

  if (savedData) {
    try {
      parsedData = JSON.parse(savedData);

      Object.entries(fields).forEach(([key, field]) => {
        if (Object.prototype.hasOwnProperty.call(parsedData, key)) {
          field.value = parsedData[key];
        }
      });
    } catch {
      parsedData = null;
    }
  }

  if (chargesSnapshot) {
    dynamicSections = normalizeStoredChargesData(chargesSnapshot);
  } else if (parsedData) {
    dynamicSections = {
      fixedCharges: getSavedFixedCharges(parsedData),
      personalExpenses: getSavedPersonalExpenses(parsedData),
      groceryExpenses: getSavedGroceryExpenses(parsedData),
    };
  }

  if (investmentsSnapshot) {
    const normalizedInvestments = normalizeStoredInvestmentsData(investmentsSnapshot);

    if (normalizedInvestments) {
      cryptoAssets = normalizedInvestments.cryptoAssets;
      peaActions = normalizedInvestments.peaActions;
      natixisPlacements = normalizedInvestments.natixisPlacements;
    }
  } else if (parsedData) {
    peaActions = normalizePeaActions(parsedData.peaActions);
    natixisPlacements = normalizeNatixisPlacements(parsedData.natixisPlacements);

    if (Array.isArray(parsedData.cryptoAssets) && parsedData.cryptoAssets.length) {
      cryptoAssets = normalizeCryptoAssets(parsedData.cryptoAssets);
    }
  }

  if (mortgageSnapshot) {
    const normalizedMortgage = normalizeStoredMortgageData(mortgageSnapshot);

    if (normalizedMortgage) {
      fields.homePrice.value = normalizedMortgage.homePrice;
      fields.personalContribution.value = normalizedMortgage.personalContribution;
      fields.loanAmount.value = normalizedMortgage.loanAmount;
      fields.interestRate.value = normalizedMortgage.interestRate;
      fields.loanDuration.value = normalizedMortgage.loanDuration;
    }
  }

  if (bankSnapshot) {
    bankAccounts = normalizeBankAccounts(bankSnapshot.bankAccounts);
  } else if (parsedData && Array.isArray(parsedData.bankAccounts)) {
    bankAccounts = normalizeBankAccounts(parsedData.bankAccounts);
  }

  loadPonctuels();
  loadCheckingBalance();
}

function exporterDonnees() {
  exportDashboardBackup();
}

function importerDonnees() {
  const importBackupInput = document.getElementById('importBackupInput');

  if (!importBackupInput) {
    return;
  }

  importBackupInput.click();
}

function exportDashboardBackup() {
  try {
    const backup = {};

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);

      if (!key) {
        continue;
      }

      backup[key] = localStorage.getItem(key);
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'backup-dashboard-anthony.json';
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('Sauvegarde exportée avec succès.');
  } catch {
    showToast('Impossible d\'exporter la sauvegarde.', 'warning');
  }
}

function serializeBackupValue(value) {
  if (typeof value === 'string') {
    return value;
  }

  if (value === undefined) {
    return '';
  }

  if (value === null) {
    return 'null';
  }

  return JSON.stringify(value);
}

function importDashboardBackup(file) {
  const reader = new FileReader();

  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));

      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Format de sauvegarde invalide.');
      }

      localStorage.clear();

      Object.entries(parsed).forEach(([key, value]) => {
        localStorage.setItem(key, serializeBackupValue(value));
      });

      showToast('Sauvegarde importée. Rafraîchissement en cours…');
      window.setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch {
      showToast('Impossible d\'importer la sauvegarde.', 'warning');
    }
  };

  reader.readAsText(file);
}

function handleBackupImportInput(event) {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  if (!confirm('Importer cette sauvegarde remplacera toutes les données actuelles. Voulez-vous continuer ?')) {
    event.target.value = '';
    return;
  }

  importDashboardBackup(file);
  event.target.value = '';
}

function bindBackupControls() {
  const exportBackupButton = document.getElementById('exportBackupButton');
  const importBackupButton = document.getElementById('importBackupButton');
  const importBackupInput = document.getElementById('importBackupInput');

  if (exportBackupButton) {
    exportBackupButton.addEventListener('click', exporterDonnees);
  }

  if (importBackupButton && importBackupInput) {
    importBackupButton.addEventListener('click', importerDonnees);
    importBackupInput.addEventListener('change', handleBackupImportInput);
  }
}
