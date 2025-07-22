var routineData = [];
var routineSystemInitialized = false;

// Función de inicialización
window.initRoutineSystem = function() {
  if (routineSystemInitialized) return;
  
  // Cargar CSS
  if (!document.getElementById('routine-css')) {
    var css = document.createElement('link');
    css.id = 'routine-css';
    css.rel = 'stylesheet';
    css.href = 'css/routine.css';
    document.head.appendChild(css);
  }
  
  // Crear estructura modal
  var modalHTML = `
    <div id="routine-modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:1000;justify-content:center;align-items:center;">
      <div style="background:#222;padding:20px;border-radius:10px;width:90%;max-width:600px;max-height:90vh;overflow:auto;">
        <h2 style="color:#fff;text-align:center;margin-top:0;">Editor de Rutinas</h2>
        <div id="blocks-container"></div>
        <button id="add-block-btn" style="background:#007700;color:#fff;border:none;padding:10px;margin-top:15px;border-radius:8px;width:100%;font-size:16px;">+ Agregar Bloque</button>
        <div style="display:flex;justify-content:space-between;margin-top:15px;gap:10px;">
          <button id="save-routine-btn" style="background:#007700;color:#fff;border:none;padding:10px;border-radius:8px;flex:1;font-size:16px;">Guardar</button>
          <button id="cancel-routine-btn" style="background:#770000;color:#fff;border:none;padding:10px;border-radius:8px;flex:1;font-size:16px;">Cancelar</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Asignar eventos
  document.getElementById('add-block-btn').addEventListener('click', addBlock);
  document.getElementById('save-routine-btn').addEventListener('click', saveRoutine);
  document.getElementById('cancel-routine-btn').addEventListener('click', hideRoutineModal);
  
  // Cargar rutina guardada
  loadSavedRoutine();
  
  routineSystemInitialized = true;
};

// Mostrar modal de rutinas
window.showRoutineModal = function() {
  if (!routineSystemInitialized) return;
  
  document.getElementById('routine-modal').style.display = 'flex';
  
  // Agregar botón de limpiar si hay rutinas
  const saveBtnContainer = document.getElementById('save-routine-btn').parentNode;
  if (routineData.length > 0 && !document.getElementById('clear-routine-btn')) {
    const clearBtn = document.createElement('button');
    clearBtn.id = 'clear-routine-btn';
    clearBtn.textContent = 'Limpiar Todas las Rutinas';
    clearBtn.style.backgroundColor = '#aa0000';
    clearBtn.style.color = 'white';
    clearBtn.style.border = 'none';
    clearBtn.style.padding = '10px';
    clearBtn.style.borderRadius = '5px';
    clearBtn.style.marginTop = '10px';
    clearBtn.style.width = '100%';
    clearBtn.addEventListener('click', clearAllRoutines);
    
    saveBtnContainer.insertBefore(clearBtn, document.getElementById('save-routine-btn').nextSibling);
  }
  
  if (document.getElementById('blocks-container').children.length === 0) {
    addBlock();
  }
};

// Ocultar modal
function hideRoutineModal() {
  document.getElementById('routine-modal').style.display = 'none';
}

// Agregar un nuevo bloque de ejercicios
function addBlock() {
  var blockHTML = `
    <div class="block" style="background:#333;padding:15px;margin-bottom:15px;border-radius:8px;">
      <div style="display:flex;margin-bottom:10px;align-items:center;">
        <input type="text" class="block-title" placeholder="Nombre del bloque" style="flex-grow:1;padding:8px;border-radius:5px;border:1px solid #555;background:#222;color:#fff;">
        <button class="remove-block" style="background:#ff0000;color:#fff;border:none;border-radius:50%;width:25px;height:25px;margin-left:10px;cursor:pointer;">×</button>
      </div>
      <div class="exercises-list" style="margin-bottom:10px;">
        ${generateExerciseInput()}
        ${generateExerciseInput()}
        ${generateExerciseInput()}
      </div>
      <button class="add-exercise" style="background:#005577;color:#fff;border:none;padding:8px;border-radius:5px;width:100%;cursor:pointer;">+ Ejercicio</button>
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

// Generar HTML para un ejercicio
function generateExerciseInput() {
  return `
    <div style="display:flex;margin-bottom:8px;">
      <input type="text" placeholder="Ejercicio" style="flex-grow:1;padding:6px;border-radius:4px;border:1px solid #555;background:#222;color:#fff;margin-right:8px;">
      <button class="remove-exercise" style="background:#555;color:#fff;border:none;border-radius:4px;padding:0 8px;cursor:pointer;">×</button>
    </div>
  `;
}

// Guardar rutina
function saveRoutine() {
  var blocks = document.querySelectorAll('.block');
  routineData = [];
  
  blocks.forEach(function(block, index) {
    var title = block.querySelector('.block-title').value || `Bloque ${index + 1}`;
    var exercises = [];
    var inputs = block.querySelectorAll('.exercises-list input');
    
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
    alert('No se pudo guardar la rutina');
    console.error('Error al guardar:', e);
  }
}

// Cargar rutina guardada
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

// Mostrar rutinas en pantalla
function displayRoutine() {
  var display = document.getElementById('routine-display');
  if (!display) return;
  
  display.innerHTML = '';
  
  if (!routineData || routineData.length === 0) {
    display.style.display = 'none';
    return;
  }
  
  display.style.display = 'flex';
  display.style.flexWrap = 'wrap';
  display.style.justifyContent = 'center';
  display.style.gap = '20px';
  display.style.padding = '20px';
  display.style.backgroundColor = 'rgba(0,0,0,0.7)';
  display.style.borderRadius = '10px';
  
  var colors = ['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3'];
  
  routineData.forEach(function(block, index) {
    var blockHTML = `
      <div class="routine-block" style="flex:1;min-width:250px;max-width:300px;background:rgba(255,255,255,0.05);padding:15px;border-radius:8px;border-left:4px solid ${colors[index % colors.length]}">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <h3 style="color:#fff;margin-top:0;border-bottom:1px solid ${colors[index % colors.length]};padding-bottom:5px;">${block.title}</h3>
          <button class="delete-routine-btn" data-index="${index}" style="background:#aa0000;color:#fff;border:none;border-radius:5px;padding:3px 8px;cursor:pointer;">×</button>
        </div>
        <ul style="color:#fff;padding-left:20px;margin-top:8px;">
          ${block.exercises.map(ex => `<li style="margin-bottom:6px;">${ex}</li>`).join('')}
        </ul>
      </div>
    `;
    display.insertAdjacentHTML('beforeend', blockHTML);
  });
  
  // Agregar eventos a los botones de eliminar
  document.querySelectorAll('.delete-routine-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      deleteRoutine(parseInt(this.dataset.index));
    });
  });
}

