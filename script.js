// ================= NAVIGATION =================
const calcBtn = document.getElementById("calc-btn");
const convBtn = document.getElementById("conv-btn");
const calculatorSection = document.getElementById("calculator-section");
const converterSection = document.getElementById("converter-section");

function showPage(pageToShow) {
  calculatorSection.classList.remove("active");
  converterSection.classList.remove("active");
  calcBtn.classList.remove("active");
  convBtn.classList.remove("active");

  if (pageToShow === "calculator") {
    calculatorSection.classList.add("active");
    calcBtn.classList.add("active");
  } else if (pageToShow === "converter") {
    converterSection.classList.add("active");
    convBtn.classList.add("active");
  }
}

calcBtn.addEventListener("click", () => showPage("calculator"));
convBtn.addEventListener("click", () => showPage("converter"));

// ================= CALCULATOR =================
const calcDisplay = document.getElementById("calc-display");
const calcButtonsContainer = document.querySelector(".calc-buttons");

let currentInput = "";      // the expression being built
let resultShown = false;    // whether we just displayed a result

// Format a number nicely: thousands separators + max 8 decimals
function formatNumber(num) {
  if (typeof num !== "number" || !isFinite(num)) return num;
  return num.toLocaleString("en-US", { maximumFractionDigits: 8 });
}

// Update the display with the current expression
function updateDisplay() {
  calcDisplay.textContent = currentInput || "0";
}

// Smart evaluation:
//   "200 + 10%"  ->  200 + (200 * 10 / 100) = 220   (percentage OF the first number)
//   "200 - 10%"  ->  180
//   "200 * 10%"  ->  20
//   "50%"        ->  0.5
function evaluateExpression(expr) {
  const percentOf = expr.match(/^(-?\d+(?:\.\d+)?)([+\-])(\d+(?:\.\d+)?)%$/);
  if (percentOf) {
    const a = parseFloat(percentOf[1]);
    const op = percentOf[2];
    const b = parseFloat(percentOf[3]);
    const portion = (a * b) / 100;
    return op === "+" ? a + portion : a - portion;
  }

  const cleaned = expr.replace(/%/g, "/100");
  return Function('"use strict"; return (' + cleaned + ")")();
}

// Evaluate the expression and show the result
function calculate() {
  if (!currentInput) return;

  const expr = currentInput.replace(/×/g, "*").replace(/÷/g, "/");

  let result;
  try {
    result = evaluateExpression(expr);
  } catch (error) {
    calcDisplay.textContent = "Error";
    currentInput = "";
    resultShown = false;
    return;
  }

  // Guard against Infinity / NaN
  if (typeof result !== "number" || !isFinite(result)) {
    calcDisplay.textContent = "Error";
    currentInput = "";
    resultShown = false;
    return;
  }

  // Round to avoid floating point tails (e.g. 0.1 + 0.2)
  result = Math.round(result * 100000000) / 100000000;

  // Show BOTH the expression and the formatted result
  calcDisplay.textContent = currentInput + " = " + formatNumber(result);

  // Keep the raw result for further calculations
  currentInput = result.toString();
  resultShown = true;
}

// Central function: applies a button press or a key press
function handleInput(value) {
  if (value === "C") {
    currentInput = "";
    resultShown = false;
    updateDisplay();
    return;
  }

  if (value === "=") {
    calculate();
    return;
  }

  const isDigitOrDot = /^[0-9.]$/.test(value);

  // If a result was just shown...
  if (resultShown) {
    if (isDigitOrDot) {
      // ...and a number is pressed -> start a brand new calculation
      currentInput = "";
    }
    // ...and an operator is pressed -> continue from the result
    resultShown = false;
  }

  // Prevent two operators in a row: replace the last one
  const operators = ["+", "-", "*", "/"];
  const lastChar = currentInput.slice(-1);
  if (operators.includes(value) && operators.includes(lastChar)) {
    currentInput = currentInput.slice(0, -1) + value;
  } else {
    currentInput += value;
  }

  updateDisplay();
}

// ---- Mouse / touch input ----
calcButtonsContainer.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn");
  if (!btn) return;
  handleInput(btn.dataset.value);
});

// ---- Keyboard input ----
document.addEventListener("keydown", (e) => {
  // Only respond when the calculator page is visible
  if (!calculatorSection.classList.contains("active")) return;

  // Ignore typing inside the converter's input / dropdowns
  const tag = document.activeElement.tagName;
  if (tag === "INPUT" || tag === "SELECT") return;

  const key = e.key;

  if (/^[0-9.]$/.test(key)) {
    handleInput(key);
    e.preventDefault();
  } else if (["+", "-", "*", "/"].includes(key)) {
    handleInput(key);
    e.preventDefault();
  } else if (key === "%") {
    handleInput("%");
    e.preventDefault();
  } else if (key === "Enter" || key === "=") {
    handleInput("=");
    e.preventDefault();
  } else if (key === "Escape" || key === "c" || key === "C") {
    handleInput("C");
    e.preventDefault();
  } else if (key === "Backspace") {
    currentInput = currentInput.slice(0, -1);
    resultShown = false;
    updateDisplay();
    e.preventDefault();
  }
});

