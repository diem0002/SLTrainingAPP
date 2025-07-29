// Elementos del DOM
const timerDisplay = document.getElementById('timer-display');
const phaseDisplay = document.getElementById('phase-display');
const roundDisplay = document.getElementById('round-display');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('btn-pause');
const resetBtn = document.getElementById('btn-reset');
const stopBtn = document.getElementById('btn-stop');
const soundStart = document.getElementById('sound-start');
const soundEnd = document.getElementById('sound-end');
const soundStartRing = document.getElementById('sound-startRing');
const soundBeep = document.getElementById('sound-beep');
const progressBar = document.getElementById('progress');
const routineDisplay = document.getElementById('routine-display');
const presetContainer = document.getElementById('preset-container');
const timerView = document.getElementById('timer-view');

// Variables del temporizador
let workDuration = 0;
let restDuration = 0;
let totalRounds = 0;
let currentRound = 1;
let isWorking = true;
let timeLeft = 0;
let timer = null;
let countdownTimer = null;
let isPaused = false;
let isStopped = false;

// Iniciar entrenamiento
function startWorkout() {
  isStopped = false;
  
  // Obtener valores de configuración
  const work = parseInt(document.getElementById('custom-work').value) || 30;
  const rest = parseInt(document.getElementById('custom-rest').value) || 15;
  const rounds = parseInt(document.getElementById('custom-rounds').value) || 5;
  const workUnit = document.getElementById('custom-work-unit').value;
  const restUnit = document.getElementById('custom-rest-unit').value;

  // Convertir a segundos
  workDuration = workUnit === 'min' ? work * 60 : work;
  restDuration = restUnit === 'min' ? rest * 60 : rest;
  totalRounds = rounds;

  // Configurar vista
  presetContainer.style.display = 'none';
  timerView.style.display = 'flex';
  routineDisplay.style.display = 'flex';
  
  // Activar modo fullscreen
  document.body.classList.add('fullscreen-mode');
  timerView.classList.add('timer-as-background');
  routineDisplay.classList.add('fullscreen-routines');

  // Inicializar variables
  currentRound = 1;
  isWorking = true;
  timeLeft = workDuration;
  isPaused = false;
  
  updateDisplay();
  startCountdown();
}

// Cuenta regresiva inicial (3, 2, 1)
function startCountdown() {
  clearInterval(countdownTimer);
  
  if (isPaused || isStopped) return;

  let count = 3;
  phaseDisplay.textContent = 'Preparado';
  
  function updateCountdown() {
    if (isPaused || isStopped) {
      clearInterval(countdownTimer);
      return;
    }

    if (count > 0) {
      timerDisplay.textContent = count.toString();
      playBeep();
      count--;
    } else {
      clearInterval(countdownTimer);
      timerDisplay.textContent = formatTime(timeLeft);
      phaseDisplay.textContent = isWorking ? 'Trabajo' : 'Descanso';
      playStartRing();
      startTimer();
    }
  }
  
  updateCountdown();
  countdownTimer = setInterval(updateCountdown, 1000);
}

// Temporizador principal
function startTimer() {
  clearInterval(timer);
  
  if (isStopped) return;

  timer = setInterval(() => {
    if (isPaused || isStopped) return;
    
    timeLeft--;
    updateDisplay();
    
    if (timeLeft < 0) {
      if (isWorking) {
        if (currentRound < totalRounds && restDuration > 0) {
          switchToRest();
        } else {
          nextRoundOrFinish();
        }
      } else {
        nextRoundOrFinish();
      }
    }
  }, 1000);
}

// Cambiar a fase de descanso
function switchToRest() {
  isWorking = false;
  timeLeft = restDuration;
  updateDisplay();
  playStartRing();
}

// Manejar fin de ronda o entrenamiento
function nextRoundOrFinish() {
  currentRound++;
  
  if (currentRound > totalRounds) {
    finishWorkout();
  } else {
    isWorking = true;
    timeLeft = workDuration;
    updateDisplay();
    playStartRing();
  }
}

