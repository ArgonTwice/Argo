function initializeApp() {
  loadSavedData();
  loadArchives();
  createChargesChart();
  createRemainingChart();
  createArchiveNetWorthChart();
  bindDynamicSectionListeners();
  bindPeaActionsListeners();
  bindNatixisListeners();
  bindCarrefourListeners();
  bindBankAccountsListeners();
  bindResetSectionButtons();
  bindBackupControls();
  bindPonctualsListeners();
  populateCryptoSuggestions();
  renderAllDynamicSections();
  renderPeaActions();
  renderNatixisTable();
  renderCarrefourHistory();
  renderBankAccountsTable();
  updateDashboard();
  updateMortgageTable();
  renderCryptoTable();
  fetchCryptoPrices().then(() => startCryptoAutoRefresh());
  fetchCoinsList();
  renderArchivesTable();
  updateTotalPatrimony();

  // Virement auto manuel
  const manualInput = document.getElementById('manualTransferAmount');
  if (manualInput) {
    manualInput.addEventListener('input', () => { saveManualTransfer(); calculerRestant(); });
  }
  bindTransferPresets();
  bindSectionNavigation();
  setActiveSection('home');

  if (marketRefreshButton) {
    marketRefreshButton.addEventListener('click', refreshMarketData);
  }

  if (closeMonthButton) {
    closeMonthButton.addEventListener('click', closeCurrentMonth);
  }

  if (addCryptoButton) {
    addCryptoButton.addEventListener('click', addCryptoAsset);
  }

  if (newCryptoSymbolInput) {
    newCryptoSymbolInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        addCryptoAsset();
      }
    });
  }

  Object.values(fields).forEach((field) => {
    field.addEventListener('input', () => {
      saveFormData();
      updateDashboard();
      updateMortgageTable();
    });
  });

}

window.addEventListener('load', initializeApp);

// ─── PWA ────────────────────────────────────────────────────
function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js').then((reg) => {
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      nw.addEventListener('statechange', () => {
        if (nw.state === 'activated' && navigator.serviceWorker.controller) {
          window.location.reload();
        }
      });
    });
  }).catch(() => {});
}

// ─── INIT NOUVELLES FONCTIONNALITÉS ─────────────────────────
window.addEventListener('load', () => {
  launchSplash();
  loadTheme();
  document.getElementById('themeToggleBtn')?.addEventListener('click', cycleTheme);
  bindLifeGoals();
  renderLifeGoals();
  bindGoalsForm();
  bindBudgetAlerts();
  initSearch();
  registerSW();
  document.getElementById('currentInflationRate')
    ?.addEventListener('input', updateRealReturn);
  bindFeesSimulator();
  bindCompoundSimulator();
  bindBudgetCatsForm();
  renderBudgetCategories();
  initMultiUser();
  initNotifications();
  initSavingsLock();
  bindHealthScoreDetail();
});
