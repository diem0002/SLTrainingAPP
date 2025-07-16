document.addEventListener('DOMContentLoaded', () => {
  // Elementos del DOM
  const form = document.getElementById('config-form');
  const phaseDisplay = document.getElementById('phase');
  const timeDisplay = document.getElementById('time');
  const roundDisplay = document.getElementById('round');
  const timerDisplay = document.getElementById('timer-display');
  const startBtn = document.getElementById('start-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const resetBtn = document.getElementById('reset-btn');
  const customConfig = document.getElementById('custom-config');
  const modeSelect = document.getElementById('mode');
  
  // Sonidos
  const startSound = document.getElementById('start-sound');
  const restSound = document.getElementById('rest-sound');
  const endSound = document.getElementById('end-sound');
  const beepSound = document.getElementById('beep-sound');

  // Variables de estado
  let interval;
  let isWorking = true;
  let currentRound = 1;
  let workTime, restTime, totalRounds, currentTime;
  let isPaused = false;

  // Cargar configuración guardada
  loadSavedConfig();

  // Event Listeners
  form.addEventListener('submit', startTimer);
  pauseBtn.addEventListener('click', togglePause);
  resetBtn.addEventListener('click', resetTimer);
  modeSelect.addEventListener('change', updateFormFields);

  // Funciones
  function startTimer(e) {
    e.preventDefault();
    clearInterval(interval);
    
    const mode = modeSelect.value;

    // Configurar tiempos según el modo
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
    } else { // HIIT personalizado
      workTime = parseInt(document.getElementById('workTime').value);
      restTime = parseInt(document.getElementById('restTime').value);
      totalRounds = parseInt(document.getElementById('rounds').value);
    }

    // Guardar configuración
    saveConfig();

    // Iniciar timer
    currentRound = 1;
    isWorking = true;
    isPaused = false;
    timerDisplay.style.display = 'block';
    startBtn.textContent = 'Reiniciar';
    startWorkout();
  }

  function startWorkout() {
    currentTime = isWorking ? workTime : restTime;
    updateDisplay();
    if (isWorking) startSound.play();

    interval = setInterval(() => {
      if (!isPaused) {
        currentTime--;
        
        // Beep en los últimos 3 segundos
        if (currentTime <= 3 && currentTime > 0) beepSound.play();

        if (currentTime <= 0) {
          if (isWorking) {
            // Cambiar a descanso
            if (restTime > 0) {
              restSound.play();
              isWorking = false;
              currentTime = restTime;
              if (Notification.permission === 'granted') {
                new Notification('¡Descanso!', { body: 'Tómate un respiro' });
              }
            } else {
              // Pasar directamente a la siguiente ronda
              nextRound();
            }
          } else {
            // Cambiar a ejercicio
            nextRound();
          }
        }
        updateDisplay();
      }
    }, 1000);
  }

  function nextRound() {
    currentRound++;
    if (currentRound > totalRounds) {
      endWorkout();
      return;
    }
    startSound.play();
    isWorking = true;
    currentTime = workTime;
    if (Notification.permission === 'granted') {
      new Notification('¡A entrenar!', { body: `Ronda ${currentRound} de ${totalRounds}` });
    }
  }

  function updateDisplay() {
    timeDisplay.textContent = formatTime(currentTime);
    phaseDisplay.textContent = isWorking ? '🏃 Ejercicio' : '🛌 Descanso';
    roundDisplay.textContent = `Ronda ${currentRound}/${totalRounds}`;
    
    // Actualizar progress bar
    const progressPercent = isWorking 
      ? (1 - currentTime / workTime) * 100 
      : (1 - currentTime / restTime) * 100;
    document.getElementById('progress-bar').style.width = `${progressPercent}%`;
    
    // Cambiar color según fase
    document.getElementById('progress-bar').style.backgroundColor = isWorking ? '#ff3366' : '#0ff';
  }

  function endWorkout() {
    clearInterval(interval);
    timeDisplay.textContent = '00:00';
    phaseDisplay.textContent = '✅ Finalizado';
    roundDisplay.textContent = `Completado ${totalRounds} rondas`;
    document.getElementById('progress-bar').style.width = '100%';
    endSound.play();
    
    if (Notification.permission === 'granted') {
      new Notification('¡Entrenamiento completado!', { body: 'Buen trabajo' });
    }
  }

  function togglePause() {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? '▶ Reanudar' : '⏸ Pausar';
    
    if (!isPaused && currentTime <= 0) {
      // Si estaba en transición cuando se pausó
      if (isWorking && restTime > 0) {
        isWorking = false;
        currentTime = restTime;
        restSound.play();
      } else {
        nextRound();
      }
    }
  }

  function resetTimer() {
    clearInterval(interval);
    timerDisplay.style.display = 'none';
    startBtn.textContent = 'Iniciar';
    document.getElementById('progress-bar').style.width = '0%';
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function saveConfig() {
    const config = {
      workTime: document.getElementById('workTime').value,
      restTime: document.getElementById('restTime').value,
      rounds: document.getElementById('rounds').value,
      mode: modeSelect.value
    };
    localStorage.setItem('gymTimerConfig', JSON.stringify(config));
  }

  function loadSavedConfig() {
    const savedConfig = localStorage.getItem('gymTimerConfig');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      document.getElementById('workTime').value = config.workTime;
      document.getElementById('restTime').value = config.restTime;
      document.getElementById('rounds').value = config.rounds;
      modeSelect.value = config.mode;
      updateFormFields();
    }
  }

  function updateFormFields() {
    const mode = modeSelect.value;
    if (mode === 'tabata' || mode === 'amrap' || mode === 'emom') {
      customConfig.style.display = 'none';
    } else {
      customConfig.style.display = 'block';
    }
  }

  // Solicitar permisos para notificaciones
  if ('Notification' in window) {
    Notification.requestPermission();
  }
});