const STORAGE_KEY = 'dashboard-financier-form-data';
const ARCHIVE_STORAGE_KEY = 'dashboard-financier-archives';
const SAVINGS_RATE_STORAGE_KEY = 'dashboard-financier-savings-rate';
const OBJECTIVE_STORAGE_KEY = 'dashboard-financier-objective';
const BANK_ACCOUNTS_STORAGE_KEY = 'dashboard-financier-bank-accounts';
const SECTION_STORAGE_KEYS = {
  charges: 'chargesData',
  investments: 'investmentsData',
  mortgage: 'mortgageData',
  bank: 'bankData',
};
const SPECIFIC_RESET_STORAGE_KEYS = {
  chargesFixesData: 'chargesFixesData',
  depensesPersoData: 'depensesPersoData',
  natixisData: 'natixisData',
  peaData: 'peaData',
  cryptoData: 'cryptoData',
};
const SPECIFIC_RESET_LABELS = {
  chargesFixesData: 'Charges fixes & abonnements',
  depensesPersoData: 'Dépenses personnelles',
  natixisData: 'Portfolio Natixis',
  peaData: 'PEA Actions',
  cryptoData: 'Crypto',
};
const objectifMontant = 20000;
const seuilAlerte = 500;

const fields = {
  salary: document.getElementById('salary'),
  bonus: document.getElementById('bonus'),
  homePrice: document.getElementById('homePrice'),
  personalContribution: document.getElementById('personalContribution'),
  loanAmount: document.getElementById('loanAmount'),
  interestRate: document.getElementById('interestRate'),
  loanDuration: document.getElementById('loanDuration'),
};

const totalIncomeEl = document.getElementById('totalIncome');
const totalObligationsEl = document.getElementById('totalObligations');
const remainingIncomeEl = document.getElementById('remainingIncome');
const savingCapacityEl = document.getElementById('savingCapacity');
const savingsRateGaugeEl = document.getElementById('savingsRateGauge');
const savingsRatePercentEl = document.getElementById('savingsRatePercent');
const savingsRateStatusEl = document.getElementById('savingsRateStatus');
const savingsRateDetailEl = document.getElementById('savingsRateDetail');
const savingsRateTrendEl = document.getElementById('savingsRateTrend');
const savingsRateTrendIconEl = document.getElementById('savingsRateTrendIcon');
const totalPatrimonyEl = document.getElementById('totalPatrimony');
const mortgageTableBody = document.getElementById('mortgageTableBody');
const mortgageImpactTableBody = document.getElementById('mortgageImpactTableBody');
const borrowedAmountDisplayEl = document.getElementById('borrowedAmountDisplay');
const estimatedMonthlyPaymentEl = document.getElementById('estimatedMonthlyPayment');
const monthlyGainDisplayEl = document.getElementById('monthlyGainDisplay');
const cryptoSyncStatusEl = document.getElementById('cryptoSyncStatus');
const cryptoTableBody = document.getElementById('cryptoTableBody');
const newCryptoSymbolInput = document.getElementById('newCryptoSymbol');
const newCryptoQuantityInput = document.getElementById('newCryptoQuantity');
const addCryptoButton = document.getElementById('addCryptoButton');
const marketRefreshButton = document.getElementById('marketRefreshButton');
const marketRefreshNoticeEl = document.getElementById('marketRefreshNotice');
const archiveTableBody = document.getElementById('archiveTableBody');
const closeMonthButton = document.getElementById('closeMonthButton');
const archiveStatusEl = document.getElementById('archiveStatus');
const addPeaActionButton = document.getElementById('addPeaActionButton');
const peaActionsList = document.getElementById('peaActionsList');
const peaTotalInvestedEl = document.getElementById('peaTotalInvested');
const peaTotalCurrentValueEl = document.getElementById('peaTotalCurrentValue');
const peaTotalGainEl = document.getElementById('peaTotalGain');
const peaTotalGainPercentEl = document.getElementById('peaTotalGainPercent');
const addNatixisButton = document.getElementById('addNatixisButton');
const natixisTableBody = document.getElementById('natixisTableBody');
const natixisTotalValueEl = document.getElementById('natixisTotalValue');
const fixedChargesList = document.getElementById('fixedChargesList');
const personalExpensesList = document.getElementById('personalExpensesList');
const groceryExpensesList = document.getElementById('groceryExpensesList');
const bankAccountNameInput = document.getElementById('bankAccountName');
const bankAccountRateInput = document.getElementById('bankAccountRate');
const bankAccountBalanceInput = document.getElementById('bankAccountBalance');
const addBankAccountButton = document.getElementById('addBankAccountButton');
const bankAccountsTableBody = document.getElementById('bankAccountsTableBody');
const bankAccountsTotalValueEl = document.getElementById('bankAccountsTotalValue');
const pageToastEl = document.getElementById('pageToast');
const addPonctualBtn = document.getElementById('addPonctualBtn');
const ponctualsListEl = document.getElementById('ponctualsList');
const ponctualsTotalEl = document.getElementById('ponctualsTotal');
const checkingBalanceInput = document.getElementById('checkingAccountBalance');
const checkingSummaryEl = document.getElementById('checkingSummary');
const MANUAL_TRANSFER_KEY = 'dashboard-financier-manual-transfer';
const TRANSFER_PRESET_KEY  = 'dashboard-financier-transfer-preset';
const PONCTUELS_STORAGE_KEY = 'dashboard-financier-ponctuels';
const CHECKING_BALANCE_STORAGE_KEY = 'dashboard-financier-checking';
const SALARY_HISTORY_KEY = 'dashboard-financier-salary-history';

