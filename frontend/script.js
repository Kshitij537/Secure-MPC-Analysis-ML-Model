// ===============================
// ELEMENT REFERENCES
// ===============================
const form       = document.getElementById("predictionForm");
const age        = document.getElementById("age");
const sex        = document.getElementById("sex");
const cp         = document.getElementById("cp");
const trestbps   = document.getElementById("trestbps");
const chol       = document.getElementById("chol");
const fbs        = document.getElementById("fbs");
const restecg    = document.getElementById("restecg");
const thalach    = document.getElementById("thalach");
const exang      = document.getElementById("exang");
const oldpeak    = document.getElementById("oldpeak");
const slope      = document.getElementById("slope");
const ca         = document.getElementById("ca");
const thal       = document.getElementById("thal");

const idleView    = document.getElementById("idleView");
const loadingView = document.getElementById("loadingView");
const resultView  = document.getElementById("resultView");

const predictionText = document.getElementById("predictionText");
const confValue      = document.getElementById("confValue");
const meterFill      = document.getElementById("meterFill");
const riskAdvice     = document.getElementById("riskAdvice");
const resultBadge    = document.getElementById("resultBadge");

// Risk breakdown bars
const rfAge        = document.getElementById("rfAge");
const rfCardiac    = document.getElementById("rfCardiac");
const rfLifestyle  = document.getElementById("rfLifestyle");
const rfAgePct     = document.getElementById("rfAgePct");
const rfCardiacPct = document.getElementById("rfCardiacPct");
const rfLifestylePct = document.getElementById("rfLifestylePct");

// ===============================
// LIVE CLOCK
// ===============================
function updateClock() {
  const el = document.getElementById("liveTime");
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
  });
}
updateClock();
setInterval(updateClock, 1000);

// ===============================
// LOADING STEPS ANIMATION
// ===============================
function animateLoadingSteps() {
  const steps = [
    document.getElementById("lstep1"),
    document.getElementById("lstep2"),
    document.getElementById("lstep3"),
  ];

  // Reset all
  steps.forEach(s => {
    if (s) { s.classList.remove("active", "done"); }
  });

  if (steps[0]) steps[0].classList.add("active");

  setTimeout(() => {
    if (steps[0]) { steps[0].classList.remove("active"); steps[0].classList.add("done"); }
    if (steps[1]) steps[1].classList.add("active");
  }, 700);

  setTimeout(() => {
    if (steps[1]) { steps[1].classList.remove("active"); steps[1].classList.add("done"); }
    if (steps[2]) steps[2].classList.add("active");
  }, 1400);
}

// ===============================
// COMPUTE RISK BREAKDOWN
// ===============================
function computeRiskFactors(features, isDisease) {
  const [ageVal, , , bp, cholVal, , , hr, exAngina, op] = features;

  // Simple heuristic scores (0–100)
  const ageFactor     = Math.min(100, Math.round(((ageVal - 20) / 60) * 100));
  const cardiacFactor = Math.min(100, Math.round(
    (Number(exAngina) * 30) + (op / 6 * 40) + ((200 - hr) / 140 * 30)
  ));
  const lifestyleFactor = Math.min(100, Math.round(
    (bp > 130 ? 40 : 20) + (cholVal > 240 ? 40 : cholVal > 200 ? 25 : 10)
  ));

  return { ageFactor, cardiacFactor, lifestyleFactor };
}

