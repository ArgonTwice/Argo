function calculateMortgagePayment(principal, annualRate, years) {
  const monthlyRate = annualRate / 100 / 12;
  const totalPayments = years * 12;

  if (principal <= 0 || totalPayments <= 0) {
    return 0;
  }

  if (monthlyRate === 0) {
    return principal / totalPayments;
  }

  const factor = Math.pow(1 + monthlyRate, totalPayments);
  return principal * ((monthlyRate * factor) / (factor - 1));
}

function getBorrowedAmount() {
  const propertyPrice = parseAmount(fields.homePrice?.value);
  const contribution = parseAmount(fields.personalContribution?.value);
  return Math.max(0, propertyPrice - contribution);
}

function updateMortgageSimulationSummary() {
  const principal = getBorrowedAmount();
  const annualRate = parseAmount(fields.interestRate.value);
  const durationYears = parseAmount(fields.loanDuration.value);
  const monthlyPayment = calculateMortgagePayment(principal, annualRate, durationYears);
  const baselinePayment = calculateMortgagePayment(parseAmount(fields.homePrice.value), annualRate, durationYears);
  const monthlyGain = Math.max(0, baselinePayment - monthlyPayment);

  fields.loanAmount.value = principal;

  if (borrowedAmountDisplayEl) {
    borrowedAmountDisplayEl.textContent = formatCurrency(principal);
  }

  if (estimatedMonthlyPaymentEl) {
    estimatedMonthlyPaymentEl.textContent = formatCurrency(monthlyPayment);
  }

  if (monthlyGainDisplayEl) {
    monthlyGainDisplayEl.textContent = formatCurrency(monthlyGain);
  }
}

function renderMortgageImpactTable() {
  if (!mortgageImpactTableBody) {
    return;
  }

  const annualRate = parseAmount(fields.interestRate.value);
  const durationYears = parseAmount(fields.loanDuration.value);
  const propertyPrice = parseAmount(fields.homePrice.value);
  const baselinePayment = calculateMortgagePayment(propertyPrice, annualRate, durationYears);
  const apportLevels = [0, 20000, 40000];

  mortgageImpactTableBody.innerHTML = '';

  apportLevels.forEach((apport) => {
    const payment = calculateMortgagePayment(Math.max(0, propertyPrice - apport), annualRate, durationYears);
    const gain = baselinePayment - payment;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatCurrency(apport)}</td>
      <td>${formatCurrency(payment)}</td>
      <td>${formatCurrency(gain)}</td>
    `;

    mortgageImpactTableBody.appendChild(row);
  });
}

function updateMortgageTable() {
  updateMortgageSimulationSummary();

  const principal = parseAmount(fields.loanAmount.value);
  const annualRate = parseAmount(fields.interestRate.value);
  const durations = [10, 15, 20, 25];

  mortgageTableBody.innerHTML = '';

  durations.forEach((years) => {
    const payment = calculateMortgagePayment(principal, annualRate, years);
    const totalCost = payment * years * 12;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${years} ans</td>
      <td>${formatCurrency(payment)}</td>
      <td>${formatCurrency(totalCost)}</td>
    `;

    mortgageTableBody.appendChild(row);
  });

  renderMortgageImpactTable();
}
