var routineData = [];

function initRoutineSystem() {
  // Cargar CSS
  var css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'css/routine.css';
  document.head.appendChild(css);
  
  // Crear modal
  var modalHTML = `
    <div id="routine-modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:1000;justify-content:center;align-items:center;">
      <div style="background:#222;padding:20px;border-radius:10px;width:90%;max-width:600px;max-height:90vh;overflow:auto;">
        <h2 style="color:#fff;text-align:center;margin-top:0;">Editor de Rutinas</h2>
        <div id="blocks-container"></div>
        <button id="add-block-btn">+ Agregar Bloque</button>
        <div style="display:flex;justify-content:space-between;margin-top:15px;">
          <button id="save-routine-btn">Guardar Rutina</button>
          <button id="cancel-routine-btn">Cancelar</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Eventos
  document.getElementById('create-routine-btn').addEventListener('click', showRoutineModal);
  document.getElementById('add-block-btn').addEventListener('click', addBlock);
  document.getElementById('save-routine-btn').addEventListener('click', saveRoutine);
  document.getElementById('cancel-routine-btn').addEventListener('click', hideRoutineModal);
  
  // Cargar rutina guardada
  loadSavedRoutine();
}

function showRoutineModal() {
  document.getElementById('routine-modal').style.display = 'flex';
  if (document.getElementById('blocks-container').children.length === 0) {
    addBlock();
  }
}

function hideRoutineModal() {
  document.getElementById('routine-modal').style.display = 'none';
}

function addBlock() {
  var blockHTML = `
    <div class="block">
      <div class="block-header">
        <input type="text" class="block-title" placeholder="Nombre del bloque (ej: Bloque 1)">
        <button class="remove-block">×</button>
      </div>
      <div class="exercises-list">
        ${generateExerciseInput()}
        ${generateExerciseInput()}
        ${generateExerciseInput()}
      </div>
      <button class="add-exercise">+ Ejercicio</button>
    </div>
  `;
  
  var container = document.getElementById('blocks-container');
  container.insertAdjacentHTML('beforeend', blockHTML);
  
  var newBlock = container.lastElementChild;
  newBlock.querySelector('.remove-block').addEventListener('click', function() {
    this.closest('.block').remove();
  });
  
  newBlock.querySelector('.add-exercise').addEventListener('click', function() {
    this.previousElementSibling.insertAdjacentHTML('beforeend', generateExerciseInput());
  });
}

function generateExerciseInput() {
  return `
    <div class="exercise">
      <input type="text" placeholder="Nombre del ejercicio">
      <button class="remove-exercise">×</button>
    </div>
  `;
}

function saveRoutine() {
  var blocks = document.querySelectorAll('.block');
  routineData = [];
  
  blocks.forEach(function(block, index) {
    var title = block.querySelector('.block-title').value || `Bloque ${index + 1}`;
    var exercises = [];
    var inputs = block.querySelectorAll('.exercise input');
    
    inputs.forEach(function(input) {
      if (input.value.trim() !== '') {
        exercises.push(input.value.trim());
      }
    });
    
    if (exercises.length > 0) {
      routineData.push({
        title: title,
        exercises: exercises
      });
    }
  });
  
  try {
    localStorage.setItem('gymRoutine', JSON.stringify(routineData));
    displayRoutine();
    hideRoutineModal();
  } catch(e) {
    alert('Error al guardar la rutina');
    console.error(e);
  }
}

function loadSavedRoutine() {
  try {
    var saved = localStorage.getItem('gymRoutine');
    if (saved) {
      routineData = JSON.parse(saved);
      displayRoutine();
    }
  } catch(e) {
    console.error('Error al cargar rutina:', e);
  }
}

function displayRoutine() {
  var display = document.getElementById('routine-display');
  display.innerHTML = '';
  
  if (!routineData || routineData.length === 0) {
    display.style.display = 'none';
    return;
  }
  
  display.style.display = 'flex';
  
  var colors = ['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3'];
  
  routineData.forEach(function(block, index) {
    var blockHTML = `
      <div class="routine-block" style="border-color:${colors[index % colors.length]}">
        <h3>${block.title}</h3>
        <ul>
          ${block.exercises.map(ex => `<li>${ex}</li>`).join('')}
        </ul>
      </div>
    `;
    display.insertAdjacentHTML('beforeend', blockHTML);
  });
}

// Inicializar al cargar
initRoutineSystem();