// Elementos del DOM
const timerDisplay = document.getElementById('timer-display');
const phaseDisplay = document.getElementById('phase-display');
const roundDisplay = document.getElementById('round-display');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('btn-pause');
const resetBtn = document.getElementById('btn-reset');
const stopBtn = document.getElementById('btn-stop');
const soundStartRing = document.getElementById('sound-startRing');
const toggleRoutineBtn = document.getElementById('toggle-routine-btn');

// Configuración
soundStartRing.volume = 1.0;

// Variables del temporizador
let workDuration, restDuration, totalRounds;
let currentRound = 1;
let isWorking = true;
let timeLeft = 0;
let timer = null;
let isPaused = false;
let isStopped = false;

// Iniciar temporizador
startBtn.onclick = function() {
  isStopped = false;
  
  const work = parseInt(document.getElementById('custom-work').value);
  const rest = parseInt(document.getElementById('custom-rest').value);
  const rounds = parseInt(document.getElementById('custom-rounds').value);
  const workUnit = document.getElementById('custom-work-unit').value;
  const restUnit = document.getElementById('custom-rest-unit').value;

  workDuration = workUnit === 'min' ? work * 60 : work;
  restDuration = restUnit === 'min' ? rest * 60 : rest;
  totalRounds = rounds;

  document.getElementById('preset-container').style.display = 'none';
  document.getElementById('timer-view').style.display = 'flex';
  
  currentRound = 1;
  isWorking = true;
  timeLeft = workDuration;
  isPaused = false;
  
  updateDisplay();
  
  playStartRing(() => {
    if (!isStopped) {
      timer = setInterval(tick, 1000);
    }
  });
};

function playStartRing(callback) {
  if (!soundStartRing || isStopped) {
    if (callback) callback();
    return;
  }
  
  soundStartRing.currentTime = 0;
  soundStartRing.play()
    .then(() => {
      if (callback && !isStopped) setTimeout(callback, 2000);
    })
    .catch(e => {
      console.error("Error al reproducir sonido:", e);
      if (callback) callback();
    });
}

function tick() {
  if (isPaused || isStopped) return;
  
  timeLeft--;
  updateDisplay();
  
  if (timeLeft < 0) {
    if (isWorking) {
      if (restDuration > 0) {
        switchToRest();
      } else {
        nextRoundOrFinish();
      }
    } else {
      nextRoundOrFinish();
    }
  }
}

function switchToRest() {
  if (isStopped) return;
  
  isWorking = false;
  timeLeft = restDuration;
  updateDisplay();
  playStartRing();
}

function nextRoundOrFinish() {
  if (isStopped) return;
  
  currentRound++;
  
  if (currentRound > totalRounds) {
    finishWorkout();
  } else {
    startNewRound();
  }
}

function finishWorkout() {
  clearInterval(timer);
  timer = null;
  document.getElementById('timer-view').className = 'finished';
  document.body.className = 'finished';
  phaseDisplay.textContent = 'Terminado';
  timerDisplay.textContent = '00:00';
  roundDisplay.textContent = '';
  stopAllSounds();
}

function startNewRound() {
  if (isStopped) return;
  
  isWorking = true;
  timeLeft = workDuration;
  updateDisplay();
  playStartRing();
}

function resetTimer() {
  isStopped = false;
  isWorking = true;
  currentRound = 1;
  timeLeft = workDuration;
  isPaused = false;
  updateDisplay();
  
  stopAllSounds();
  clearInterval(timer);
  
  playStartRing(() => {
    if (!isStopped) {
      timer = setInterval(tick, 1000);
    }
  });
}

function stopTimer() {
  isStopped = true;
  clearInterval(timer);
  timer = null;
  isPaused = false;
  
  document.getElementById('preset-container').style.display = 'flex';
  document.getElementById('timer-view').style.display = 'none';
  
  stopAllSounds();
  
  document.body.className = '';
  document.getElementById('timer-view').className = '';
  pauseBtn.textContent = 'Pausar';
}

function stopAllSounds() {
  var sounds = [
    document.getElementById('sound-start'),
    document.getElementById('sound-beep'),
    document.getElementById('sound-end'),
    document.getElementById('sound-startRing')
  ];
  
  sounds.forEach(function(sound) {
    if (sound) {
      sound.pause();
      sound.currentTime = 0;
    }
  });
}

function updateDisplay() {
  if (isStopped) return;
  
  const displayTime = Math.max(0, timeLeft);
  const min = Math.floor(displayTime / 60).toString().padStart(2, '0');
  const sec = (displayTime % 60).toString().padStart(2, '0');
  timerDisplay.textContent = `${min}:${sec}`;
  
  phaseDisplay.textContent = isWorking ? 'Trabajo' : 'Descanso';
  roundDisplay.textContent = `Ronda ${currentRound} / ${totalRounds}`;
  
  const bgClass = isPaused ? 'paused' : (isWorking ? 'active-work' : 'active-rest');
  document.getElementById('timer-view').className = bgClass;
  document.body.className = bgClass;
}

// Controladores de eventos
pauseBtn.onclick = function() {
  if (isStopped) return;
  
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? 'Continuar' : 'Pausar';
  updateDisplay();
};

resetBtn.onclick = function() {
  resetTimer();
};

stopBtn.onclick = function() {
  stopTimer();
};

toggleRoutineBtn.onclick = function() {
  const routineDisplay = document.getElementById('routine-display');
  if (routineDisplay.style.display === 'none') {
    routineDisplay.style.display = 'flex';
    this.textContent = 'Ocultar Rutinas';
  } else {
    routineDisplay.style.display = 'none';
    this.textContent = 'Mostrar Rutinas';
  }
};

// Cargar rutinas al iniciar
window.addEventListener('DOMContentLoaded', function() {
  if (typeof loadSavedRoutine === 'function') {
    loadSavedRoutine();
  }
});