// Finalizar entrenamiento
function finishWorkout() {
  clearInterval(timer);
  timer = null;
  
  // Aplicar estado visual "finished"
  document.body.className = 'finished fullscreen-mode';
  timerView.className = 'timer-as-background finished';
  
  // Actualizar texto
  phaseDisplay.textContent = 'Terminado';
  timerDisplay.textContent = '00:00';
  roundDisplay.textContent = '';
  
  // Detener todos los sonidos primero
  stopAllSounds();
  
  // Reproducir startRing.mp3 (como tú querías)
  if (soundStartRing) {
    soundStartRing.currentTime = 0; // Rebobinar
    soundStartRing.volume = 1.0; // Volumen al máximo
    soundStartRing.play().catch(e => {
      console.error("Error al reproducir startRing:", e);
      // Fallback opcional: si falla, reproducir end.mp3
      if (soundEnd) {
        soundEnd.currentTime = 0;
        soundEnd.play();
      }
    });
  }
  
  // Opcional: si quieres un sonido más largo al final, puedes agregar:
  setTimeout(() => {
    if (soundStartRing && !isStopped) {
      soundStartRing.currentTime = 0;
      soundStartRing.play();
    }
  }, 1000);
}

// Función para resetear
function resetTimer() {
  isStopped = false;
  isWorking = true;
  currentRound = 1;
  timeLeft = workDuration;
  isPaused = false;
  
  stopAllSounds();
  clearInterval(timer);
  clearInterval(countdownTimer);
  
  updateDisplay();
  startCountdown();
}

// Función para detener
function stopTimer() {
  isStopped = true;
  clearInterval(timer);
  clearInterval(countdownTimer);
  timer = null;
  countdownTimer = null;
  isPaused = false;
  
  // Restaurar vista normal
  presetContainer.style.display = 'flex';
  timerView.style.display = 'none';
  routineDisplay.style.display = 'none';
  
  // Quitar clases de fullscreen
  document.body.className = '';
  timerView.className = '';
  routineDisplay.className = '';
  
  // Restablecer texto del botón de pausa
  pauseBtn.textContent = 'Pausar';
  
  stopAllSounds();
}

// Helper: Formatear tiempo (MM:SS)
function formatTime(seconds) {
  const displayTime = Math.max(0, seconds);
  const min = Math.floor(displayTime / 60).toString().padStart(2, '0');
  const sec = (displayTime % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

// Helper: Actualizar pantalla
function updateDisplay() {
  if (isStopped) return;
  
  timerDisplay.textContent = formatTime(timeLeft);
  phaseDisplay.textContent = isWorking ? 'Trabajo' : 'Descanso';
  roundDisplay.textContent = `Ronda ${currentRound} / ${totalRounds}`;
  
  // Determinar el estado actual
  let stateClass = '';
  if (isPaused) {
    stateClass = 'paused';
  } else if (isWorking) {
    stateClass = 'active-work';
  } else {
    stateClass = 'active-rest';
  }

  // Aplicar clases de estado
  document.body.className = stateClass + ' fullscreen-mode';
  timerView.className = 'timer-as-background ' + stateClass;

  // Actualizar barra de progreso
  const totalTime = isWorking ? workDuration : restDuration;
  const percentage = Math.max(0, (timeLeft / totalTime) * 100);
  progressBar.style.width = `${percentage}%`;
  progressBar.style.backgroundColor = isWorking ? '#4CAF50' : '#2196F3';
}

// Helpers: Sonidos
function playBeep() {
  if (!soundBeep || isStopped) return;
  soundBeep.currentTime = 0;
  soundBeep.play().catch(e => console.error("Error al reproducir pitido:", e));
}

function playStartRing() {
  if (!soundStartRing || isStopped) return;
  soundStartRing.currentTime = 0;
  soundStartRing.play().catch(e => console.error("Error al reproducir sonido:", e));
}

function playFinalSound() {
  if (!soundEnd || isStopped) return;
  soundEnd.currentTime = 0;
  soundEnd.play().catch(e => console.error("Error al reproducir sonido final:", e));
}

function stopAllSounds() {
  [soundStart, soundBeep, soundEnd, soundStartRing].forEach(sound => {
    if (sound) {
      sound.pause();
      sound.currentTime = 0;
    }
  });
}

// Controladores de eventos
startBtn.addEventListener('click', startWorkout);

pauseBtn.addEventListener('click', () => {
  if (isStopped) return;
  
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? 'Continuar' : 'Pausar';
  
  if (isPaused) {
    clearInterval(timer);
    clearInterval(countdownTimer);
  } else {
    if (timeLeft === workDuration || timeLeft === restDuration) {
      startCountdown();
    } else {
      startTimer();
    }
  }
  
  updateDisplay();
});

resetBtn.addEventListener('click', resetTimer);
stopBtn.addEventListener('click', stopTimer);

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  if (typeof loadSavedRoutine === 'function') {
    loadSavedRoutine();
  }
});