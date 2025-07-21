let intervalId = null;
let currentRound = 1;
let isWorkingPhase = true;
let timeLeft = 0;

const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const exitBtn = document.getElementById("exitBtn");
const overlay = document.getElementById("overlay");
const timerDisplay = document.getElementById("timerDisplay");
const roundDisplay = document.getElementById("roundDisplay");
const configContainer = document.getElementById("configContainer");

startBtn.addEventListener("click", startWorkoutSession);
resetBtn.addEventListener("click", resetTimer);
exitBtn.addEventListener("click", exitTimer);

function startWorkoutSession() {
  const mode = document.getElementById("modeSelect").value;

  let workTime = parseInt(document.getElementById("workTime").value);
  let restTime = parseInt(document.getElementById("restTime").value);
  const rounds = parseInt(document.getElementById("rounds").value);

  const workUnit = document.getElementById("workTimeUnit").value;
  const restUnit = document.getElementById("restTimeUnit").value;

  if (workUnit === "minutes") workTime *= 60;
  if (restUnit === "minutes") restTime *= 60;

  // Ajustes según modo
  if (mode === "tabata") {
    workTime = 20;
    restTime = 10;
  } else if (mode === "emom") {
    workTime = 60;
    restTime = 0;
  } else if (mode === "amrap") {
    workTime = 600; // 10 min AMRAP
    restTime = 0;
  }

  if (workTime <= 0) {
    alert("El tiempo de trabajo debe ser mayor a 0");
    return;
  }
  if (rounds <= 0) {
    alert("Las rondas deben ser mayores a 0");
    return;
  }

  configContainer.style.display = "none";
  overlay.style.display = "flex";

  currentRound = 1;
  isWorkingPhase = true;
  timeLeft = workTime;

  updateDisplay(timeLeft, currentRound);
  resetBtn.disabled = false;
  startBtn.disabled = true;

  playStartSound();

  // Guardar valores en variables globales para usarlas en el tick
  window.workTimeGlobal = workTime;
  window.restTimeGlobal = restTime;
  window.totalRoundsGlobal = rounds;

  intervalId = setInterval(timerTick, 1000);
}

function timerTick() {
  timeLeft--;

  if (timeLeft <= 0) {
    if (isWorkingPhase && window.restTimeGlobal > 0) {
      isWorkingPhase = false;
      timeLeft = window.restTimeGlobal;
      playRestSound();
    } else {
      currentRound++;
      if (currentRound > window.totalRoundsGlobal) {
        finishTimer();
        return;
      } else {
        isWorkingPhase = true;
        timeLeft = window.workTimeGlobal;
        playStartSound();
      }
    }
  }

  updateDisplay(timeLeft, currentRound);
  if (timeLeft <= 3 && timeLeft > 0) playBeepSound();
}

function updateDisplay(time, round) {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  timerDisplay.textContent =
    `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  roundDisplay.textContent =
    (isWorkingPhase ? "Ejercicio" : "Descanso") + ` - Ronda ${round} / ${window.totalRoundsGlobal}`;
}

function finishTimer() {
  clearInterval(intervalId);
  timerDisplay.textContent = "00:00";
  roundDisplay.textContent = "✅ ¡Entrenamiento finalizado!";
  startBtn.disabled = false;
  resetBtn.disabled = true;
  playEndSound();
}

function resetTimer() {
  clearInterval(intervalId);
  startBtn.disabled = false;
  resetBtn.disabled = true;
  timeLeft = 0;
  currentRound = 1;
  isWorkingPhase = true;
  timerDisplay.textContent = "00:00";
  roundDisplay.textContent = "";
}

function exitTimer() {
  resetTimer();
  overlay.style.display = "none";
  configContainer.style.display = "block";
}

// Sonidos simples con Web Audio API
function playBeepSound() {
  playTone(440, 0.15);
}

function playStartSound() {
  playTone(880, 0.3);
}

function playRestSound() {
  playTone(660, 0.3);
}

function playEndSound() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(784, audioCtx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(261.63, audioCtx.currentTime + 1);

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 1);
}

function playTone(freq, duration) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = freq;
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.error("Error de audio:", e);
  }
}
