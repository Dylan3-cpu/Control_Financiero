// Variables globales
let registros = [];
let registroEditando = null;
let filtroTipo = 'todos';

// Cargar registros al iniciar
document.addEventListener('DOMContentLoaded', function() {
    cargarRegistros();
    actualizarTotal();
    
    // Listeners para actualizar el total en tiempo real
    document.getElementById('ingreso').addEventListener('input', actualizarTotal);
    document.getElementById('salida').addEventListener('input', actualizarTotal);
});

// Función para mostrar pantallas
function mostrarPantalla(pantalla) {
    const pantallas = document.querySelectorAll('.pantalla');
    pantallas.forEach(p => p.classList.remove('activa'));
    document.getElementById(pantalla).classList.add('activa');
    
    if (pantalla === 'registros') {
        mostrarRegistros();
    }
}

// Función para actualizar el total en tiempo real
function actualizarTotal() {
    const ingreso = parseFloat(document.getElementById('ingreso').value) || 0;
    const salida = parseFloat(document.getElementById('salida').value) || 0;
    const total = ingreso - salida;
    
    document.getElementById('totalDisplay').textContent = '$' + total.toFixed(2);
}

// Función para validar fecha en formato DD/MM/AAAA
function validarFecha(fecha) {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(fecha)) {
        return false;
    }
    
    const partes = fecha.split('/');
    const dia = parseInt(partes[0]);
    const mes = parseInt(partes[1]);
    const anio = parseInt(partes[2]);
    
    if (dia < 1 || dia > 31 || mes < 1 || mes > 12 || anio < 1900 || anio > 2100) {
        return false;
    }
    
    return true;
}

// Función para mostrar mensaje de error
function mostrarError(mensaje) {
    const mensajeError = document.getElementById('mensaje-error');
    mensajeError.textContent = mensaje;
    mensajeError.classList.remove('oculto');
    
    setTimeout(() => {
        mensajeError.classList.add('oculto');
    }, 3000);
}

// Función para agregar registro
function agregarRegistro(event) {
    event.preventDefault();
    
    const fecha = document.getElementById('fecha').value.trim();
    const ingreso = document.getElementById('ingreso').value.trim();
    const detalleIngreso = document.getElementById('detalleIngreso').value.trim();
    const salida = document.getElementById('salida').value.trim();
    const detalleSalida = document.getElementById('detalleSalida').value.trim();
    
    // Validar que todos los campos estén llenos
    if (!fecha || !ingreso || !detalleIngreso || !salida || !detalleSalida) {
        mostrarError('Por favor, completa todos los campos antes de guardar');
        return;
    }
    
    // Validar formato de fecha
    if (!validarFecha(fecha)) {
        mostrarError('Por favor, ingresa una fecha válida en formato DD/MM/AAAA');
        return;
    }
    
    // Validar que los valores numéricos sean válidos
    if (parseFloat(ingreso) < 0 || parseFloat(salida) < 0) {
        mostrarError('Los valores de ingreso y salida deben ser positivos');
        return;
    }
    
    const ingresoNum = parseFloat(ingreso);
    const salidaNum = parseFloat(salida);
    const total = ingresoNum - salidaNum;
    
    const registro = {
        id: Date.now(),
        fecha: fecha,
        ingreso: ingresoNum,
        detalleIngreso: detalleIngreso,
        salida: salidaNum,
        detalleSalida: detalleSalida,
        total: total
    };
    
    registros.push(registro);
    guardarRegistros();
    
    // Limpiar formulario
    document.getElementById('formulario').reset();
    actualizarTotal();
    
    // Mostrar mensaje de éxito (opcional)
    alert('Registro guardado exitosamente');
}

// Función para guardar registros en localStorage
function guardarRegistros() {
    localStorage.setItem('registros', JSON.stringify(registros));
}

// Función para cargar registros desde localStorage
function cargarRegistros() {
    const registrosGuardados = localStorage.getItem('registros');
    if (registrosGuardados) {
        registros = JSON.parse(registrosGuardados);
    }
}

// Función para mostrar registros
function mostrarRegistros() {
    aplicarFiltros();
}

