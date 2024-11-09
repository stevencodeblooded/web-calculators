// Constants and utility functions
const MONTHS_PER_YEAR = 12;
const MIN_SUCCESS_PROBABILITY = 0.8;

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(amount);
}

function formatPercentage(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }).format(value / 100);
}

// Initialize charts
let wealthChart = null;
let probabilityChart = null;

document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    document.getElementById('calculate-btn').addEventListener('click', runSimulation);
});

function initializeCharts() {
    // Wealth Accumulation Chart
    const wealthCtx = document.getElementById('wealth-chart').getContext('2d');
    wealthChart = new Chart(wealthCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Optimistic (90th percentile)',
                    borderColor: '#22c55e',
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Median (50th percentile)',
                    borderColor: '#3b82f6',
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Conservative (10th percentile)',
                    borderColor: '#ef4444',
                    fill: false,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Projected Wealth Over Time'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => formatCurrency(value)
                    }
                }
            }
        }
    });

    // Probability Distribution Chart
    const probabilityCtx = document.getElementById('probability-chart').getContext('2d');
    probabilityChart = new Chart(probabilityCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Probability Distribution',
                backgroundColor: '#3b82f6',
                data: []
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Final Wealth Distribution'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Nest Egg Size'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Probability'
                    },
                    ticks: {
                        callback: (value) => formatPercentage(value * 100)
                    }
                }
            }
        }
    });
}

function runSimulation() {
    // Get input values
    const currentAge = parseInt(document.getElementById('current-age').value);
    const retirementAge = parseInt(document.getElementById('retirement-age').value);
    const lifeExpectancy = parseInt(document.getElementById('life-expectancy').value);
    const currentSavings = parseFloat(document.getElementById('current-savings').value);
    const monthlyContribution = parseFloat(document.getElementById('monthly-contribution').value);
    const desiredRetirementIncome = parseFloat(document.getElementById('desired-retirement-income').value);
    const expectedReturn = parseFloat(document.getElementById('expected-return').value) / 100;
    const returnVolatility = parseFloat(document.getElementById('return-volatility').value) / 100;
    const inflationRate = parseFloat(document.getElementById('inflation-rate').value) / 100;
    const simulationRuns = parseInt(document.getElementById('simulation-runs').value);

    // Run Monte Carlo simulation
    const results = performMonteCarloSimulation(
        currentAge, retirementAge, lifeExpectancy,
        currentSavings, monthlyContribution, desiredRetirementIncome,
        expectedReturn, returnVolatility, inflationRate,
        simulationRuns
    );

    // Update displays
    updateResults(results);
    updateCharts(results);
    generateRecommendations(results);
}

function performMonteCarloSimulation(
    currentAge, retirementAge, lifeExpectancy,
    currentSavings, monthlyContribution, desiredRetirementIncome,
    expectedReturn, returnVolatility, inflationRate,
    simulationRuns
) {
    const monthsToRetirement = (retirementAge - currentAge) * MONTHS_PER_YEAR;
    const retirementDuration = (lifeExpectancy - retirementAge) * MONTHS_PER_YEAR;
    const monthlyRetirementIncome = desiredRetirementIncome / MONTHS_PER_YEAR;
    
    let simulations = [];
    let finalBalances = [];

    // Run simulations
    for (let i = 0; i < simulationRuns; i++) {
        let balance = currentSavings;
        let simulation = [balance];
        
        // Accumulation phase
        for (let month = 1; month <= monthsToRetirement; month++) {
            const monthlyReturn = generateMonthlyReturn(expectedReturn, returnVolatility);
            balance = balance * (1 + monthlyReturn) + monthlyContribution;
            if (month % MONTHS_PER_YEAR === 0) {
                simulation.push(balance);
            }
        }

        // Retirement phase
        for (let month = 1; month <= retirementDuration; month++) {
            const monthlyReturn = generateMonthlyReturn(expectedReturn, returnVolatility);
            const inflationAdjustedIncome = monthlyRetirementIncome * Math.pow(1 + inflationRate, month / MONTHS_PER_YEAR);
            balance = balance * (1 + monthlyReturn) - inflationAdjustedIncome;
            
            if (month % MONTHS_PER_YEAR === 0) {
                simulation.push(Math.max(0, balance));
            }
        }

        simulations.push(simulation);
        finalBalances.push(simulation[simulation.length - 1]);
    }

    // Calculate statistics
    const successRate = finalBalances.filter(balance => balance > 0).length / simulationRuns;
    const sortedBalances = [...finalBalances].sort((a, b) => a - b);
    const percentiles = {
        tenth: sortedBalances[Math.floor(simulationRuns * 0.1)],
        median: sortedBalances[Math.floor(simulationRuns * 0.5)],
        ninetieth: sortedBalances[Math.floor(simulationRuns * 0.9)]
    };

    return {
        simulations,
        finalBalances,
        successRate,
        percentiles
    };
}

