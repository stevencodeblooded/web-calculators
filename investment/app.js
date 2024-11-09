// Global variables
let assets = [];
let charts = {
    target: null,
    comparison: null
};

// Initialize the calculator
function init() {
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        initializeApp();
    }
}

function initializeApp() {
    setupCharts();
    setupEventListeners();
    updateUI();
}

// Setup event listeners
function setupEventListeners() {
    const totalValueInput = document.getElementById('totalValue');
    if (totalValueInput) {
        totalValueInput.addEventListener('change', updateUI);
    }

    const assetForm = document.getElementById('assetForm');
    if (assetForm) {
        assetForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('newAssetName').value;
            const currentAllocation = Number(document.getElementById('newAssetCurrent').value);
            const targetAllocation = Number(document.getElementById('newAssetTarget').value);
            const risk = document.getElementById('newAssetRisk').value;

            const asset = {
                id: Date.now(),
                name,
                currentAllocation,
                targetAllocation,
                risk
            };

            assets.push(asset);
            
            // Reset form
            this.reset();
            
            updateUI();
        });
    }
}

// Add a new asset to the portfolio
function addAsset() {
    const asset = {
        id: Date.now(),
        name: '',
        currentAllocation: 0,
        targetAllocation: 0,
        value: 0,
        risk: 'medium'
    };
    assets.push(asset);
    updateUI();
}

// Remove an asset from the portfolio
function removeAsset(id) {
    assets = assets.filter(asset => asset.id !== id);
    updateUI();
}

// Update asset data
function updateAsset(id, field, value) {
    const asset = assets.find(a => a.id === id);
    if (asset) {
        asset[field] = value;
        updateUI();
    }
}

function setupCharts() {
    // Clean up existing charts if they exist
    if (charts.target) {
        charts.target.destroy();
    }
    if (charts.comparison) {
        charts.comparison.destroy();
    }

    const targetCanvas = document.getElementById('targetChart');
    if (targetCanvas) {
        const targetCtx = targetCanvas.getContext('2d');
        charts.target = new Chart(targetCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#2563eb',
                        '#7c3aed',
                        '#db2777',
                        '#dc2626',
                        '#ea580c',
                        '#65a30d'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    const comparisonCanvas = document.getElementById('comparisonChart');
    if (comparisonCanvas) {
        const comparisonCtx = comparisonCanvas.getContext('2d');
        charts.comparison = new Chart(comparisonCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Current Allocation',
                        data: [],
                        backgroundColor: '#2563eb'
                    },
                    {
                        label: 'Target Allocation',
                        data: [],
                        backgroundColor: '#7c3aed'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: value => value + '%'
                        }
                    }
                }
            }
        });
    }
}

// Update UI elements
function updateUI() {
    updateAssetList();
    updateCharts();
    updateRecommendations();
    updateSummaryStats();
    updateRiskAnalysis();
}

// Update asset list display
function updateAssetList() {
    const assetList = document.getElementById('assetList');
    if (!assetList) return;
    
    assetList.innerHTML = assets.map(asset => `
        <tr>
            <td data-label="Asset Name">${asset.name || 'Unnamed Asset'}</td>
            <td data-label="Current Allocation">${asset.currentAllocation}%</td>
            <td data-label="Target Allocation">${asset.targetAllocation}%</td>
            <td data-label="Risk Level">${asset.risk}</td>
            <td data-label="Actions">
                <button onclick="removeAsset(${asset.id})" class="bg-red-600">Remove</button>
            </td>
        </tr>
    `).join('');
}

// Update charts with current data
function updateCharts() {
    if (charts.target) {
        const chartData = {
            labels: assets.map(asset => asset.name || 'Unnamed Asset'),
            data: assets.map(asset => asset.targetAllocation)
        };

        charts.target.data.labels = chartData.labels;
        charts.target.data.datasets[0].data = chartData.data;
        charts.target.update();
    }

    if (charts.comparison) {
        const chartData = {
            labels: assets.map(asset => asset.name || 'Unnamed Asset'),
            current: assets.map(asset => asset.currentAllocation),
            target: assets.map(asset => asset.targetAllocation)
        };

        charts.comparison.data.labels = chartData.labels;
        charts.comparison.data.datasets[0].data = chartData.current;
        charts.comparison.data.datasets[1].data = chartData.target;
        charts.comparison.update();
    }
}