// Función para aplicar filtros
function aplicarFiltros() {
    const busqueda = document.getElementById('busqueda').value.toLowerCase();
    const filtroDia = document.getElementById('filtroDia').value;
    const filtroMes = document.getElementById('filtroMes').value;
    const filtroAnio = document.getElementById('filtroAnio').value;
    
    let registrosFiltrados = [...registros];
    
    // Filtrar por búsqueda de texto
    if (busqueda) {
        registrosFiltrados = registrosFiltrados.filter(r => 
            r.detalleIngreso.toLowerCase().includes(busqueda) ||
            r.detalleSalida.toLowerCase().includes(busqueda)
        );
    }
    
    // Filtrar por fecha
    if (filtroDia || filtroMes || filtroAnio) {
        registrosFiltrados = registrosFiltrados.filter(r => {
            const partes = r.fecha.split('/');
            const dia = partes[0];
            const mes = partes[1];
            const anio = partes[2];
            
            let coincide = true;
            
            if (filtroDia && dia !== filtroDia.padStart(2, '0')) {
                coincide = false;
            }
            if (filtroMes && mes !== filtroMes.padStart(2, '0')) {
                coincide = false;
            }
            if (filtroAnio && anio !== filtroAnio) {
                coincide = false;
            }
            
            return coincide;
        });
    }
    
    // Filtrar por tipo
    if (filtroTipo === 'ingresos') {
        registrosFiltrados = registrosFiltrados.filter(r => r.ingreso > 0);
    } else if (filtroTipo === 'salidas') {
        registrosFiltrados = registrosFiltrados.filter(r => r.salida > 0);
    }
    
    renderizarRegistros(registrosFiltrados);
    calcularTotales(registrosFiltrados);
}

// Función para filtrar por tipo
function filtrarPorTipo(tipo) {
    filtroTipo = tipo;
    
    // Actualizar botones activos
    document.querySelectorAll('.boton-filtro').forEach(btn => {
        btn.classList.remove('activo');
    });
    
    if (tipo === 'todos') {
        document.getElementById('btnTodos').classList.add('activo');
    } else if (tipo === 'ingresos') {
        document.getElementById('btnIngresos').classList.add('activo');
    } else if (tipo === 'salidas') {
        document.getElementById('btnSalidas').classList.add('activo');
    }
    
    aplicarFiltros();
}

// Función para limpiar filtros
function limpiarFiltros() {
    document.getElementById('busqueda').value = '';
    document.getElementById('filtroDia').value = '';
    document.getElementById('filtroMes').value = '';
    document.getElementById('filtroAnio').value = '';
    filtroTipo = 'todos';
    
    document.querySelectorAll('.boton-filtro').forEach(btn => {
        btn.classList.remove('activo');
    });
    document.getElementById('btnTodos').classList.add('activo');
    
    aplicarFiltros();
}

// Función para calcular totales
function calcularTotales(registrosFiltrados) {
    let totalIngresos = 0;
    let totalSalidas = 0;
    
    registrosFiltrados.forEach(r => {
        totalIngresos += r.ingreso;
        totalSalidas += r.salida;
    });
    
    const balance = totalIngresos - totalSalidas;
    
    document.getElementById('totalIngresos').textContent = '$' + totalIngresos.toFixed(2);
    document.getElementById('totalSalidas').textContent = '$' + totalSalidas.toFixed(2);
    document.getElementById('balanceTotal').textContent = '$' + balance.toFixed(2);
}

