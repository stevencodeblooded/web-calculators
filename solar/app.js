let productionChart, savingsChart;

function calculateROI() {
  // Get input values
  const location = document.getElementById("location").value;
  const roofSize = parseFloat(document.getElementById("roof-size").value);
  const roofAngle = parseFloat(document.getElementById("roof-angle").value);
  const consumption = parseFloat(
    document.getElementById("energy-consumption").value
  );
  const electricityRate = parseFloat(
    document.getElementById("electricity-rate").value
  );

  // Basic validation
  if (
    !location ||
    !roofSize ||
    !roofAngle ||
    !consumption ||
    !electricityRate
  ) {
    alert("Please fill in all fields");
    return;
  }

  // Calculate solar panel capacity (rough estimate)
  const wattsPerSqFt = 15; // Average watts per square foot
  const systemCapacity = roofSize * wattsPerSqFt;

  // Calculate monthly production (simplified model)
  const monthlyProduction = [];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Seasonal adjustment factors
  const seasonalFactors = [
    0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.2, 1.1, 1.0, 0.9, 0.8, 0.7,
  ];

  // Calculate production for each month
  seasonalFactors.forEach((factor) => {
    const angleEfficiency = Math.cos(((90 - roofAngle) * Math.PI) / 180);
    const monthlyKWh = systemCapacity * 0.004 * 30 * factor * angleEfficiency;
    monthlyProduction.push(monthlyKWh);
  });

  // Calculate annual values
  const annualProduction = monthlyProduction.reduce((a, b) => a + b, 0);
  const annualSavings = annualProduction * electricityRate;

  // Estimate system cost ($3 per watt is typical)
  const systemCost = systemCapacity * 3;
  const breakEvenYears = systemCost / annualSavings;

  // Update results
  document.getElementById("annual-production").textContent =
    Math.round(annualProduction).toLocaleString() + " kWh";
  document.getElementById("annual-savings").textContent =
    "$" + Math.round(annualSavings).toLocaleString();
  document.getElementById("breakeven").textContent =
    breakEvenYears.toFixed(1) + " years";

  // Update charts
  updateProductionChart(monthNames, monthlyProduction);
  updateSavingsChart(breakEvenYears, annualSavings);
}

function updateProductionChart(labels, data) {
  if (productionChart) {
    productionChart.destroy();
  }

  const ctx = document.getElementById("productionChart").getContext("2d");
  productionChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Monthly Energy Production (kWh)",
          data: data,
          backgroundColor: "rgba(52, 152, 219, 0.7)",
          borderColor: "rgba(52, 152, 219, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Energy Production (kWh)",
          },
        },
      },
    },
  });
}

function updateSavingsChart(breakEvenYears, annualSavings) {
  if (savingsChart) {
    savingsChart.destroy();
  }

  const years = Array.from(
    { length: Math.ceil(breakEvenYears) + 5 },
    (_, i) => i
  );
  const savings = years.map((year) => year * annualSavings);
  const systemCost = breakEvenYears * annualSavings;
  const costLine = Array(years.length).fill(systemCost);

  const ctx = document.getElementById("savingsChart").getContext("2d");
  savingsChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: years,
      datasets: [
        {
          label: "Cumulative Savings ($)",
          data: savings,
          borderColor: "rgba(46, 204, 113, 1)",
          backgroundColor: "rgba(46, 204, 113, 0.1)",
          fill: true,
        },
        {
          label: "System Cost ($)",
          data: costLine,
          borderColor: "rgba(231, 76, 60, 1)",
          borderDash: [5, 5],
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Amount ($)",
          },
        },
        x: {
          title: {
            display: true,
            text: "Years",
          },
        },
      },
    },
  });
}
