// Almacenamiento de registros
let registros = [];

// Cargar registros del localStorage al iniciar
window.addEventListener('DOMContentLoaded', () => {
    cargarRegistros();
    actualizarTotal();
    
    // Formatear fecha automáticamente
    document.getElementById('fecha').addEventListener('input', formatearFecha);
    
    // Actualizar total en tiempo real
    document.getElementById('ingreso').addEventListener('input', actualizarTotal);
    document.getElementById('salida').addEventListener('input', actualizarTotal);
});

// Función para mostrar diferentes vistas
function mostrarVista(vista) {
    document.getElementById('inicio').classList.add('hidden');
    document.getElementById('ingresar').classList.add('hidden');
    document.getElementById('ver').classList.add('hidden');
    
    document.getElementById(vista).classList.remove('hidden');
    
    if (vista === 'ver') {
        mostrarRegistros();
    }
}

// Formatear fecha automáticamente (DD/MM/AAAA)
function formatearFecha(e) {
    let valor = e.target.value.replace(/\D/g, '');
    
    if (valor.length >= 2) {
        valor = valor.substring(0, 2) + '/' + valor.substring(2);
    }
    if (valor.length >= 5) {
        valor = valor.substring(0, 5) + '/' + valor.substring(5, 9);
    }
    
    e.target.value = valor;
}

// Actualizar total en tiempo real
function actualizarTotal() {
    const ingreso = parseFloat(document.getElementById('ingreso').value) || 0;
    const salida = parseFloat(document.getElementById('salida').value) || 0;
    const total = ingreso - salida;
    
    document.getElementById('totalActual').textContent = `$${total.toFixed(2)}`;
}

// Agregar nuevo registro
function agregarRegistro(e) {
    e.preventDefault();
    
    const fecha = document.getElementById('fecha').value;
    const ingreso = parseFloat(document.getElementById('ingreso').value) || 0;
    const detalleIngreso = document.getElementById('detalleIngreso').value;
    const salida = parseFloat(document.getElementById('salida').value) || 0;
    const detalleSalida = document.getElementById('detalleSalida').value;
    const total = ingreso - salida;
    
    const nuevoRegistro = {
        id: Date.now(),
        fecha,
        ingreso,
        detalleIngreso,
        salida,
        detalleSalida,
        total
    };
    
    registros.push(nuevoRegistro);
    guardarRegistros();
    
    // Limpiar formulario
    document.getElementById('formulario').reset();
    document.getElementById('ingreso').value = '0';
    document.getElementById('salida').value = '0';
    actualizarTotal();
    
    alert('Registro añadido correctamente');
}

// Guardar registros en localStorage
function guardarRegistros() {
    localStorage.setItem('registrosFinancieros', JSON.stringify(registros));
}

// Cargar registros desde localStorage
function cargarRegistros() {
    const datosGuardados = localStorage.getItem('registrosFinancieros');
    if (datosGuardados) {
        registros = JSON.parse(datosGuardados);
    }
}

// Mostrar todos los registros
function mostrarRegistros() {
    const listaRegistros = document.getElementById('listaRegistros');
    const mensajeVacio = document.getElementById('mensajeVacio');
    
    if (registros.length === 0) {
        listaRegistros.innerHTML = '';
        mensajeVacio.classList.remove('hidden');
        return;
    }
    
    mensajeVacio.classList.add('hidden');
    
    listaRegistros.innerHTML = registros.map(registro => `
        <div class="registro-item" id="registro-${registro.id}">
            <div class="registro-header">
                <span class="registro-fecha">${registro.fecha}</span>
                <div class="registro-acciones">
                    <button class="btn-small btn-edit" onclick="editarRegistro(${registro.id})">Editar</button>
                </div>
            </div>
            
            <div class="registro-detalles">
                <div class="detalle-item">
                    <div class="detalle-label">Ingreso</div>
                    <div class="detalle-valor detalle-monto ingreso">$${registro.ingreso.toFixed(2)}</div>
                    <div class="detalle-valor">${registro.detalleIngreso || '-'}</div>
                </div>
                
                <div class="detalle-item">
                    <div class="detalle-label">Salida</div>
                    <div class="detalle-valor detalle-monto salida">$${registro.salida.toFixed(2)}</div>
                    <div class="detalle-valor">${registro.detalleSalida || '-'}</div>
                </div>
            </div>
            
            <div class="registro-total">
                <span class="registro-total-label">Total:</span>
                <span class="registro-total-valor">$${registro.total.toFixed(2)}</span>
            </div>
        </div>
    `).join('');
}

// Editar registro
function editarRegistro(id) {
    const registro = registros.find(r => r.id === id);
    if (!registro) return;
    
    const elemento = document.getElementById(`registro-${id}`);
    elemento.classList.add('editando');
    
    elemento.innerHTML = `
        <div class="registro-header">
            <input type="text" id="edit-fecha-${id}" value="${registro.fecha}" maxlength="10" style="padding: 8px; border: 2px solid #ff6b35; border-radius: 6px; font-weight: 700; color: #ff6b35;">
            <div class="registro-acciones">
                <button class="btn-small btn-save" onclick="guardarEdicion(${id})">Guardar</button>
                <button class="btn-small btn-cancel" onclick="mostrarRegistros()">Cancelar</button>
            </div>
        </div>
        
        <div class="registro-detalles">
            <div class="detalle-item">
                <div class="detalle-label">Ingreso</div>
                <input type="number" id="edit-ingreso-${id}" value="${registro.ingreso}" step="0.01" style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px; margin: 5px 0;">
                <input type="text" id="edit-detalleIngreso-${id}" value="${registro.detalleIngreso}" placeholder="Detalle" style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px;">
            </div>
            
            <div class="detalle-item">
                <div class="detalle-label">Salida</div>
                <input type="number" id="edit-salida-${id}" value="${registro.salida}" step="0.01" style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px; margin: 5px 0;">
                <input type="text" id="edit-detalleSalida-${id}" value="${registro.detalleSalida}" placeholder="Detalle" style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px;">
            </div>
        </div>
    `;
}

// Guardar edición de registro
function guardarEdicion(id) {
    const registro = registros.find(r => r.id === id);
    if (!registro) return;
    
    registro.fecha = document.getElementById(`edit-fecha-${id}`).value;
    registro.ingreso = parseFloat(document.getElementById(`edit-ingreso-${id}`).value) || 0;
    registro.detalleIngreso = document.getElementById(`edit-detalleIngreso-${id}`).value;
    registro.salida = parseFloat(document.getElementById(`edit-salida-${id}`).value) || 0;
    registro.detalleSalida = document.getElementById(`edit-detalleSalida-${id}`).value;
    registro.total = registro.ingreso - registro.salida;
    
    guardarRegistros();
    mostrarRegistros();
    
    alert('Cambios guardados correctamente');
}