function generateMonthlyReturn(expectedReturn, volatility) {
    // Convert annual return and volatility to monthly
    const monthlyReturn = expectedReturn / MONTHS_PER_YEAR;
    const monthlyVolatility = volatility / Math.sqrt(MONTHS_PER_YEAR);
    
    // Generate random return using normal distribution
    const randomReturn = normalRandom() * monthlyVolatility + monthlyReturn;
    return randomReturn;
}

function normalRandom() {
    // Box-Muller transform for normal distribution
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function updateResults(results) {
    // Calculate success probability as a percentage
    const successProbability = (results.successRate * 100).toFixed(1);
    
    // Get median outcome from results.percentiles
    const medianOutcome = results.percentiles.median;
    
    // Determine risk level based on success rate
    let riskLevel;
    if (results.successRate >= 0.9) {
        riskLevel = 'Low';
    } else if (results.successRate >= 0.7) {
        riskLevel = 'Moderate';
    } else {
        riskLevel = 'High';
    }
    
    // Update DOM elements
    document.getElementById('success-probability').textContent = successProbability + '%';
    document.getElementById('median-outcome').textContent = formatCurrency(medianOutcome);
    document.getElementById('risk-level').textContent = riskLevel;
}

function updateCharts(results) {
    // Update wealth accumulation chart
    const timeLabels = Array.from({ length: results.simulations[0].length }, (_, i) => i);
    
    wealthChart.data.labels = timeLabels;
    wealthChart.data.datasets[0].data = timeLabels.map(t => 
        results.simulations.map(sim => sim[t]).sort((a, b) => a - b)[Math.floor(results.simulations.length * 0.9)]
    );
    wealthChart.data.datasets[1].data = timeLabels.map(t => 
        results.simulations.map(sim => sim[t]).sort((a, b) => a - b)[Math.floor(results.simulations.length * 0.5)]
    );
    wealthChart.data.datasets[2].data = timeLabels.map(t => 
        results.simulations.map(sim => sim[t]).sort((a, b) => a - b)[Math.floor(results.simulations.length * 0.1)]
    );
    wealthChart.update();

    // Update probability distribution chart
    const bins = calculateHistogramBins(results.finalBalances);
    probabilityChart.data.labels = bins.map(bin => formatCurrency(bin.min));
    probabilityChart.data.datasets[0].data = bins.map(bin => bin.probability);
    probabilityChart.update();
}

function calculateHistogramBins(data) {
    const binCount = 20;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binSize = (max - min) / binCount;
    
    const bins = Array.from({ length: binCount }, (_, i) => ({
        min: min + i * binSize,
        max: min + (i + 1) * binSize,
        count: 0
    }));
    
    data.forEach(value => {
        const binIndex = Math.min(
            Math.floor((value - min) / binSize),
            binCount - 1
        );
        bins[binIndex].count++;
    });
    
    bins.forEach(bin => {
        bin.probability = bin.count / data.length;
    });
    
    return bins;
}

function generateRecommendations(results) {
    // Get the correct element ID from HTML
    const recommendationsDiv = document.getElementById('recommendations-list');
    recommendationsDiv.innerHTML = '';
    
    if (results.successRate < MIN_SUCCESS_PROBABILITY) {
        const recommendations = [
            'Consider increasing your monthly contributions',
            'Explore ways to reduce your desired retirement income',
            'Look into delaying retirement to build a larger nest egg',
            'Review your investment strategy for opportunities to increase returns',
            'Consider working with a financial advisor to optimize your plan'
        ];
        
        recommendations.forEach(rec => {
            const li = document.createElement('li');
            li.textContent = rec;
            recommendationsDiv.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = 'Your retirement plan appears to be on track! Continue monitoring and adjusting as needed.';
        recommendationsDiv.appendChild(li);
    }
}