// Initial display
updateDisplay();
// ================= CONVERTER =================
const categorySelect = document.getElementById("category");
const inputValue = document.getElementById("input-value");
const fromUnit = document.getElementById("from-unit");
const toUnit = document.getElementById("to-unit");
const convertedValue = document.getElementById("converted-value");

// All supported units per category.
// Non-temperature units use a "factor": how many base units 1 of this unit equals.
// Example: 1 kilometer = 1000 meters, so factor = 1000.
const unitData = {
  length: {
    label: "Length",
    units: {
      Millimeter: 0.001,
      Centimeter: 0.01,
      Meter: 1,
      Kilometer: 1000,
      Inch: 0.0254,
      Foot: 0.3048,
      Yard: 0.9144,
      Mile: 1609.344
    }
  },
  weight: {
    label: "Weight",
    units: {
      Milligram: 0.000001,
      Gram: 0.001,
      Kilogram: 1,
      Tonne: 1000,
      Ounce: 0.0283495,
      Pound: 0.453592
    }
  },
  volume: {
    label: "Volume",
    units: {
      Milliliter: 0.001,
      Liter: 1,
      "Cubic Meter": 1000,
      "Gallon (US)": 3.78541,
      "Cup (US)": 0.236588
    }
  },
  time: {
    label: "Time",
    units: {
      Millisecond: 0.001,
      Second: 1,
      Minute: 60,
      Hour: 3600,
      Day: 86400,
      Week: 604800
    }
  },
  area: {
    label: "Area",
    units: {
      "Square Millimeter": 0.000001,
      "Square Centimeter": 0.0001,
      "Square Meter": 1,
      "Square Kilometer": 1000000,
      Hectare: 10000,
      Acre: 4046.86
    }
  },
  speed: {
    label: "Speed",
    units: {
      "Meters per second": 1,
      "Kilometers per hour": 0.277778,
      "Miles per hour": 0.44704,
      Knot: 0.514444
    }
  },
  temperature: {
    label: "Temperature",
    special: true,           // temperature needs formulas, not factors
    units: ["Celsius", "Fahrenheit", "Kelvin"]
  }
};

// Fill the "From" and "To" dropdowns based on the selected category
function populateUnits() {
  const category = categorySelect.value;
  const data = unitData[category];

  // Clear existing options
  fromUnit.innerHTML = "";
  toUnit.innerHTML = "";

  // Get the list of unit names for this category
  const unitNames = data.special ? data.units : Object.keys(data.units);

  // Add each unit to both dropdowns
  unitNames.forEach((name) => {
    fromUnit.add(new Option(name, name));
    toUnit.add(new Option(name, name));
  });

  // Pick a sensible default for the "To" dropdown (second option if available)
  if (unitNames.length > 1) {
    toUnit.selectedIndex = 1;
  }

  convertValue();
}

// Perform the actual conversion
function convertValue() {
  const raw = inputValue.value.trim();

  // If the input is empty or not a number, show a hint
  if (raw === "" || isNaN(parseFloat(raw))) {
    convertedValue.textContent = "Enter a value to convert";
    return;
  }

  const value = parseFloat(raw);
  const category = categorySelect.value;
  const from = fromUnit.value;
  const to = toUnit.value;
  const data = unitData[category];

  let result;

  if (data.special) {
    // ---- Temperature: convert to Celsius, then to target unit ----
    let celsius;
    if (from === "Celsius")        celsius = value;
    else if (from === "Fahrenheit") celsius = (value - 32) * 5 / 9;
    else                            celsius = value - 273.15; // Kelvin

    if (to === "Celsius")          result = celsius;
    else if (to === "Fahrenheit")  result = celsius * 9 / 5 + 32;
    else                           result = celsius + 273.15; // Kelvin
  } else {
    // ---- Normal units: convert to base, then to target ----
    const baseValue = value * data.units[from];
    result = baseValue / data.units[to];
  }

  // Round to avoid long floating-point tails
  result = Math.round(result * 1000000) / 1000000;

  convertedValue.textContent = value + " " + from + " = " + result + " " + to;
}

// When the category changes, refill the unit dropdowns
categorySelect.addEventListener("change", populateUnits);

// Reconvert whenever the user changes the value or picks different units
inputValue.addEventListener("input", convertValue);
fromUnit.addEventListener("change", convertValue);
toUnit.addEventListener("change", convertValue);

// Initialize the converter on page load
populateUnits();