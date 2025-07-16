const form = document.getElementById('config-form');
const phaseDisplay = document.getElementById('phase');
const timeDisplay = document.getElementById('time');
const roundDisplay = document.getElementById('round');

const startSound = document.getElementById('start-sound');
const restSound = document.getElementById('rest-sound');
const endSound = document.getElementById('end-sound');
const beepSound = document.getElementById('beep-sound');

let interval;
let isWorking = true;
let currentRound = 1;
let workTime, restTime, totalRounds, currentTime;

form.addEventListener('submit', e => {
  e.preventDefault();
  clearInterval(interval);

  const mode = document.getElementById('mode').value;

  if (mode === 'tabata') {
    workTime = 20;
    restTime = 10;
    totalRounds = 8;
  } else if (mode === 'amrap') {
    workTime = parseInt(document.getElementById('workTime').value);
    restTime = 0;
    totalRounds = 1;
  } else if (mode === 'emom') {
    workTime = 60;
    restTime = 0;
    totalRounds = parseInt(document.getElementById('rounds').value);
  } else {
    // Modo HIIT personalizado
    workTime = parseInt(document.getElementById('workTime').value);
    restTime = parseInt(document.getElementById('restTime').value);
    totalRounds = parseInt(document.getElementById('rounds').value);
  }

  currentRound = 1;
  isWorking = true;
  startWorkout();
});


function startWorkout() {
  currentTime = workTime;
  updateDisplay();
  startSound.play();

  interval = setInterval(() => {
    currentTime--;
    if (currentTime <= 3 && currentTime > 0) beepSound.play();

    if (currentTime <= 0) {
      if (isWorking) {
        restSound.play();
        isWorking = false;
        currentTime = restTime;
      } else {
        currentRound++;
        if (currentRound > totalRounds) {
          endWorkout();
          return;
        }
        startSound.play();
        isWorking = true;
        currentTime = workTime;
      }
    }
    updateDisplay();
  }, 1000);
}

function updateDisplay() {
  timeDisplay.textContent = formatTime(currentTime);
  phaseDisplay.textContent = isWorking ? '🏃 Ejercicio' : '🛌 Descanso';
  roundDisplay.textContent = `Ronda ${currentRound} / ${totalRounds}`;
}

function endWorkout() {
  clearInterval(interval);
  timeDisplay.textContent = '00:00';
  phaseDisplay.textContent = '✅ Finalizado';
  endSound.play();
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
