// ===== DETECCIÓN DE COMPATIBILIDAD ===== //
function supportsFileAPI() {
  return window.Blob && window.FileReader;
}

// ===== EXPORTACIÓN ===== //
function exportRoutines() {
  var data = {
    savedRoutines: localStorage.getItem('savedGymRoutines') || '[]',
    currentRoutine: localStorage.getItem('gymRoutine') || '[]',
    meta: { version: "1.0", device: "GymTimerTV" }
  };

  if (supportsFileAPI()) {
    // Método moderno (descarga archivo)
    try {
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'rutinas-gimnasio_' + new Date().toLocaleDateString('es-AR') + '.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (e) {
      fallbackExport(data); // Si falla, usa método simple
    }
  } else {
    fallbackExport(data);
  }
}

function fallbackExport(data) {
  prompt('Copia este texto para exportar (péguelo en un archivo .json):', JSON.stringify(data, null, 2));
}

// ===== IMPORTACIÓN ===== //
function importRoutines() {
  if (supportsFileAPI()) {
    // Método moderno (input de archivo)
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
      var file = e.target.files[0];
      if (!file) return;
      
      var reader = new FileReader();
      reader.onload = function(event) {
        processImportData(event.target.result);
      };
      reader.readAsText(file);
    };
    
    input.click();
  } else {
    // Método alternativo (textarea en el modal)
    var importHTML = `
      <div style="background: #333; padding: 15px; margin-top: 20px; border-radius: 5px;">
        <h3 style="color: #fff; margin-top: 0;">Importar desde archivo</h3>
        <textarea id="import-json-data" placeholder="Pega aquí el contenido del archivo .json" 
          style="width: 100%; height: 150px; background: #222; color: #fff; border: 1px solid #555;"></textarea>
        <button onclick="processImportData(document.getElementById('import-json-data').value)" 
          style="background: #4CAF50; color: #fff; border: none; padding: 10px; margin-top: 10px; width: 100%;">
          Cargar Datos
        </button>
      </div>
    `;
    
    document.querySelector('#routine-modal > div').insertAdjacentHTML('beforeend', importHTML);
  }
}

function processImportData(jsonStr) {
  try {
    var data = JSON.parse(jsonStr);
    if (confirm('¿Reemplazar TODAS las rutinas actuales?\nEsta acción no se puede deshacer.')) {
      localStorage.setItem('savedGymRoutines', data.savedRoutines);
      localStorage.setItem('gymRoutine', data.currentRoutine);
      alert('¡Datos importados! Recarga la página para ver los cambios.');
    }
  } catch (e) {
    alert('Error: El archivo no es válido.\nAsegúrate de exportar primero desde esta app.');
    console.error("Error al importar:", e);
  }
}

// ===== INTEGRACIÓN ===== //
document.addEventListener('DOMContentLoaded', function() {
  // Añadir botones al modal
  var modal = document.querySelector('#routine-modal > div');
  if (modal && !document.getElementById('export-legacy-btn')) {
    modal.insertAdjacentHTML('beforeend', `
      <div style="margin-top: 20px; border-top: 1px solid #555; padding-top: 15px;">
        <button id="export-legacy-btn" style="background: #FF9800; color: #fff; border: none; padding: 10px; margin: 5px 0; width: 100%;">
          Exportar a Archivo
        </button>
        <button id="import-legacy-btn" style="background: #9C27B0; color: #fff; border: none; padding: 10px; margin: 5px 0; width: 100%;">
          Importar desde Archivo
        </button>
      </div>
    `);
    
    document.getElementById('export-legacy-btn').onclick = exportRoutines;
    document.getElementById('import-legacy-btn').onclick = importRoutines;
  }
});