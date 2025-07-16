document.addEventListener('DOMContentLoaded', () => {
  // Elementos del DOM
  const elements = {
    form: document.getElementById('config-form'),
    phase: document.getElementById('phase'),
    time: document.getElementById('time'),
    round: document.getElementById('round'),
    timerDisplay: document.getElementById('timer-display'),
    countdownDisplay: document.getElementById('countdown-display'),
    countdownText: document.getElementById('countdown-text'),
    countdown: document.getElementById('countdown'),
    startBtn: document.getElementById('start-btn'),
    pauseBtn: document.getElementById('pause-btn'),
    resetBtn: document.getElementById('reset-btn'),
    configContainer: document.getElementById('config-container'),
    modeSelect: document.getElementById('mode'),
    overlay: document.getElementById('overlay')
  };

  // Estado del temporizador
  const state = {
    animationFrameId: null,
    isWorking: true,
    currentRound: 1,
    workTime: 0,
    restTime: 0,
    totalRounds: 0,
    currentTime: 0,
    isPaused: false,
    lastTimestamp: 0,
    accumulatedTime: 0,
    soundTimeout: null,
    countdownInterval: null
  };

  // Configuración inicial
  init();

  function init() {
    // Event listeners
    elements.form.addEventListener('submit', startTimer);
    elements.pauseBtn.addEventListener('click', togglePause);
    elements.resetBtn.addEventListener('click', resetTimer);
    elements.modeSelect.addEventListener('change', updateFormFields);
    
    // Cargar configuración guardada
    loadSavedConfig();
    
    // Solicitar permisos para notificaciones
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }

  function startTimer(e) {
    e.preventDefault();
    resetTimer();
    startCountdown();
  }

  function startCountdown() {
    let count = 3;
    
    // Mostrar overlay y countdown
    elements.overlay.classList.add('visible');
    elements.countdownDisplay.classList.remove('hidden');
    elements.configContainer.style.opacity = '0';
    elements.configContainer.style.pointerEvents = 'none';
    
    // Iniciar cuenta regresiva
    elements.countdown.textContent = count;
    playBeepSound();
    
    state.countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        elements.countdown.textContent = count;
        playBeepSound();
      } else {
        clearInterval(state.countdownInterval);
        elements.countdown.textContent = '¡YA!';
        playStartSound();
        
        setTimeout(() => {
          elements.countdownDisplay.classList.add('hidden');
          initializeWorkout();
        }, 500);
      }
    }, 1000);
  }

  function initializeWorkout() {
    const config = getFormConfig();
    
    // Configurar según el modo seleccionado
    switch(config.mode) {
      case 'tabata':
        state.workTime = 20;
        state.restTime = 10;
        state.totalRounds = 8;
        break;
      case 'amrap':
        state.workTime = toSeconds(config.workTime, config.workUnit);
        state.restTime = 0;
        state.totalRounds = 1;
        break;
      case 'emom':
        state.workTime = 60;
        state.restTime = 0;
        state.totalRounds = config.rounds;
        break;
      default: // HIIT
        state.workTime = toSeconds(config.workTime, config.workUnit);
        state.restTime = toSeconds(config.restTime, config.restUnit);
        state.totalRounds = config.rounds;
    }

    saveConfig();
    startWorkoutSession();
  }

  function startWorkoutSession() {
    state.currentRound = 1;
    state.isWorking = true;
    state.isPaused = false;
    state.currentTime = state.workTime;
    
    elements.timerDisplay.classList.remove('hidden');
    updateDisplay();
    
    state.lastTimestamp = performance.now();
    startWorkoutLoop();
  }

  function startWorkoutLoop(timestamp = 0) {
    if (state.isPaused) {
      state.lastTimestamp = timestamp;
      state.animationFrameId = requestAnimationFrame(startWorkoutLoop);
      return;
    }

    const elapsed = timestamp - state.lastTimestamp;
    state.accumulatedTime += elapsed;
    state.lastTimestamp = timestamp;

    if (state.accumulatedTime >= 1000) {
      const secondsPassed = Math.floor(state.accumulatedTime / 1000);
      state.currentTime -= secondsPassed;
      state.accumulatedTime %= 1000;

      // Sonido en últimos 3 segundos
      if (state.currentTime <= 3 && state.currentTime > 0) {
        clearTimeout(state.soundTimeout);
        state.soundTimeout = setTimeout(playBeepSound, 0);
      }

      // Cambiar fase o ronda
      if (state.currentTime <= 0) {
        if (state.isWorking && state.restTime > 0) {
          switchToRest();
        } else {
          nextRoundOrFinish();
          return;
        }
      }
      
      updateDisplay();
    }

    if (state.currentTime > 0) {
      state.animationFrameId = requestAnimationFrame(startWorkoutLoop);
    } else {
      finishWorkout();
    }
  }

  function switchToRest() {
    clearTimeout(state.soundTimeout);
    state.soundTimeout = setTimeout(playRestSound, 0);
    state.isWorking = false;
    state.currentTime = state.restTime;
    showNotification('¡Descanso!', 'Tómate un respiro');
    updateDisplay();
  }

  function nextRoundOrFinish() {
    state.currentRound++;
    if (state.currentRound > state.totalRounds) {
      finishWorkout();
      return;
    }
    
    clearTimeout(state.soundTimeout);
    state.soundTimeout = setTimeout(playStartSound, 0);
    state.isWorking = true;
    state.currentTime = state.workTime;
    showNotification('¡A entrenar!', `Ronda ${state.currentRound} de ${state.totalRounds}`);
    updateDisplay();
    state.lastTimestamp = performance.now();
    startWorkoutLoop();
  }

  function finishWorkout() {
    cancelAnimationFrame(state.animationFrameId);
    clearTimeout(state.soundTimeout);
    
    elements.time.textContent = '00:00';
    elements.phase.textContent = '✅ FINALIZADO';
    elements.round.textContent = `Completado ${state.totalRounds} rondas`;
    document.getElementById('progress-bar').style.width = '100%';
    
    playEndSound();
    showNotification('¡Entrenamiento completado!', 'Buen trabajo');

    // Restaurar interfaz después de 2 segundos
    setTimeout(() => {
      elements.overlay.classList.remove('visible');
      elements.configContainer.style.opacity = '1';
      elements.configContainer.style.pointerEvents = 'auto';
    }, 2000);
  }

  function togglePause() {
    state.isPaused = !state.isPaused;
    elements.pauseBtn.textContent = state.isPaused ? '▶ Reanudar' : '⏸ Pausa';
    
    if (!state.isPaused) {
      state.lastTimestamp = performance.now();
      startWorkoutLoop();
    } else {
      clearTimeout(state.soundTimeout);
    }
  }

  function resetTimer() {
    // Limpiar todos los intervalos y timeouts
    cancelAnimationFrame(state.animationFrameId);
    clearTimeout(state.soundTimeout);
    clearInterval(state.countdownInterval);
    
    // Restablecer la interfaz
    elements.timerDisplay.classList.add('hidden');
    elements.countdownDisplay.classList.add('hidden');
    elements.overlay.classList.remove('visible');
    elements.configContainer.style.opacity = '1';
    elements.configContainer.style.pointerEvents = 'auto';
    document.getElementById('progress-bar').style.width = '0%';
    
    // Restablecer estado
    state.isPaused = false;
  }

  function updateDisplay() {
    const time = Math.max(0, state.currentTime);
    elements.time.textContent = formatTime(time);
    elements.phase.textContent = state.isWorking ? '🏃 EJERCICIO' : '🛌 DESCANSO';
    elements.round.textContent = `Ronda ${state.currentRound}/${state.totalRounds}`;
    
    const progressPercent = state.isWorking 
      ? (1 - time / state.workTime) * 100 
      : (1 - time / state.restTime) * 100;
    
    document.getElementById('progress-bar').style.width = `${progressPercent}%`;
  }

  // Funciones auxiliares
  function toSeconds(value, unit) {
    return unit === 'minutes' ? value * 60 : value;
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  function getFormConfig() {
    return {
      workTime: parseFloat(document.getElementById('workTime').value) || 30,
      workUnit: document.getElementById('workTimeUnit').value,
      restTime: parseFloat(document.getElementById('restTime').value) || 10,
      restUnit: document.getElementById('restTimeUnit').value,
      rounds: parseInt(document.getElementById('rounds').value) || 8,
      mode: elements.modeSelect.value
    };
  }

  function saveConfig() {
    const config = getFormConfig();
    localStorage.setItem('gymTimerConfig', JSON.stringify(config));
  }

  function loadSavedConfig() {
    const saved = localStorage.getItem('gymTimerConfig');
    if (saved) {
      const config = JSON.parse(saved);
      document.getElementById('workTime').value = config.workTime;
      document.getElementById('workTimeUnit').value = config.workUnit;
      document.getElementById('restTime').value = config.restTime;
      document.getElementById('restTimeUnit').value = config.restUnit;
      document.getElementById('rounds').value = config.rounds;
      elements.modeSelect.value = config.mode;
      updateFormFields();
    }
  }

  function updateFormFields() {
    const mode = elements.modeSelect.value;
    const customConfig = document.getElementById('custom-config');
    
    if (mode === 'tabata') {
      customConfig.style.opacity = '0.5';
      customConfig.style.pointerEvents = 'none';
    } else {
      customConfig.style.opacity = '1';
      customConfig.style.pointerEvents = 'auto';
      
      if (mode === 'emom') {
        document.getElementById('workTime').value = 1;
        document.getElementById('workTimeUnit').value = 'minutes';
        document.getElementById('restTime').value = 0;
      } else if (mode === 'amrap') {
        document.getElementById('restTime').value = 0;
        document.getElementById('rounds').value = 1;
      }
    }
  }

  function showNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  }

  // Funciones de sonido
  function playBeepSound() { createSound(440, 0.1); }
  function playStartSound() { createSound(880, 0.3); }
  function playRestSound() { createSound(587.33, 0.3); }

  function playEndSound() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = 784;
    oscillator.frequency.exponentialRampToValueAtTime(261.63, audioCtx.currentTime + 1);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 1);
  }

  function createSound(frequency, duration) {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.error('Error de audio:', e);
    }
  }
});