// Calculate and display rebalancing recommendations
function updateRecommendations() {
    const totalValue = Number(document.getElementById('totalValue').value);
    const recommendationsDiv = document.getElementById('recommendations');
    if (!recommendationsDiv) return;
    
    let recommendations = assets.map(asset => {
        const currentValue = (asset.currentAllocation / 100) * totalValue;
        const targetValue = (asset.targetAllocation / 100) * totalValue;
        const difference = targetValue - currentValue;
        const action = difference > 0 ? 'Buy' : 'Sell';
        
        return {
            asset: asset.name || 'Unnamed Asset',
            action,
            amount: Math.abs(difference),
            risk: asset.risk
        };
    }).filter(rec => Math.abs(rec.amount) > 100);

    recommendationsDiv.innerHTML = recommendations.length > 0 ? recommendations.map(rec => `
        <div class="recommendation-item">
            <strong>${rec.action} ${rec.asset}</strong>: 
            $${rec.amount.toFixed(2)}
            <br>
            <small>Risk Level: ${rec.risk}</small>
            ${rec.action === 'Sell' ? `
                <div class="tax-impact">
                    Potential tax impact: $${(rec.amount * 0.15).toFixed(2)}
                </div>
            ` : ''}
        </div>
    `).join('') : '<p>No rebalancing needed at this time.</p>';
}

// Helper functions for calculations
function calculateAverageDeviation() {
    if (assets.length === 0) return 0;
    
    const deviations = assets.map(asset => 
        Math.abs(asset.currentAllocation - asset.targetAllocation)
    );
    return deviations.reduce((a, b) => a + b, 0) / assets.length;
}

function calculateRiskScore() {
    if (assets.length === 0) return 0;
    
    const riskValues = {
        low: 2,
        medium: 5,
        high: 8
    };
    
    const weightedRisk = assets.reduce((acc, asset) => 
        acc + (riskValues[asset.risk] * (asset.currentAllocation / 100)), 0
    );
    return Math.round(weightedRisk);
}

function calculateRebalanceCost(totalValue) {
    const tradingFeePercent = 0.0025; // 0.25% per trade
    let totalCost = 0;
    
    assets.forEach(asset => {
        const currentValue = (asset.currentAllocation / 100) * totalValue;
        const targetValue = (asset.targetAllocation / 100) * totalValue;
        const difference = Math.abs(targetValue - currentValue);
        totalCost += difference * tradingFeePercent;
    });

    return totalCost;
}

// Update summary statistics
function updateSummaryStats() {
    const totalValue = Number(document.getElementById('totalValue').value);
    const summaryStats = document.getElementById('summaryStats');
    if (!summaryStats) return;

    const stats = {
        totalAssets: assets.length,
        avgDeviation: calculateAverageDeviation(),
        riskScore: calculateRiskScore(),
        rebalanceCost: calculateRebalanceCost(totalValue),
        totalCurrentAllocation: assets.reduce((sum, asset) => sum + asset.currentAllocation, 0),
        totalTargetAllocation: assets.reduce((sum, asset) => sum + asset.targetAllocation, 0)
    };

    summaryStats.innerHTML = `
        <div class="summary-item">Total Assets: ${stats.totalAssets}</div>
        <div class="summary-item">Average Deviation: ${stats.avgDeviation.toFixed(2)}%</div>
        <div class="summary-item">Risk Score: ${stats.riskScore}</div>
        <div class="summary-item">Rebalance Cost: $${stats.rebalanceCost.toFixed(2)}</div>
        <div class="summary-item">Total Current Allocation: ${stats.totalCurrentAllocation}%</div>
        <div class="summary-item">Total Target Allocation: ${stats.totalTargetAllocation}%</div>
        ${(stats.totalCurrentAllocation !== 100 || stats.totalTargetAllocation !== 100) ? `
            <div class="summary-item warning">
                Warning: Total allocations do not add up to 100%.
            </div>
        ` : ''}
    `;
}

// Update risk analysis
function updateRiskAnalysis() {
    const riskAnalysisDiv = document.getElementById('riskAnalysis');
    if (!riskAnalysisDiv) return;
    
    const riskScore = calculateRiskScore();
    let riskLevel = 'Low';
    if (riskScore > 5 && riskScore <= 7) {
        riskLevel = 'Moderate';
    } else if (riskScore > 7) {
        riskLevel = 'High';
    }

    riskAnalysisDiv.innerHTML = `
        <div class="risk-summary">Portfolio Risk Level: ${riskLevel} (Score: ${riskScore})</div>
    `;
}

// Initialize the application
init();