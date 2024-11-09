// Get all necessary DOM elements
const inputs = {
  loanAmount: document.getElementById("loanAmount"),
  interestRate: document.getElementById("interestRate"),
  loanTerm: document.getElementById("loanTerm"),
};

const errors = {
  loanAmount: document.getElementById("loanAmountError"),
  interestRate: document.getElementById("interestRateError"),
  loanTerm: document.getElementById("loanTermError"),
};

const results = {
  monthlyPayment: document.getElementById("monthlyPayment"),
  totalInterest: document.getElementById("totalInterest"),
  totalPayment: document.getElementById("totalPayment"),
};

// Validation rules
const validationRules = {
  loanAmount: {
    min: 1000,
    max: 10000000,
    message: "Loan amount must be between $1,000 and $10,000,000",
  },
  interestRate: {
    min: 0.1,
    max: 30,
    message: "Interest rate must be between 0.1% and 30%",
  },
  loanTerm: {
    min: 1,
    max: 40,
    message: "Loan term must be between 1 and 40 years",
  },
};

// Format currency
const formatCurrency = (number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(number);
};

// Validate input
const validateInput = (input, value) => {
  const rules = validationRules[input];
  const errorElement = errors[input];
  const inputElement = inputs[input];

  if (value < rules.min || value > rules.max) {
    errorElement.textContent = rules.message;
    errorElement.style.display = "block";
    inputElement.classList.add("error");
    return false;
  }

  errorElement.style.display = "none";
  inputElement.classList.remove("error");
  return true;
};

// Calculate amortization schedule
const calculateAmortizationSchedule = (
  loanAmount,
  annualRate,
  loanTermYears
) => {
  const monthlyRate = annualRate / 100 / 12;
  const numberOfPayments = loanTermYears * 12;
  const monthlyPayment =
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

  let schedule = [];
  let remainingBalance = loanAmount;

  for (let payment = 1; payment <= numberOfPayments; payment++) {
    const interestPayment = remainingBalance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    remainingBalance -= principalPayment;

    schedule.push({
      payment,
      monthlyPayment,
      principalPayment,
      interestPayment,
      remainingBalance: Math.max(0, remainingBalance),
    });
  }

  return schedule;
};

// Update amortization table
const updateAmortizationTable = (schedule) => {
  const tbody = document.querySelector("#amortizationTable tbody");
  tbody.innerHTML = "";

  schedule.forEach((row, index) => {
    if (index < 12 || index === schedule.length - 1) {
      // Show only first year and last payment
      const tr = document.createElement("tr");
      tr.innerHTML = `
                        <td>${row.payment}</td>
                        <td>${formatCurrency(row.monthlyPayment)}</td>
                        <td>${formatCurrency(row.principalPayment)}</td>
                        <td>${formatCurrency(row.interestPayment)}</td>
                        <td>${formatCurrency(row.remainingBalance)}</td>
                    `;
      tbody.appendChild(tr);
    }
  });
};

// Chart configuration
let currentChart = null;

const createBreakdownChart = (totalPrincipal, totalInterest) => {
  if (currentChart) {
    currentChart.destroy();
  }

  const ctx = document.getElementById("loanChart").getContext("2d");
  currentChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Principal", "Interest"],
      datasets: [
        {
          data: [totalPrincipal, totalInterest],
          backgroundColor: ["#4299e1", "#e53e3e"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
};

const createAmortizationChart = (schedule) => {
  if (currentChart) {
    currentChart.destroy();
  }

  const ctx = document.getElementById("loanChart").getContext("2d");
  currentChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: schedule.map((row) => row.payment),
      datasets: [
        {
          label: "Remaining Balance",
          data: schedule.map((row) => row.remainingBalance),
          borderColor: "#4299e1",
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
          ticks: {
            callback: (value) => formatCurrency(value),
          },
        },
      },
    },
  });
};

// Show different charts
const showChart = (type) => {
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((tab) => tab.classList.remove("active"));
  event.target.classList.add("active");

  calculateLoan(type);
};

// Main calculation function
const calculateLoan = (chartType = "breakdown") => {
  // Get and validate inputs
  const loanAmount = parseFloat(inputs.loanAmount.value);
  const annualRate = parseFloat(inputs.interestRate.value);
  const loanTermYears = parseFloat(inputs.loanTerm.value);

  // Validate all inputs
  const isValid = Object.keys(inputs).every((input) =>
    validateInput(input, parseFloat(inputs[input].value))
  );

  if (!isValid) return;

  // Calculate loan details
  const monthlyRate = annualRate / 100 / 12;
  const numberOfPayments = loanTermYears * 12;
  const monthlyPayment =
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

  const totalPayment = monthlyPayment * numberOfPayments;
  const totalInterest = totalPayment - loanAmount;

  // Update results
  results.monthlyPayment.textContent = formatCurrency(monthlyPayment);
  results.totalInterest.textContent = formatCurrency(totalInterest);
  results.totalPayment.textContent = formatCurrency(totalPayment);

  // Calculate and update amortization schedule
  const schedule = calculateAmortizationSchedule(
    loanAmount,
    annualRate,
    loanTermYears
  );
  updateAmortizationTable(schedule);

  // Update chart
  if (chartType === "breakdown") {
    createBreakdownChart(loanAmount, totalInterest);
  } else {
    createAmortizationChart(schedule);
  }
};

// Add event listeners
Object.values(inputs).forEach((input) => {
  input.addEventListener("input", () => calculateLoan());
});

// Initial calculation
calculateLoan();