// Eliminar una rutina específica
function deleteRoutine(index) {
  if (confirm('¿Eliminar esta rutina?')) {
    routineData.splice(index, 1);
    try {
      localStorage.setItem('gymRoutine', JSON.stringify(routineData));
      displayRoutine();
      
      // Si no quedan rutinas, quitar el botón de limpiar
      if (routineData.length === 0) {
        const clearBtn = document.getElementById('clear-routine-btn');
        if (clearBtn) clearBtn.remove();
      }
    } catch(e) {
      alert('Error al eliminar la rutina');
      console.error('Error:', e);
    }
  }
}

// Limpiar todas las rutinas
function clearAllRoutines() {
  if (confirm('¿Estás seguro que deseas eliminar TODAS las rutinas?')) {
    routineData = [];
    try {
      localStorage.removeItem('gymRoutine');
      document.getElementById('routine-display').innerHTML = '';
      document.getElementById('blocks-container').innerHTML = '';
      
      // Eliminar el botón de limpiar
      const clearBtn = document.getElementById('clear-routine-btn');
      if (clearBtn) clearBtn.remove();
      
      // Agregar un bloque vacío para que pueda comenzar a crear nuevas
      addBlock();
    } catch(e) {
      alert('Error al limpiar las rutinas');
      console.error('Error:', e);
    }
  }
}

// Función para mostrar/ocultar rutinas
function toggleRoutineDisplay() {
  const routineDisplay = document.getElementById('routine-display');
  if (!routineDisplay) return;
  
  const displayStyle = window.getComputedStyle(routineDisplay).display;
  
  if (displayStyle === 'none' || routineDisplay.style.display === 'none') {
    routineDisplay.style.display = 'flex';
    document.getElementById('toggle-routine-btn').textContent = 'Ocultar Rutinas';
    // Forzar recarga de las rutinas
    loadSavedRoutine();
  } else {
    routineDisplay.style.display = 'none';
    document.getElementById('toggle-routine-btn').textContent = 'Mostrar Rutinas';
  }
}

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  // Inicializar sistema de rutinas
  initRoutineSystem();
  
  // Asignar eventos a los botones
  document.getElementById('create-routine-btn').addEventListener('click', showRoutineModal);
  document.getElementById('toggle-routine-btn').addEventListener('click', toggleRoutineDisplay);
  
  // Cargar y mostrar rutinas al inicio
  loadSavedRoutine();
});