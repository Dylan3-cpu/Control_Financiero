// =======================================================
// 🧭 SISTEMA DE CONTROL FINANCIERO
// Archivo: app.js
// Explicado y comentado completamente en español
// =======================================================

// VARIABLES GLOBALES -----------------------------------
let registros = [];        // Almacena todos los registros
let registroEditando = null;  // Guarda el ID si se está editando
let filtroTipo = 'todos';  // Filtro actual (todos, ingresos o salidas)

// =======================================================
// 🔹 INICIALIZACIÓN DEL SISTEMA
// =======================================================
document.addEventListener('DOMContentLoaded', function() {
    cargarRegistros();  // Cargar registros guardados del localStorage
    actualizarTotal();  // Mostrar total inicial
    
    // Escuchar cambios en los campos de ingreso/salida para recalcular total
    document.getElementById('ingreso').addEventListener('input', actualizarTotal);
    document.getElementById('salida').addEventListener('input', actualizarTotal);
});

// =======================================================
// 🔹 FUNCIÓN: Mostrar pantalla activa
// =======================================================
function mostrarPantalla(pantalla) {
    const pantallas = document.querySelectorAll('.pantalla');
    pantallas.forEach(p => p.classList.remove('activa'));
    document.getElementById(pantalla).classList.add('activa');
    
    if (pantalla === 'registros') {
        mostrarRegistros();
    }
}

// =======================================================
// 🔹 FUNCIÓN: Actualiza el total en tiempo real
// =======================================================
function actualizarTotal() {
    const ingreso = parseFloat(document.getElementById('ingreso').value) || 0;
    const salida = parseFloat(document.getElementById('salida').value) || 0;
    const total = ingreso - salida;
    document.getElementById('totalDisplay').textContent = '$' + total.toFixed(2);
}

