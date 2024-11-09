// Constants for calculations
const EMISSIONS_FACTORS = {
    car: 0.404, // kg CO2 per mile
    transit: 0.14, // kg CO2 per trip
    flight: 900, // kg CO2 per flight (average)
    electricity: 0.92, // kg CO2 per kWh
    gas: 5.3, // kg CO2 per therm
    diet: {
        'meat-heavy': 3.3,
        'average': 2.5,
        'vegetarian': 1.7,
        'vegan': 1.5
    },
    shopping: 0.5 // kg CO2 per dollar
};

const NATIONAL_AVERAGE = 16000; // kg CO2 per year

// Initialize charts
let breakdownChart = null;
let reductionChart = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('calculate-btn').addEventListener('click', calculateFootprint);
    
    // Update local food value display
    document.getElementById('local-food').addEventListener('input', (e) => {
        document.getElementById('local-food-value').textContent = `${e.target.value}%`;
    });
    
    // Initialize charts
    initializeCharts();
});

function initializeCharts() {
    // Breakdown Chart
    const breakdownCtx = document.getElementById('breakdown-chart').getContext('2d');
    breakdownChart = new Chart(breakdownCtx, {
        type: 'doughnut',
        data: {
            labels: ['Transportation', 'Home Energy', 'Food', 'Consumption'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: [
                    '#2c5282',
                    '#48bb78',
                    '#ed8936',
                    '#9f7aea'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Emissions Breakdown'
                }
            }
        }
    });

    // Reduction Potential Chart
    const reductionCtx = document.getElementById('reduction-chart').getContext('2d');
    reductionChart = new Chart(reductionCtx, {
        type: 'bar',
        data: {
            labels: ['Current', 'Potential'],
            datasets: [{
                label: 'Annual CO2 Emissions (kg)',
                data: [0, 0],
                backgroundColor: ['#2c5282', '#48bb78']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Reduction Potential'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function calculateFootprint() {
    // Get all input values
    const carMiles = parseFloat(document.getElementById('car-miles').value) * 52; // Annual
    const transitTrips = parseFloat(document.getElementById('public-transit').value) * 52; // Annual
    const flights = parseFloat(document.getElementById('flights').value);
    const electricity = parseFloat(document.getElementById('electricity').value) * 12; // Annual
    const gas = parseFloat(document.getElementById('gas').value) * 12; // Annual
    const dietType = document.getElementById('diet-type').value;
    const localFood = parseFloat(document.getElementById('local-food').value);
    const shopping = parseFloat(document.getElementById('shopping').value) * 12; // Annual
    const recycling = document.getElementById('recycling').value;

    // Calculate emissions by category
    const transportationEmissions = (carMiles * EMISSIONS_FACTORS.car) +
        (transitTrips * EMISSIONS_FACTORS.transit) +
        (flights * EMISSIONS_FACTORS.flight);

    const energyEmissions = (electricity * EMISSIONS_FACTORS.electricity) +
        (gas * EMISSIONS_FACTORS.gas);

    const foodEmissions = EMISSIONS_FACTORS.diet[dietType] * 365 * (1 - (localFood * 0.002));

    const consumptionEmissions = shopping * EMISSIONS_FACTORS.shopping * 
        (recycling === 'always' ? 0.7 : recycling === 'sometimes' ? 0.85 : 1);

    // Calculate total emissions
    const totalEmissions = transportationEmissions + energyEmissions + 
        foodEmissions + consumptionEmissions;

    // Update displays
    updateEmissionsDisplay(totalEmissions);
    updateCharts(transportationEmissions, energyEmissions, foodEmissions, consumptionEmissions);
    generateRecommendations(transportationEmissions, energyEmissions, foodEmissions, consumptionEmissions);
}

function updateEmissionsDisplay(total) {
    const totalCO2Element = document.getElementById('total-co2');
    const comparisonElement = document.getElementById('comparison');
    
    const tonnes = (total / 1000).toFixed(1);
    totalCO2Element.textContent = `${tonnes} tonnes CO2e`;
    
    const percentDiff = ((total - NATIONAL_AVERAGE) / NATIONAL_AVERAGE * 100).toFixed(1);
    const comparisonText = percentDiff > 0 
        ? `${percentDiff}% above national average`
        : `${Math.abs(percentDiff)}% below national average`;
    comparisonElement.textContent = comparisonText;
}

function updateCharts(transport, energy, food, consumption) {
    // Update breakdown chart
    breakdownChart.data.datasets[0].data = [transport, energy, food, consumption];
    breakdownChart.update();

    // Update reduction potential chart
    const total = transport + energy + food + consumption;
    const potential = calculatePotentialReduction(transport, energy, food, consumption);
    reductionChart.data.datasets[0].data = [total, potential];
    reductionChart.update();
}

function calculatePotentialReduction(transport, energy, food, consumption) {
    // Calculate potential reductions based on best practices
    const reducedTransport = transport * 0.5; // Assuming 50% reduction through efficient transport
    const reducedEnergy = energy * 0.7; // Assuming 30% reduction through efficiency
    const reducedFood = food * 0.8; // Assuming 20% reduction through diet changes
    const reducedConsumption = consumption * 0.7; // Assuming 30% reduction through conscious consumption
    
    return reducedTransport + reducedEnergy + reducedFood + reducedConsumption;
}

function generateRecommendations(transport, energy, food, consumption) {
    const recommendations = [];
    const list = document.getElementById('recommendations-list');
    list.innerHTML = ''; // Clear existing recommendations

    // Add recommendations based on highest emission sources
    if (transport > 5000) {
        recommendations.push(
            'Consider carpooling or using public transportation more frequently',
            'Look into electric or hybrid vehicle options',
            'Try combining trips to reduce total mileage'
        );
    }

    if (energy > 4000) {
        recommendations.push(
            'Install a programmable thermostat',
            'Switch to LED light bulbs',
            'Consider adding insulation to your home'
        );
    }

    if (food > 3000) {
        recommendations.push(
            'Try incorporating more plant-based meals',
            'Buy more local and seasonal produce',
            'Start composting food waste'
        );
    }

    if (consumption > 2000) {
        recommendations.push(
            'Practice the 3 Rs: Reduce, Reuse, Recycle',
            'Choose products with minimal packaging',
            'Invest in durable, long-lasting items'
        );
    }

    // Add generic recommendations if emissions are relatively low
    if (transport + energy + food + consumption < 10000) {
        recommendations.push(
            'Great job! Keep tracking your emissions to maintain your low carbon footprint',
            'Consider offsetting your remaining emissions through verified carbon offset programs',
            'Share your sustainability practices with friends and family'
        );
    }

    // Add recommendations to the list
    recommendations.forEach(recommendation => {
        const li = document.createElement('li');
        li.textContent = recommendation;
        list.appendChild(li);
    });
}

// Helper function to validate number inputs
function validateNumberInput(input) {
    const value = parseFloat(input.value);
    if (isNaN(value) || value < 0) {
        input.value = 0;
    }
}

// Add input validation to all number inputs
document.addEventListener('DOMContentLoaded', () => {
    const numberInputs = document.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
        input.addEventListener('blur', () => validateNumberInput(input));
    });

    // Add realtime calculation updates when input values change
    const allInputs = document.querySelectorAll('input, select');
    allInputs.forEach(input => {
        input.addEventListener('change', calculateFootprint);
    });
});

// Export functions for testing purposes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateFootprint,
        updateEmissionsDisplay,
        updateCharts,
        calculatePotentialReduction,
        generateRecommendations,
        EMISSIONS_FACTORS
    };
}