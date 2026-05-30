function createChargesChart() {
  const canvas = document.getElementById('chargesChart');

  if (!canvas || typeof Chart === 'undefined') {
    return;
  }

  chargesChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['PEA', 'Crypto', 'Natixis', 'Carrefour', 'Banque'],
      datasets: [{
        data: [0, 0, 0, 0, 0],
        backgroundColor: ['#00d4ff', '#3b82f6', '#1e293b', '#60a5fa', '#34d399'],
        borderColor: 'rgba(15, 23, 42, 0.98)',
        borderWidth: 2,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '58%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#dbeafe',
            padding: 16,
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.label}: ${formatCurrency(Number(context.raw))}`;
            },
          },
        },
      },
    },
  });
}

function createRemainingChart() {
  const canvas = document.getElementById('remainingChart');

  if (!canvas || typeof Chart === 'undefined') {
    return;
  }

  remainingChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: ['Aucun historique'],
      datasets: [{
        label: 'Reste à vivre',
        data: [0],
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.12)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#67e8f9',
        pointBorderColor: '#38bdf8',
        pointRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#dbeafe',
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#b7d8ff',
          },
          grid: {
            color: 'rgba(56, 189, 248, 0.08)',
          },
        },
        y: {
          ticks: {
            color: '#b7d8ff',
          },
          grid: {
            color: 'rgba(56, 189, 248, 0.08)',
          },
        },
      },
    },
  });
}

function createArchiveNetWorthChart() {
  const canvas = document.getElementById('archiveNetWorthChart');

  if (!canvas || typeof Chart === 'undefined') {
    return;
  }

  archiveNetWorthChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: ['Aucun historique'],
      datasets: [{
        label: 'Net Worth',
        data: [0],
        borderColor: '#00d4ff',
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;

          if (!chartArea) {
            return 'rgba(0, 212, 255, 0.12)';
          }

          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgba(0, 212, 255, 0.16)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)');
          return gradient;
        },
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#60a5fa',
        pointBorderColor: '#00d4ff',
        pointRadius: 4,
        pointHoverRadius: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#dbeafe',
          },
        },
        tooltip: {
          callbacks: {
            label(context) {
              return `${context.dataset.label}: ${formatCurrency(Number(context.raw))}`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#b7d8ff',
          },
          grid: {
            color: 'rgba(56, 189, 248, 0.08)',
          },
        },
        y: {
          ticks: {
            color: '#b7d8ff',
          },
          grid: {
            color: 'rgba(56, 189, 248, 0.08)',
          },
        },
      },
    },
  });
}

function updateHomeCharts() {
  const chartArchives = [...monthlyArchives].sort((a, b) => a.monthKey.localeCompare(b.monthKey));

  if (chargesChart) {
    const breakdown = getInvestmentBreakdown();
    chargesChart.data.datasets[0].data = [breakdown.pea, breakdown.crypto, breakdown.natixis, breakdown.carrefour, breakdown.banque];
    chargesChart.update();
  }

  if (remainingChart) {
    if (chartArchives.length === 0) {
      remainingChart.data.labels = ['Aucun historique'];
      remainingChart.data.datasets[0].data = [0];
    } else {
      remainingChart.data.labels = chartArchives.map((archive) => archive.displayDate);
      remainingChart.data.datasets[0].data = chartArchives.map((archive) => archive.remainingIncome ?? archive.finalBalance ?? 0);
    }

    remainingChart.update();
  }

  if (archiveNetWorthChart) {
    if (chartArchives.length === 0) {
      archiveNetWorthChart.data.labels = ['Aucun historique'];
      archiveNetWorthChart.data.datasets[0].data = [0];
    } else {
      archiveNetWorthChart.data.labels = chartArchives.map((archive) => archive.displayDate);
      archiveNetWorthChart.data.datasets[0].data = chartArchives.map((archive) => archive.netWorth ?? archive.finalBalance ?? 0);
    }

    archiveNetWorthChart.update();
  }
}

// ─── GRAPHIQUE 6 MOIS ───────────────────────────────────────
let sixMonthChart = null;
function createOrUpdateSixMonthChart() {
  const canvas = document.getElementById('sixMonthChart');
  if (!canvas || typeof Chart === 'undefined') return;
  const archives = [...monthlyArchives].sort((a,b) => a.monthKey.localeCompare(b.monthKey)).slice(-6);
  const labels = archives.length ? archives.map(a => a.displayDate) : ['Aucun historique'];
  const incomeData = archives.map(a => a.totalIncome||0);
  const expData = archives.map(a => a.totalObligations||0);
  const savData = archives.map(a => a.savings||0);
  if (sixMonthChart) {
    sixMonthChart.data.labels = labels;
    sixMonthChart.data.datasets[0].data = incomeData;
    sixMonthChart.data.datasets[1].data = expData;
    sixMonthChart.data.datasets[2].data = savData;
    sixMonthChart.update();
    return;
  }
  sixMonthChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {label:'Revenus', data:incomeData, backgroundColor:'rgba(0,212,255,0.7)', borderRadius:6},
        {label:'Dépenses', data:expData, backgroundColor:'rgba(248,113,113,0.7)', borderRadius:6},
        {label:'Épargne', data:savData, backgroundColor:'rgba(52,211,153,0.7)', borderRadius:6},
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{labels:{color:'#dbeafe'}}, tooltip:{callbacks:{label:ctx=>`${ctx.dataset.label}: ${formatCurrency(Number(ctx.raw))}`}}},
      scales:{ x:{ticks:{color:'#b7d8ff'},grid:{color:'rgba(56,189,248,0.08)'}}, y:{ticks:{color:'#b7d8ff'},grid:{color:'rgba(56,189,248,0.08)'}} }
    }
  });
}

// ─── GRAPHIQUE DONUT BUDGET ──────────────────────────────────
let budgetDonutChart = null;
function updateBudgetDonutChart() {
  const canvas = document.getElementById('budgetDonutChart');
  const legendEl = document.getElementById('budgetDonutLegend');
  if (!canvas || typeof Chart === 'undefined') return;

  const fixed = getDynamicTotal('fixedCharges');
  const perso = getDynamicTotal('personalExpenses');
  const grocery = getDynamicTotal('groceryExpenses');
  const total = fixed + perso + grocery;

  const labels = ['Charges fixes', 'Dépenses perso', 'Courses'];
  const data = [fixed, perso, grocery];
  const colors = ['#38bdf8', '#f472b6', '#34d399'];

  if (legendEl) {
    legendEl.innerHTML = labels.map((l, i) => {
      const pct = total > 0 ? ((data[i] / total) * 100).toFixed(1) : '0.0';
      return `<div class="donut-legend-item">
        <span class="donut-legend-dot" style="background:${colors[i]}"></span>
        <span>${l}</span>
        <strong>${formatCurrency(data[i])} <small>(${pct}%)</small></strong>
      </div>`;
    }).join('');
  }

  if (budgetDonutChart) {
    budgetDonutChart.data.datasets[0].data = data;
    budgetDonutChart.update();
    return;
  }

  budgetDonutChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors, borderColor: 'rgba(15,23,42,0.95)', borderWidth: 2, hoverOffset: 5 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '62%',
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => `${ctx.label}: ${formatCurrency(Number(ctx.raw))}` } }
      }
    }
  });
}
