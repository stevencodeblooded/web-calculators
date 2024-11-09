document.addEventListener('DOMContentLoaded', function() {
    const calculateBtn = document.getElementById('calculate');
    calculateBtn.addEventListener('click', calculateAll);

    // Input validation rules
    const validationRules = {
        height: { min: 100, max: 250, message: "Height must be between 100-250 cm" },
        weight: { min: 30, max: 300, message: "Weight must be between 30-300 kg" },
        age: { min: 15, max: 100, message: "Age must be between 15-100 years" },
        neck: { min: 20, max: 60, message: "Neck measurement must be between 20-60 cm" },
        waist: { min: 40, max: 200, message: "Waist measurement must be between 40-200 cm" },
        hip: { min: 50, max: 200, message: "Hip measurement must be between 50-200 cm" }
    };

    // Add validation containers after each input
    Object.keys(validationRules).forEach(inputId => {
        const input = document.getElementById(inputId);
        const container = document.createElement('div');
        container.className = 'validation-message';
        container.id = `${inputId}-validation`;
        container.style.color = 'red';
        container.style.fontSize = '12px';
        container.style.marginTop = '4px';
        container.style.minHeight = '18px'; // Prevents layout shift
        input.parentNode.appendChild(container);
    });

    function validateInput(input) {
        const value = parseFloat(input.value);
        const rules = validationRules[input.id];
        const validationContainer = document.getElementById(`${input.id}-validation`);
        
        if (!input.value) {
            validationContainer.textContent = `Please enter a value`;
            return false;
        } else if (isNaN(value) || value < rules.min || value > rules.max) {
            validationContainer.textContent = rules.message;
            return false;
        } else {
            validationContainer.textContent = '';
            return true;
        }
    }

    // Add real-time validation to all numeric inputs
    Object.keys(validationRules).forEach(inputId => {
        const input = document.getElementById(inputId);
        
        input.addEventListener('input', function() {
            // Only allow numbers and decimal point
            this.value = this.value.replace(/[^\d.]/g, '');
            // Validate and show message immediately
            validateInput(this);
        });

        input.addEventListener('blur', function() {
            validateInput(this);
        });
    });

    function calculateBMI(weight, height) {
        const bmi = weight / ((height / 100) ** 2);
        let category;
        
        if (bmi < 18.5) category = "Underweight";
        else if (bmi < 25) category = "Normal weight";
        else if (bmi < 30) category = "Overweight";
        else category = "Obese";
        
        return { value: bmi.toFixed(1), category };
    }

    function calculateBodyFat(gender, weight, height, neck, waist, hip) {
        let bodyFat;
        if (gender === 'male') {
            bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
        } else {
            bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
        }
        
        let category;
        if (gender === 'male') {
            if (bodyFat < 6) category = "Essential fat";
            else if (bodyFat < 14) category = "Athletes";
            else if (bodyFat < 18) category = "Fitness";
            else if (bodyFat < 25) category = "Average";
            else category = "Obese";
        } else {
            if (bodyFat < 14) category = "Essential fat";
            else if (bodyFat < 21) category = "Athletes";
            else if (bodyFat < 25) category = "Fitness";
            else if (bodyFat < 32) category = "Average";
            else category = "Obese";
        }
        
        return { value: bodyFat.toFixed(1), category };
    }

    function calculateDailyCalories(weight, height, age, gender, activity, goal) {
        let bmr;
        if (gender === 'male') {
            bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
        } else {
            bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
        }
        
        let tdee = bmr * parseFloat(activity);
        
        switch(goal) {
            case 'lose':
                tdee -= 500;
                break;
            case 'gain':
                tdee += 500;
                break;
        }
        
        return Math.round(tdee);
    }

    function calculateMacros(calories, goal) {
        let protein, carbs, fats;
        
        switch(goal) {
            case 'lose':
                protein = (calories * 0.40) / 4;
                fats = (calories * 0.35) / 9;
                carbs = (calories * 0.25) / 4;
                break;
            case 'maintain':
                protein = (calories * 0.30) / 4;
                fats = (calories * 0.30) / 9;
                carbs = (calories * 0.40) / 4;
                break;
            case 'gain':
                protein = (calories * 0.25) / 4;
                fats = (calories * 0.25) / 9;
                carbs = (calories * 0.50) / 4;
                break;
        }
        
        return {
            protein: Math.round(protein),
            carbs: Math.round(carbs),
            fats: Math.round(fats)
        };
    }

    function updateResults(bmi, bodyFat, calories, macros) {
        document.getElementById('bmi-value').textContent = bmi.value;
        document.getElementById('bmi-category').textContent = bmi.category;
        
        document.getElementById('bodyfat-value').textContent = bodyFat.value + '%';
        document.getElementById('bodyfat-category').textContent = bodyFat.category;
        
        document.getElementById('calories-value').textContent = calories + ' kcal';
        
        document.getElementById('protein-value').textContent = macros.protein + 'g';
        document.getElementById('carbs-value').textContent = macros.carbs + 'g';
        document.getElementById('fats-value').textContent = macros.fats + 'g';
        
        const totalGrams = macros.protein + macros.carbs + macros.fats;
        document.getElementById('protein-bar').style.width = (macros.protein / totalGrams * 100) + '%';
        document.getElementById('carbs-bar').style.width = (macros.carbs / totalGrams * 100) + '%';
        document.getElementById('fats-bar').style.width = (macros.fats / totalGrams * 100) + '%';
    }

    function calculateAll() {
        // Get all inputs
        const inputs = ['height', 'weight', 'age', 'neck', 'waist', 'hip'];
        
        // Validate all inputs first
        const isValid = inputs.every(inputId => validateInput(document.getElementById(inputId)));
        
        if (!isValid) {
            return; // Stop if any validation fails
        }

        // Get values for calculation
        const height = parseFloat(document.getElementById('height').value);
        const weight = parseFloat(document.getElementById('weight').value);
        const age = parseInt(document.getElementById('age').value);
        const gender = document.getElementById('gender').value;
        const neck = parseFloat(document.getElementById('neck').value);
        const waist = parseFloat(document.getElementById('waist').value);
        const hip = parseFloat(document.getElementById('hip').value);
        const activity = document.getElementById('activity').value;
        const goal = document.getElementById('goal').value;

        // Calculate and update results
        const bmi = calculateBMI(weight, height);
        const bodyFat = calculateBodyFat(gender, weight, height, neck, waist, hip);
        const calories = calculateDailyCalories(weight, height, age, gender, activity, goal);
        const macros = calculateMacros(calories, goal);

        updateResults(bmi, bodyFat, calories, macros);
    }
});