// =======================================================
// 🔹 FUNCIÓN: Validar fecha (solo formato DD/MM/AAAA)
// =======================================================
function validarFecha(fecha) {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(fecha)) return false;

    const [dia, mes, anio] = fecha.split('/').map(Number);
    if (dia < 1 || dia > 31 || mes < 1 || mes > 12 || anio < 1900 || anio > 2100) return false;

    // Verifica días válidos por mes
    const diasPorMes = [31, (anio % 4 === 0 && anio % 100 !== 0) || (anio % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return dia <= diasPorMes[mes - 1];
}

// =======================================================
// 🔹 FUNCIÓN: Mostrar notificaciones tipo banner
// =======================================================
function mostrarNotificacion(mensaje, tipo = 'info') {
    const notificacion = document.getElementById('notificacion');
    notificacion.textContent = mensaje;
    notificacion.className = `notificacion ${tipo}`; // Tipo puede ser: info, error, exito
    notificacion.classList.remove('oculto');

    setTimeout(() => notificacion.classList.add('oculto'), 3000);
}

// =======================================================
// 🔹 FUNCIÓN: Agregar nuevo registro
// =======================================================
function agregarRegistro(event) {
    event.preventDefault();

    // Obtener valores del formulario
    const fecha = document.getElementById('fecha').value.trim();
    const ingreso = document.getElementById('ingreso').value.trim();
    const detalleIngreso = document.getElementById('detalleIngreso').value.trim();
    const salida = document.getElementById('salida').value.trim();
    const detalleSalida = document.getElementById('detalleSalida').value.trim();

    // Validar campos vacíos
    if (!fecha || !ingreso || !detalleIngreso || !salida || !detalleSalida) {
        mostrarNotificacion('⚠️ Por favor, completa todos los campos.', 'error');
        return;
    }

    // Validar fecha
    if (!validarFecha(fecha)) {
        mostrarNotificacion('❌ Fecha inválida. Usa formato DD/MM/AAAA.', 'error');
        return;
    }

    const ingresoNum = parseFloat(ingreso);
    const salidaNum = parseFloat(salida);

    // Validar números
    if (isNaN(ingresoNum) || isNaN(salidaNum) || ingresoNum < 0 || salidaNum < 0) {
        mostrarNotificacion('⚠️ Los valores deben ser números positivos.', 'error');
        return;
    }

    // Crear registro
    const registro = {
        id: Date.now(),
        fecha,
        ingreso: ingresoNum,
        detalleIngreso,
        salida: salidaNum,
        detalleSalida,
        total: ingresoNum - salidaNum
    };

    registros.push(registro);
    guardarRegistros();

    // Limpiar formulario
    document.getElementById('formulario').reset();
    actualizarTotal();

    mostrarNotificacion('✅ Registro guardado exitosamente', 'exito');
}

// =======================================================
// 🔹 GUARDAR y CARGAR registros
// =======================================================
function guardarRegistros() {
    localStorage.setItem('registros', JSON.stringify(registros));
}

function cargarRegistros() {
    const guardados = localStorage.getItem('registros');
    if (guardados) registros = JSON.parse(guardados);
}

// =======================================================
// 🔹 MOSTRAR REGISTROS y FILTROS
// =======================================================
function mostrarRegistros() {
    aplicarFiltros();
}

// Aplica filtros (por texto, fecha o tipo)
function aplicarFiltros() {
    const busqueda = document.getElementById('busqueda').value.toLowerCase();
    const filtroDia = document.getElementById('filtroDia').value;
    const filtroMes = document.getElementById('filtroMes').value;
    const filtroAnio = document.getElementById('filtroAnio').value;

    let filtrados = [...registros];

    // Filtro por texto
    if (busqueda) {
        filtrados = filtrados.filter(r =>
            r.detalleIngreso.toLowerCase().includes(busqueda) ||
            r.detalleSalida.toLowerCase().includes(busqueda)
        );
    }

    // Filtro por fecha
    if (filtroDia || filtroMes || filtroAnio) {
        filtrados = filtrados.filter(r => {
            const [dia, mes, anio] = r.fecha.split('/');
            return (!filtroDia || dia === filtroDia.padStart(2, '0')) &&
                   (!filtroMes || mes === filtroMes.padStart(2, '0')) &&
                   (!filtroAnio || anio === filtroAnio);
        });
    }

    // Filtro por tipo
    if (filtroTipo === 'ingresos') filtrados = filtrados.filter(r => r.ingreso > 0);
    if (filtroTipo === 'salidas') filtrados = filtrados.filter(r => r.salida > 0);

    renderizarRegistros(filtrados);
    calcularTotales(filtrados);
}

// Filtrar por tipo
function filtrarPorTipo(tipo) {
    filtroTipo = tipo;
    document.querySelectorAll('.boton-filtro').forEach(btn => btn.classList.remove('activo'));
    document.getElementById(`btn${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`).classList.add('activo');
    aplicarFiltros();
}

// Limpia todos los filtros
function limpiarFiltros() {
    document.getElementById('busqueda').value = '';
    document.getElementById('filtroDia').value = '';
    document.getElementById('filtroMes').value = '';
    document.getElementById('filtroAnio').value = '';
    filtroTipo = 'todos';
    document.querySelectorAll('.boton-filtro').forEach(btn => btn.classList.remove('activo'));
    document.getElementById('btnTodos').classList.add('activo');
    aplicarFiltros();
}

// =======================================================
// 🔹 Calcular totales generales
// =======================================================
function calcularTotales(filtrados) {
    let totalIngresos = 0, totalSalidas = 0;
    filtrados.forEach(r => {
        totalIngresos += r.ingreso;
        totalSalidas += r.salida;
    });

    document.getElementById('totalIngresos').textContent = '$' + totalIngresos.toFixed(2);
    document.getElementById('totalSalidas').textContent = '$' + totalSalidas.toFixed(2);
    document.getElementById('balanceTotal').textContent = '$' + (totalIngresos - totalSalidas).toFixed(2);
}

// =======================================================
// 🔹 Renderizar registros en pantalla
// =======================================================
function renderizarRegistros(filtrados) {
    const lista = document.getElementById('listaRegistros');
    const vacio = document.getElementById('mensajeVacio');

    if (filtrados.length === 0) {
        lista.innerHTML = '';
        vacio.classList.remove('oculto');
        return;
    }

    vacio.classList.add('oculto');
    lista.innerHTML = filtrados.map(reg => `
        <div class="registro" id="registro-${reg.id}">
            <div class="registro-header">
                <div class="registro-fecha">${reg.fecha}</div>
                <div class="registro-acciones">
                    <button class="boton-editar" onclick="editarRegistro(${reg.id})">Editar</button>
                    <button class="boton-eliminar" onclick="eliminarRegistro(${reg.id})">Eliminar</button>
                </div>
            </div>
            <div class="registro-detalles">
                <div><b>Ingreso:</b> $${reg.ingreso.toFixed(2)}</div>
                <div><b>Detalle Ingreso:</b> ${reg.detalleIngreso}</div>
                <div><b>Salida:</b> $${reg.salida.toFixed(2)}</div>
                <div><b>Detalle Salida:</b> ${reg.detalleSalida}</div>
                <div><b>Total:</b> $${reg.total.toFixed(2)}</div>
            </div>
        </div>
    `).join('');
}

// =======================================================
// 🔹 Editar, Guardar y Eliminar Registros
// =======================================================
function editarRegistro(id) {
    const reg = registros.find(r => r.id === id);
    if (!reg) return;

    const elem = document.getElementById(`registro-${id}`);
    elem.innerHTML = `
        <div class="registro-header">
            <div class="registro-fecha">${reg.fecha}</div>
            <div class="registro-acciones">
                <button class="boton-guardar" onclick="guardarEdicion(${id})">Guardar</button>
                <button class="boton-cancelar" onclick="aplicarFiltros()">Cancelar</button>
            </div>
        </div>
        <div class="registro-detalles registro-editar">
            <input type="text" id="edit-fecha-${id}" value="${reg.fecha}" maxlength="10" oninput="this.value=this.value.replace(/[^0-9/]/g,'')">
            <input type="text" id="edit-ingreso-${id}" value="${reg.ingreso}" oninput="this.value=this.value.replace(/[^0-9.]/g,'')">
            <input type="text" id="edit-detalleIngreso-${id}" value="${reg.detalleIngreso}">
            <input type="text" id="edit-salida-${id}" value="${reg.salida}" oninput="this.value=this.value.replace(/[^0-9.]/g,'')">
            <input type="text" id="edit-detalleSalida-${id}" value="${reg.detalleSalida}">
        </div>
    `;
}

function guardarEdicion(id) {
    const fecha = document.getElementById(`edit-fecha-${id}`).value.trim();
    const ingreso = parseFloat(document.getElementById(`edit-ingreso-${id}`).value.trim());
    const salida = parseFloat(document.getElementById(`edit-salida-${id}`).value.trim());
    const detalleIngreso = document.getElementById(`edit-detalleIngreso-${id}`).value.trim();
    const detalleSalida = document.getElementById(`edit-detalleSalida-${id}`).value.trim();

    if (!fecha || isNaN(ingreso) || isNaN(salida)) {
        mostrarNotificacion('⚠️ Verifica los datos antes de guardar.', 'error');
        return;
    }
    if (!validarFecha(fecha)) {
        mostrarNotificacion('❌ Fecha inválida.', 'error');
        return;
    }

    const reg = registros.find(r => r.id === id);
    if (reg) {
        reg.fecha = fecha;
        reg.ingreso = ingreso;
        reg.detalleIngreso = detalleIngreso;
        reg.salida = salida;
        reg.detalleSalida = detalleSalida;
        reg.total = ingreso - salida;
        guardarRegistros();
        mostrarNotificacion('✅ Cambios guardados.', 'exito');
        aplicarFiltros();
    }
}

function eliminarRegistro(id) {
    registros = registros.filter(r => r.id !== id);
    guardarRegistros();
    mostrarNotificacion('🗑️ Registro eliminado.', 'info');
    aplicarFiltros();
}