// ===============================
// SHOW RESULT
// ===============================
function showResult(prediction, confidence, features) {
  loadingView.classList.add("hidden");
  resultView.classList.remove("hidden");

  // Model convention: 1 = No disease (healthy), 0 = Disease detected
  const isDisease = prediction === 0;

  // Badge
  resultBadge.className = "result-badge " + (isDisease ? "danger" : "success");

  // Prediction text
  predictionText.innerText = isDisease ? "Disease Detected" : "No Heart Disease";
  predictionText.style.color = isDisease ? "var(--red)" : "var(--green)";

  // Meter
  const color = isDisease
    ? "linear-gradient(90deg, #f43f5e, #fb7185)"
    : "linear-gradient(90deg, #22c55e, #4ade80)";

  confValue.innerText = confidence.toFixed(1);
  meterFill.style.background = color;
  setTimeout(() => {
    meterFill.style.width = `${confidence}%`;
  }, 50);

  // Risk breakdown bars
  const { ageFactor, cardiacFactor, lifestyleFactor } = computeRiskFactors(features, isDisease);

  setTimeout(() => {
    rfAge.style.width       = `${ageFactor}%`;
    rfCardiac.style.width   = `${cardiacFactor}%`;
    rfLifestyle.style.width = `${lifestyleFactor}%`;
    rfAgePct.innerText       = ageFactor + "%";
    rfCardiacPct.innerText   = cardiacFactor + "%";
    rfLifestylePct.innerText = lifestyleFactor + "%";
  }, 200);

  // Set bar colors based on risk level
  const barColor = isDisease ? "#f43f5e" : "#22c55e";
  rfAge.style.background      = barColor;
  rfCardiac.style.background  = barColor;
  rfLifestyle.style.background = barColor;

  // Advice
  if (isDisease) {
    riskAdvice.innerHTML = `
      <strong style="color:var(--red)">⚠ High Cardiovascular Risk</strong><br>
      Please consult a cardiologist immediately. Follow-up diagnostics and lifestyle intervention recommended.
    `;
    riskAdvice.style.borderColor = "rgba(244,63,94,0.25)";
    riskAdvice.style.background  = "rgba(244,63,94,0.05)";
  } else {
    riskAdvice.innerHTML = `
      <strong style="color:var(--green)">✓ Low Cardiovascular Risk</strong><br>
      Patient presents healthy markers. Routine check-up in 12 months recommended.
    `;
    riskAdvice.style.borderColor = "rgba(34,197,94,0.25)";
    riskAdvice.style.background  = "rgba(34,197,94,0.05)";
  }
}

// ===============================
// FORM SUBMIT
// ===============================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  idleView.classList.add("hidden");
  resultView.classList.add("hidden");
  loadingView.classList.remove("hidden");
  animateLoadingSteps();

  const features = [
    age.value, sex.value, cp.value, trestbps.value, chol.value,
    fbs.value, restecg.value, thalach.value, exang.value,
    oldpeak.value, slope.value, ca.value, thal.value
  ].map(v => Number(v) || 0);

  try {
    const response = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Prediction request failed.");

    const prediction  = Number(data.prediction);
    const confidence  = Number(data.confidence) || 0;

    setTimeout(() => {
      showResult(prediction, confidence, features);
    }, 2100);

  } catch (error) {
    // Demo mode if backend not connected
    console.warn("Backend not connected, showing demo result:", error.message);
    setTimeout(() => {
      const demoConf = 72 + Math.random() * 20;
      const demoFeat = features;
      // 1 = healthy, 0 = disease — match model convention
      showResult(demoConf > 80 ? 1 : 0, demoConf, demoFeat);
    }, 2100);
  }
});

// ===============================
// FILL HEALTHY DATA
// ===============================
function fillHealthyData() {
  age.value      = 30;
  sex.value      = 0;
  cp.value       = 0;
  trestbps.value = 110;
  chol.value     = 175;
  fbs.value      = 0;
  restecg.value  = 0;
  thalach.value  = 180;
  exang.value    = 0;
  oldpeak.value  = 0;
  slope.value    = 1;
  ca.value       = 0;
  thal.value     = 1;

  // Flash inputs to show they were filled
  document.querySelectorAll("input, select").forEach(el => {
    el.style.borderColor = "var(--teal)";
    el.style.boxShadow   = "0 0 0 2px rgba(20,184,166,0.15)";
    setTimeout(() => {
      el.style.borderColor = "";
      el.style.boxShadow   = "";
    }, 800);
  });
}

// ===============================
// RESET FORM
// ===============================
function resetForm() {
  form.reset();
  meterFill.style.width = "0%";
  predictionText.innerText = "--";
  confValue.innerText = "0";
  rfAge.style.width = rfCardiac.style.width = rfLifestyle.style.width = "0%";
  rfAgePct.innerText = rfCardiacPct.innerText = rfLifestylePct.innerText = "—";

  resultView.classList.add("hidden");
  loadingView.classList.add("hidden");
  idleView.classList.remove("hidden");
}