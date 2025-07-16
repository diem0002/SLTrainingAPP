document.addEventListener('DOMContentLoaded', () => {
  // Elementos del DOM
  const form = document.getElementById('config-form');
  const phaseDisplay = document.getElementById('phase');
  const timeDisplay = document.getElementById('time');
  const roundDisplay = document.getElementById('round');
  const timerDisplay = document.getElementById('timer-display');
  const countdownDisplay = document.getElementById('countdown-display');
  const countdownText = document.getElementById('countdown-text');
  const countdownElement = document.getElementById('countdown');
  const startBtn = document.getElementById('start-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const resetBtn = document.getElementById('reset-btn');
  const customConfig = document.getElementById('custom-config');
  const modeSelect = document.getElementById('mode');

  // Variables de estado
  let animationFrameId;
  let isWorking = true;
  let currentRound = 1;
  let workTime, restTime, totalRounds, currentTime;
  let isPaused = false;
  let lastTimestamp = 0;
  let accumulatedTime = 0;
  let soundTimeout;
  let countdownInterval;

  // Convertir a segundos según unidad
  const toSeconds = (value, unit) => unit === 'minutes' ? value * 60 : value;

  // Event Listeners
  form.addEventListener('submit', startTimer);
  pauseBtn.addEventListener('click', togglePause);
  resetBtn.addEventListener('click', resetTimer);
  modeSelect.addEventListener('change', updateFormFields);

  // Cargar configuración guardada
  loadSavedConfig();

  // Funciones
  function startTimer(e) {
    e.preventDefault();
    resetTimer();
    
    // Mostrar countdown
    startCountdown();
  }

  function startCountdown() {
    let count = 3;
    countdownDisplay.style.display = 'block';
    countdownElement.textContent = count;
    countdownText.textContent = 'Preparado';
    form.style.opacity = '0.5';
    form.style.pointerEvents = 'none';

    playBeepSound();
    
    countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        countdownElement.textContent = count;
        playBeepSound();
      } else {
        clearInterval(countdownInterval);
        countdownElement.textContent = '¡YA!';
        playStartSound();
        
        setTimeout(() => {
          countdownDisplay.style.display = 'none';
          initializeWorkout();
        }, 500);
      }
    }, 1000);
  }

  function initializeWorkout() {
    const mode = modeSelect.value;
    const workTimeValue = parseFloat(document.getElementById('workTime').value) || 30;
    const restTimeValue = parseFloat(document.getElementById('restTime').value) || 10;
    const workUnit = document.getElementById('workTimeUnit').value;
    const restUnit = document.getElementById('restTimeUnit').value;
    const roundsInput = parseInt(document.getElementById('rounds').value) || 8;

    // Configurar según el modo
    if (mode === 'tabata') {
      workTime = 20; // 20 segundos
      restTime = 10; // 10 segundos
      totalRounds = 8;
    } else if (mode === 'amrap') {
      workTime = toSeconds(workTimeValue, workUnit);
      restTime = 0;
      totalRounds = 1;
    } else if (mode === 'emom') {
      workTime = 60; // 1 minuto fijo
      restTime = 0;
      totalRounds = roundsInput;
    } else { // HIIT personalizado
      workTime = toSeconds(workTimeValue, workUnit);
      restTime = toSeconds(restTimeValue, restUnit);
      totalRounds = roundsInput;
    }

    saveConfig();

    // Iniciar timer
    currentRound = 1;
    isWorking = true;
    isPaused = false;
    timerDisplay.style.display = 'block';
    startBtn.textContent = 'Reiniciar';
    currentTime = workTime;
    
    updateDisplay();
    lastTimestamp = performance.now();
    startWorkout();
  }

  function startWorkout(timestamp) {
    if (!timestamp) timestamp = performance.now();
    
    if (isPaused) {
      lastTimestamp = timestamp;
      animationFrameId = requestAnimationFrame(startWorkout);
      return;
    }

    const elapsed = timestamp - lastTimestamp;
    accumulatedTime += elapsed;
    lastTimestamp = timestamp;

    if (accumulatedTime >= 1000) {
      const secondsPassed = Math.floor(accumulatedTime / 1000);
      currentTime -= secondsPassed;
      accumulatedTime = accumulatedTime % 1000;

      // Beep en los últimos 3 segundos
      if (currentTime <= 3 && currentTime > 0) {
        clearTimeout(soundTimeout);
        soundTimeout = setTimeout(() => playBeepSound(), 0);
      }

      if (currentTime <= 0) {
        if (isWorking) {
          if (restTime > 0) {
            clearTimeout(soundTimeout);
            soundTimeout = setTimeout(() => playRestSound(), 0);
            isWorking = false;
            currentTime = restTime;
            showNotification('¡Descanso!', 'Tómate un respiro');
          } else {
            nextRound();
            return;
          }
        } else {
          nextRound();
          return;
        }
      }
      updateDisplay();
    }

    if (currentTime > 0) {
      animationFrameId = requestAnimationFrame(startWorkout);
    } else {
      endWorkout();
    }
  }

  function nextRound() {
    currentRound++;
    if (currentRound > totalRounds) {
      endWorkout();
      return;
    }
    
    clearTimeout(soundTimeout);
    soundTimeout = setTimeout(() => playStartSound(), 0);
    isWorking = true;
    currentTime = workTime;
    showNotification('¡A entrenar!', `Ronda ${currentRound} de ${totalRounds}`);
    updateDisplay();
    lastTimestamp = performance.now();
    startWorkout();
  }

  function updateDisplay() {
    currentTime = Math.max(0, parseInt(currentTime) || 0);
    
    timeDisplay.textContent = formatTime(currentTime);
    phaseDisplay.textContent = isWorking ? '🏃 Ejercicio' : '🛌 Descanso';
    roundDisplay.textContent = `Ronda ${currentRound}/${totalRounds}`;
    
    const progressPercent = isWorking 
      ? (1 - currentTime / workTime) * 100 
      : (1 - currentTime / restTime) * 100;
    document.getElementById('progress-bar').style.width = `${Math.min(100, Math.max(0, progressPercent))}%`;
    document.getElementById('progress-bar').style.backgroundColor = isWorking ? '#ff3366' : '#0ff';
  }

  function endWorkout() {
    cancelAnimationFrame(animationFrameId);
    clearTimeout(soundTimeout);
    
    timeDisplay.textContent = '00:00';
    phaseDisplay.textContent = '✅ Finalizado';
    roundDisplay.textContent = `Completado ${totalRounds} rondas`;
    document.getElementById('progress-bar').style.width = '100%';
    
    soundTimeout = setTimeout(() => playEndSound(), 0);
    showNotification('¡Entrenamiento completado!', 'Buen trabajo');

    // Mostrar nuevamente el formulario
    setTimeout(() => {
      form.style.opacity = '1';
      form.style.pointerEvents = 'auto';
    }, 2000);
  }

  function togglePause() {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? '▶ Reanudar' : '⏸ Pausar';
    
    if (!isPaused) {
      lastTimestamp = performance.now();
      startWorkout();
    } else {
      clearTimeout(soundTimeout);
    }
  }

  function resetTimer() {
    cancelAnimationFrame(animationFrameId);
    clearTimeout(soundTimeout);
    clearInterval(countdownInterval);
    
    timerDisplay.style.display = 'none';
    countdownDisplay.style.display = 'none';
    startBtn.textContent = 'Iniciar Entrenamiento';
    document.getElementById('progress-bar').style.width = '0%';
    isPaused = false;
    
    // Restaurar visibilidad
    form.style.opacity = '1';
    form.style.pointerEvents = 'auto';
  }

  function updateFormFields() {
    const mode = modeSelect.value;
    if (mode === 'tabata') {
      customConfig.style.display = 'none';
    } else if (mode === 'amrap') {
      customConfig.style.display = 'block';
      document.getElementById('restTime').value = 0;
      document.getElementById('rounds').value = 1;
    } else if (mode === 'emom') {
      customConfig.style.display = 'block';
      document.getElementById('workTime').value = 1;
      document.getElementById('workTimeUnit').value = 'minutes';
      document.getElementById('restTime').value = 0;
    } else {
      customConfig.style.display = 'block';
    }
  }

  function formatTime(seconds) {
    seconds = Math.max(0, parseInt(seconds) || 0);
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function saveConfig() {
    const config = {
      workTime: document.getElementById('workTime').value,
      workTimeUnit: document.getElementById('workTimeUnit').value,
      restTime: document.getElementById('restTime').value,
      restTimeUnit: document.getElementById('restTimeUnit').value,
      rounds: document.getElementById('rounds').value,
      mode: modeSelect.value
    };
    localStorage.setItem('gymTimerConfig', JSON.stringify(config));
  }

  function loadSavedConfig() {
    const savedConfig = localStorage.getItem('gymTimerConfig');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      document.getElementById('workTime').value = config.workTime || 30;
      document.getElementById('workTimeUnit').value = config.workTimeUnit || 'seconds';
      document.getElementById('restTime').value = config.restTime || 10;
      document.getElementById('restTimeUnit').value = config.restTimeUnit || 'seconds';
      document.getElementById('rounds').value = config.rounds || 8;
      modeSelect.value = config.mode || 'hiit';
      updateFormFields();
    }
  }

  function showNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  }

  // Funciones de sonido
  function playStartSound() {
    createSound(880, 0.5);
  }

  function playBeepSound() {
    createSound(440, 0.1);
  }

  function playRestSound() {
    createSound(587.33, 0.3);
  }

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
    if (isPaused) return;
    
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
      console.error('Error al reproducir sonido:', e);
    }
  }

  // Solicitar permisos para notificaciones
  if ('Notification' in window) {
    Notification.requestPermission();
  }
});