const DEFAULT_CRYPTOS = [
  { symbol: 'bitcoin', quantity: 0, buyPrice: 0, currentPrice: null, priceSource: 'none' },
  { symbol: 'ethereum', quantity: 0, buyPrice: 0, currentPrice: null, priceSource: 'none' },
  { symbol: 'solana', quantity: 0, buyPrice: 0, currentPrice: null, priceSource: 'none' },
];

const DEFAULT_DYNAMIC_SECTIONS = {
  fixedCharges: [],
  personalExpenses: [],
  groceryExpenses: [],
};

const DYNAMIC_SECTION_BINDINGS = {
  fixedCharges: fixedChargesList,
  personalExpenses: personalExpensesList,
  groceryExpenses: groceryExpensesList,
};

const COINGECKO_IDS = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  ADA: 'cardano',
  XRP: 'ripple',
  DOGE: 'dogecoin',
  BNB: 'binancecoin',
  AVAX: 'avalanche-2',
  MATIC: 'matic-network',
};

const MANUAL_CRYPTO_MAP = {
  'pepe': 'pepe',
  'tron': 'tron',
  'terra-luna': 'terra-luna',
};

const CRYPTO_SUGGESTIONS = [
  { value: 'bitcoin', label: 'bitcoin' },
  { value: 'ethereum', label: 'ethereum' },
  { value: 'solana', label: 'solana' },
  { value: 'cardano', label: 'cardano' },
  { value: 'ripple', label: 'ripple' },
  { value: 'dogecoin', label: 'dogecoin' },
  { value: 'binancecoin', label: 'binancecoin' },
  { value: 'avalanche-2', label: 'avalanche-2' },
  { value: 'matic-network', label: 'matic-network' },
  { value: 'pepe', label: 'pepe' },
  { value: 'tron', label: 'tron' },
  { value: 'terra-luna', label: 'terra-luna' },
];

let cryptoAssets = [];
let dynamicSections = { ...DEFAULT_DYNAMIC_SECTIONS };
let peaActions = [];
let natixisPlacements = [];
let monthlyArchives = [];
let bankAccounts = [];
let ponctuels = [];
let checkingBalance = 0;
let chargesChart = null;
let remainingChart = null;
let archiveNetWorthChart = null;
let isMarketRefreshInProgress = false;
let marketRefreshNoticeTimeout = null;
let coinsList = [];
let cryptoAutoRefreshInterval = null;
let cryptoCountdownTimer = null;
let cryptoCountdownValue = 0;
let salaryHistory = [];

function parseAmount(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

function showToast(message, type = 'success') {
  if (!pageToastEl) {
    return;
  }

  const iconClass = type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-check';

  pageToastEl.innerHTML = `<i class="fa-solid ${iconClass}"></i><span>${message}</span>`;
  pageToastEl.className = `success-toast ${type === 'warning' ? 'toast-warning' : 'toast-success'}`;
  pageToastEl.classList.remove('is-visible');

  window.clearTimeout(pageToastEl.resetTimeoutId);
  pageToastEl.resetTimeoutId = window.setTimeout(() => {
    pageToastEl.classList.remove('is-visible');
  }, 2600);

  window.requestAnimationFrame(() => {
    pageToastEl.classList.add('is-visible');
  });
}

function showResetToast(sectionLabel) {
  showToast(`${sectionLabel} a bien été réinitialisée.`);
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
