var routineData = [];
var routineSystemInitialized = false;
var savedRoutinesKey = 'savedGymRoutines';

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

    <!-- Selector de rutinas guardadas -->
    <div style="margin-bottom:15px;">
      <label for="saved-routines-select" style="color:#fff;">Rutinas guardadas:</label>
      <select id="saved-routines-select" style="width:100%;padding:8px;border-radius:5px;border:none;background:#333;color:#fff;margin-top:5px;"></select>
      <div style="margin-top:5px;display:flex;gap:10px;flex-wrap:wrap;">
        <button id="load-saved-routine-btn" style="flex:1;min-width:120px;background:#005577;color:#fff;border:none;padding:8px;border-radius:5px;cursor:pointer;">Cargar Rutina</button>
        <button id="use-saved-routine-btn" style="flex:1;min-width:120px;background:#007700;color:#fff;border:none;padding:8px;border-radius:5px;cursor:pointer;">Usar Rutina</button>
        <button id="delete-saved-routine-btn" style="flex:1;min-width:120px;background:#aa0000;color:#fff;border:none;padding:8px;border-radius:5px;cursor:pointer;">Eliminar Rutina</button>
      </div>
    </div>

    <div id="blocks-container"></div>
    <button id="add-block-btn" style="background:#007700;color:#fff;border:none;padding:10px;margin-top:15px;border-radius:8px;width:100%;font-size:16px;">+ Agregar Bloque</button>
    <div style="display:flex;justify-content:space-between;margin-top:15px;gap:10px;flex-wrap:wrap;">
      <button id="save-routine-btn" style="flex:1;min-width:120px;background:#007700;color:#fff;border:none;padding:10px;border-radius:8px;font-size:16px;">Guardar</button>
      <button id="use-temp-routine-btn" style="flex:1;min-width:120px;background:#557700;color:#fff;border:none;padding:10px;border-radius:8px;font-size:16px;">Usar Temporalmente</button>
      <button id="cancel-routine-btn" style="flex:1;min-width:120px;background:#770000;color:#fff;border:none;padding:10px;border-radius:8px;font-size:16px;">Cancelar</button>
    </div>
  </div>
</div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Asignar eventos
  document.getElementById('add-block-btn').addEventListener('click', addBlock);
  document.getElementById('save-routine-btn').addEventListener('click', saveRoutine);
  document.getElementById('cancel-routine-btn').addEventListener('click', hideRoutineModal);
  document.getElementById('load-saved-routine-btn').addEventListener('click', loadSelectedSavedRoutine);
  document.getElementById('use-saved-routine-btn').addEventListener('click', useSelectedSavedRoutine);
  document.getElementById('delete-saved-routine-btn').addEventListener('click', deleteSelectedSavedRoutine);
  document.getElementById('use-temp-routine-btn').addEventListener('click', useTemporaryRoutine);

  // Delegación para eliminar ejercicios
  document.getElementById('blocks-container').addEventListener('click', function(event) {
    if (event.target.classList.contains('remove-exercise')) {
      event.target.closest('div').remove();
    }
  });

  routineSystemInitialized = true;
  loadSavedRoutinesList();
  loadSavedRoutine();
};

// Mostrar modal de rutinas
window.showRoutineModal = function() {
  if (!routineSystemInitialized) return;

  document.getElementById('routine-modal').style.display = 'flex';

  if (document.getElementById('blocks-container').children.length === 0) {
    addBlock();
  }
};

// Ocultar modal
function hideRoutineModal() {
  document.getElementById('routine-modal').style.display = 'none';
}