// Función para renderizar registros
function renderizarRegistros(registrosFiltrados) {
    const listaRegistros = document.getElementById('listaRegistros');
    const mensajeVacio = document.getElementById('mensajeVacio');
    
    if (registrosFiltrados.length === 0) {
        listaRegistros.innerHTML = '';
        mensajeVacio.classList.remove('oculto');
        return;
    }
    
    mensajeVacio.classList.add('oculto');
    
    listaRegistros.innerHTML = registrosFiltrados.map(registro => `
        <div class="registro" id="registro-${registro.id}">
            <div class="registro-header">
                <div class="registro-fecha">${registro.fecha}</div>
                <div class="registro-acciones">
                    <button class="boton-editar" onclick="editarRegistro(${registro.id})">Editar</button>
                    <button class="boton-eliminar" onclick="eliminarRegistro(${registro.id})">Eliminar</button>
                </div>
            </div>
            <div class="registro-detalles">
                <div class="detalle-item">
                    <span class="detalle-label">Ingreso</span>
                    <span class="detalle-valor ingreso">$${registro.ingreso.toFixed(2)}</span>
                </div>
                <div class="detalle-item">
                    <span class="detalle-label">Detalle Ingreso</span>
                    <span class="detalle-valor">${registro.detalleIngreso}</span>
                </div>
                <div class="detalle-item">
                    <span class="detalle-label">Salida</span>
                    <span class="detalle-valor salida">$${registro.salida.toFixed(2)}</span>
                </div>
                <div class="detalle-item">
                    <span class="detalle-label">Detalle Salida</span>
                    <span class="detalle-valor">${registro.detalleSalida}</span>
                </div>
                <div class="detalle-item">
                    <span class="detalle-label">Total</span>
                    <span class="detalle-valor total">$${registro.total.toFixed(2)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Función para editar registro
function editarRegistro(id) {
    const registro = registros.find(r => r.id === id);
    if (!registro) return;
    
    registroEditando = id;
    
    const registroElement = document.getElementById(`registro-${id}`);
    registroElement.innerHTML = `
        <div class="registro-header">
            <div class="registro-fecha">${registro.fecha}</div>
            <div class="registro-acciones">
                <button class="boton-guardar" onclick="guardarEdicion(${id})">Guardar</button>
                <button class="boton-cancelar" onclick="cancelarEdicion()">Cancelar</button>
            </div>
        </div>
        <div class="registro-detalles registro-editar">
            <div class="detalle-item">
                <span class="detalle-label">Fecha (DD/MM/AAAA)</span>
                <input type="text" id="edit-fecha-${id}" value="${registro.fecha}" maxlength="10">
            </div>
            <div class="detalle-item">
                <span class="detalle-label">Ingreso</span>
                <input type="number" id="edit-ingreso-${id}" value="${registro.ingreso}" step="0.01" min="0">
            </div>
            <div class="detalle-item">
                <span class="detalle-label">Detalle Ingreso</span>
                <input type="text" id="edit-detalleIngreso-${id}" value="${registro.detalleIngreso}">
            </div>
            <div class="detalle-item">
                <span class="detalle-label">Salida</span>
                <input type="number" id="edit-salida-${id}" value="${registro.salida}" step="0.01" min="0">
            </div>
            <div class="detalle-item">
                <span class="detalle-label">Detalle Salida</span>
                <input type="text" id="edit-detalleSalida-${id}" value="${registro.detalleSalida}">
            </div>
        </div>
    `;
}

// Función para guardar edición
function guardarEdicion(id) {
    const fecha = document.getElementById(`edit-fecha-${id}`).value.trim();
    const ingreso = document.getElementById(`edit-ingreso-${id}`).value.trim();
    const detalleIngreso = document.getElementById(`edit-detalleIngreso-${id}`).value.trim();
    const salida = document.getElementById(`edit-salida-${id}`).value.trim();
    const detalleSalida = document.getElementById(`edit-detalleSalida-${id}`).value.trim();
    
    // Validar que todos los campos estén llenos
    if (!fecha || !ingreso || !detalleIngreso || !salida || !detalleSalida) {
        alert('Por favor, completa todos los campos antes de guardar');
        return;
    }
    
    // Validar formato de fecha
    if (!validarFecha(fecha)) {
        alert('Por favor, ingresa una fecha válida en formato DD/MM/AAAA');
        return;
    }
    
    // Validar que los valores numéricos sean válidos
    if (parseFloat(ingreso) < 0 || parseFloat(salida) < 0) {
        alert('Los valores de ingreso y salida deben ser positivos');
        return;
    }
    
    const registro = registros.find(r => r.id === id);
    if (registro) {
        registro.fecha = fecha;
        registro.ingreso = parseFloat(ingreso);
        registro.detalleIngreso = detalleIngreso;
        registro.salida = parseFloat(salida);
        registro.detalleSalida = detalleSalida;
        registro.total = registro.ingreso - registro.salida;
        
        guardarRegistros();
        registroEditando = null;
        aplicarFiltros();
    }
}

// Función para cancelar edición
function cancelarEdicion() {
    registroEditando = null;
    aplicarFiltros();
}

// Función para eliminar registro
function eliminarRegistro(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este registro?')) {
        registros = registros.filter(r => r.id !== id);
        guardarRegistros();
        aplicarFiltros();
    }
}