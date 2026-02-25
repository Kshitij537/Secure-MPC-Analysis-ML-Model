// ===============================
// ELEMENT REFERENCES
// ===============================
const form = document.getElementById("predictionForm");

const age = document.getElementById("age");
const sex = document.getElementById("sex");
const cp = document.getElementById("cp");
const trestbps = document.getElementById("trestbps");
const chol = document.getElementById("chol");
const fbs = document.getElementById("fbs");
const restecg = document.getElementById("restecg");
const thalach = document.getElementById("thalach");
const exang = document.getElementById("exang");
const oldpeak = document.getElementById("oldpeak");
const slope = document.getElementById("slope");
const ca = document.getElementById("ca");
const thal = document.getElementById("thal");

const idleView = document.getElementById("idleView");
const loadingView = document.getElementById("loadingView");
const resultView = document.getElementById("resultView");

const predictionText = document.getElementById("predictionText");
const confValue = document.getElementById("confValue");
const meterFill = document.getElementById("meterFill");
const riskAdvice = document.getElementById("riskAdvice");

// ===============================
// FORM SUBMIT -> SEND TO FLASK
// ===============================
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    idleView.classList.add("hidden");
    resultView.classList.add("hidden");
    loadingView.classList.remove("hidden");

    const features = [
        age.value,
        sex.value,
        cp.value,
        trestbps.value,
        chol.value,
        fbs.value,
        restecg.value,
        thalach.value,
        exang.value,
        oldpeak.value,
        slope.value,
        ca.value,
        thal.value
    ].map((v) => Number(v) || 0);

    try {
        const response = await fetch("/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ features })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "Prediction request failed.");
        }

        const prediction = Number(data.prediction);
        const confidence = Number(data.confidence) || 0;

        setTimeout(() => {
            loadingView.classList.add("hidden");
            resultView.classList.remove("hidden");

            const isDisease = prediction === 1;
            const color = isDisease ? "#34d399" : "#fb7185";  

            predictionText.innerText = isDisease ? "No Detected" : "Disease Detected";
            confValue.innerText = confidence.toFixed(2);

            predictionText.classList.remove("success-glow", "danger-glow");
            meterFill.classList.remove("glow");

            predictionText.style.color = color;
            meterFill.style.backgroundColor = color;
            meterFill.style.width = `${confidence}%`;

            if (isDisease) {
                predictionText.classList.add("danger-glow");
            } else {
                predictionText.classList.add("success-glow");
            }

            meterFill.classList.add("glow");

            riskAdvice.innerText = isDisease
                ? "High cardiovascular risk. Please consult a cardiologist."
                : "Low risk. Maintain a healthy lifestyle.";
        }, 700);
    } catch (error) {
        alert(error.message || "Server connection failed. Make sure Flask is running.");
        loadingView.classList.add("hidden");
        idleView.classList.remove("hidden");
    }
});

// ===============================
// FILL HEALTHY DATA
// ===============================
function fillHealthyData() {
    age.value = 30;
    sex.value = 0;
    cp.value = 0;
    trestbps.value = 110;
    chol.value = 175;
    fbs.value = 0;
    restecg.value = 0;
    thalach.value = 180;
    exang.value = 0;
    oldpeak.value = 0;
    slope.value = 1;
    ca.value = 0;
    thal.value = 1;
}

// ===============================
// RESET FORM
// ===============================
function resetForm() {
    form.reset();

    meterFill.style.width = "0%";
    predictionText.innerText = "--";
    confValue.innerText = "0";

    predictionText.classList.remove("success-glow", "danger-glow");
    meterFill.classList.remove("glow");

    resultView.classList.add("hidden");
    loadingView.classList.add("hidden");
    idleView.classList.remove("hidden");
}