// Usar rutina guardada seleccionada
function useSelectedSavedRoutine() {
  var select = document.getElementById('saved-routines-select');
  if (!select || !select.value) {
    alert('Seleccione una rutina guardada para usar.');
    return;
  }

  var saved = localStorage.getItem(savedRoutinesKey);
  var savedRoutines = [];

  try {
    savedRoutines = saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Error al parsear rutinas guardadas:', e);
    savedRoutines = [];
  }

  var idx = parseInt(select.value);
  if (isNaN(idx) || idx < 0 || idx >= savedRoutines.length) {
    alert('Rutina inválida seleccionada.');
    return;
  }

  routineData = savedRoutines[idx].data || [];
  
  try {
    localStorage.setItem('gymRoutine', JSON.stringify(routineData));
    displayRoutine();
    hideRoutineModal();
  } catch (e) {
    alert('Error al guardar la rutina activa.');
    console.error('Error:', e);
  }
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

  if (routineData.length === 0) {
    alert('La rutina no puede estar vacía.');
    return;
  }

  var routineName = prompt('Ingrese un nombre para esta rutina:', 'Mi Rutina');

  if (!routineName || routineName.trim() === '') {
    alert('El nombre es obligatorio para guardar la rutina.');
    return;
  }

  try {
    localStorage.setItem('gymRoutine', JSON.stringify(routineData));
  } catch (e) {
    alert('No se pudo guardar la rutina activa.');
    console.error('Error al guardar rutina activa:', e);
  }

  saveRoutineToSavedList(routineName.trim(), routineData);

  displayRoutine();
  loadSavedRoutinesList();
  hideRoutineModal();
}

// Mostrar rutinas guardadas en el select
function loadSavedRoutinesList() {
  var select = document.getElementById('saved-routines-select');
  if (!select) return;

  var saved = localStorage.getItem(savedRoutinesKey);
  var savedRoutines = [];

  try {
    savedRoutines = saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Error al parsear rutinas guardadas:', e);
    savedRoutines = [];
  }

  select.innerHTML = '';

  if (savedRoutines.length === 0) {
    var option = document.createElement('option');
    option.text = 'No hay rutinas guardadas';
    option.value = '';
    select.add(option);
    return;
  }

  savedRoutines.forEach(function(routine, i) {
    var option = document.createElement('option');
    option.text = routine.name;
    option.value = i;
    select.add(option);
  });
}

// Guardar rutina en lista guardada
function saveRoutineToSavedList(name, routine) {
  var saved = localStorage.getItem(savedRoutinesKey);
  var savedRoutines = [];

  try {
    savedRoutines = saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Error al parsear rutinas guardadas:', e);
    savedRoutines = [];
  }

  var existingIndex = savedRoutines.findIndex(r => r.name === name);
  if (existingIndex >= 0) {
    savedRoutines[existingIndex].data = routine;
  } else {
    savedRoutines.push({ name: name, data: routine });
  }

  try {
    localStorage.setItem(savedRoutinesKey, JSON.stringify(savedRoutines));
  } catch (e) {
    alert('No se pudo guardar la lista de rutinas guardadas.');
    console.error('Error al guardar lista:', e);
  }
}

// Cargar rutina guardada seleccionada en editor
function loadSelectedSavedRoutine() {
  var select = document.getElementById('saved-routines-select');
  if (!select || !select.value) {
    alert('Seleccione una rutina guardada para cargar.');
    return;
  }

  var saved = localStorage.getItem(savedRoutinesKey);
  var savedRoutines = [];

  try {
    savedRoutines = saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Error al parsear rutinas guardadas:', e);
    savedRoutines = [];
  }

  var idx = parseInt(select.value);
  if (isNaN(idx) || idx < 0 || idx >= savedRoutines.length) {
    alert('Rutina inválida seleccionada.');
    return;
  }

  routineData = savedRoutines[idx].data || [];

  var container = document.getElementById('blocks-container');
  container.innerHTML = '';

  routineData.forEach(function(block) {
    addBlockFromData(block);
  });
}

// Eliminar rutina guardada seleccionada
function deleteSelectedSavedRoutine() {
  var select = document.getElementById('saved-routines-select');
  if (!select || !select.value) {
    alert('Seleccione una rutina guardada para eliminar.');
    return;
  }

  if (!confirm('¿Seguro que desea eliminar esta rutina guardada?')) return;

  var saved = localStorage.getItem(savedRoutinesKey);
  var savedRoutines = [];

  try {
    savedRoutines = saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Error al parsear rutinas guardadas:', e);
    savedRoutines = [];
  }

  var idx = parseInt(select.value);
  if (isNaN(idx) || idx < 0 || idx >= savedRoutines.length) {
    alert('Rutina inválida seleccionada.');
    return;
  }

  savedRoutines.splice(idx, 1);

  try {
    localStorage.setItem(savedRoutinesKey, JSON.stringify(savedRoutines));
  } catch (e) {
    alert('No se pudo actualizar la lista de rutinas guardadas.');
    console.error('Error al guardar lista:', e);
  }

  loadSavedRoutinesList();
  document.getElementById('blocks-container').innerHTML = '';
  addBlock();
}

// Cargar rutina guardada en editor al iniciar página
function loadSavedRoutine() {
  try {
    var saved = localStorage.getItem('gymRoutine');
    if (saved) {
      routineData = JSON.parse(saved);
      displayRoutine();
    }
  } catch (e) {
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

  document.querySelectorAll('.delete-routine-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      if (confirm('¿Eliminar este bloque?')) {
        routineData.splice(parseInt(this.dataset.index), 1);
        try {
          localStorage.setItem('gymRoutine', JSON.stringify(routineData));
          displayRoutine();
        } catch (e) {
          alert('Error al eliminar bloque.');
          console.error('Error:', e);
        }
      }
    });
  });
}

// Crear bloque en editor a partir de datos
function addBlockFromData(block) {
  var blockHTML = `
    <div class="block" style="background:#333;padding:15px;margin-bottom:15px;border-radius:8px;">
      <div style="display:flex;margin-bottom:10px;align-items:center;">
        <input type="text" class="block-title" placeholder="Nombre del bloque" style="flex-grow:1;padding:8px;border-radius:5px;border:1px solid #555;background:#222;color:#fff;" value="${escapeHTML(block.title)}">
        <button class="remove-block" style="background:#ff0000;color:#fff;border:none;border-radius:50%;width:25px;height:25px;margin-left:10px;cursor:pointer;">×</button>
      </div>
      <div class="exercises-list" style="margin-bottom:10px;">
        ${block.exercises.map(ex => `
          <div style="display:flex;margin-bottom:8px;">
            <input type="text" placeholder="Ejercicio" style="flex-grow:1;padding:6px;border-radius:4px;border:1px solid #555;background:#222;color:#fff;margin-right:8px;" value="${escapeHTML(ex)}">
            <button class="remove-exercise" style="background:#555;color:#fff;border:none;border-radius:4px;padding:0 8px;cursor:pointer;">×</button>
          </div>
        `).join('')}
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

// Función para escapar texto HTML
function escapeHTML(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Limpiar todas las rutinas
function clearAllRoutines() {
  if (confirm('¿Estás seguro que deseas eliminar TODAS las rutinas?')) {
    routineData = [];
    try {
      localStorage.removeItem('gymRoutine');
      localStorage.removeItem(savedRoutinesKey);
      document.getElementById('routine-display').innerHTML = '';
      document.getElementById('blocks-container').innerHTML = '';
      loadSavedRoutinesList();
      addBlock();
    } catch (e) {
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
    loadSavedRoutine();
  } else {
    routineDisplay.style.display = 'none';
    document.getElementById('toggle-routine-btn').textContent = 'Mostrar Rutinas';
  }
}

// Función para usar rutina temporal
function useTemporaryRoutine() {
  var blocks = document.querySelectorAll('.block');
  var tempRoutineData = [];

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
      tempRoutineData.push({
        title: title,
        exercises: exercises
      });
    }
  });

  if (tempRoutineData.length === 0) {
    alert('La rutina no puede estar vacía.');
    return;
  }

  routineData = tempRoutineData;
  displayRoutine();
  hideRoutineModal();
  alert("⚠️ Rutina temporal en uso - No se guardará automáticamente");
}


// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  initRoutineSystem();
  document.getElementById('create-routine-btn').addEventListener('click', showRoutineModal);
  document.getElementById('toggle-routine-btn').addEventListener('click', toggleRoutineDisplay);
  loadSavedRoutine();
});