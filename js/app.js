// =======================================================
// 🧭 SISTEMA DE CONTROL FINANCIERO
// Versión mejorada con formato automático de fecha y COP
// =======================================================

// VARIABLES GLOBALES -----------------------------------
let registros = [];
let registroEditando = null;
let filtroTipo = 'todos';

// Formateador de moneda colombiana 🇨🇴
const formatoCOP = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2
});

// =======================================================
// 🔹 INICIALIZACIÓN DEL SISTEMA
// =======================================================
document.addEventListener('DOMContentLoaded', function() {
    cargarRegistros();
    actualizarTotal();

    // Escuchar cambios de ingreso/salida
    document.getElementById('ingreso').addEventListener('input', manejarFormatoNumerico);
    document.getElementById('salida').addEventListener('input', manejarFormatoNumerico);
    document.getElementById('fecha').addEventListener('input', formatoFechaAutomatica);
});

// =======================================================
// 🔹 FUNCIÓN: Formatear número a pesos colombianos
// =======================================================
function formatearCOP(valor) {
    const numero = parseFloat(valor.replace(/[^0-9.]/g, '')) || 0;
    return formatoCOP.format(numero);
}

// =======================================================
// 🔹 FUNCIÓN: Mantener el formato visual COP en los inputs
// =======================================================
function manejarFormatoNumerico(event) {
    const input = event.target;
    const valor = input.value.replace(/[^0-9.]/g, '');
    if (valor) {
        input.value = formatearCOP(valor);
    } else {
        input.value = '';
    }
    actualizarTotal();
}

// =======================================================
// 🔹 FUNCIÓN: Añadir "/" automáticamente en la fecha
// =======================================================
function formatoFechaAutomatica(e) {
    let valor = e.target.value.replace(/[^0-9]/g, ''); // Solo números
    if (valor.length > 2 && valor.length <= 4) {
        valor = valor.slice(0, 2) + '/' + valor.slice(2);
    } else if (valor.length > 4) {
        valor = valor.slice(0, 2) + '/' + valor.slice(2, 4) + '/' + valor.slice(4, 8);
    }
    e.target.value = valor.slice(0, 10);
}

// =======================================================
// 🔹 FUNCIÓN: Actualiza el total en tiempo real
// =======================================================
function actualizarTotal() {
    const ingreso = parseFloat(document.getElementById('ingreso').value.replace(/[^0-9.]/g, '')) || 0;
    const salida = parseFloat(document.getElementById('salida').value.replace(/[^0-9.]/g, '')) || 0;
    const total = ingreso - salida;
    document.getElementById('totalDisplay').textContent = formatoCOP.format(total);
}

// =======================================================
// 🔹 FUNCIÓN: Validar formato correcto de fecha
// =======================================================
function validarFecha(fecha) {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(fecha)) return false;
    const [dia, mes, anio] = fecha.split('/').map(Number);
    const diasMes = [31, (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return mes >= 1 && mes <= 12 && dia >= 1 && dia <= diasMes[mes - 1];
}

// =======================================================
// 🔹 FUNCIÓN: Mostrar notificaciones tipo banner
// =======================================================
function mostrarNotificacion(mensaje, tipo = 'info') {
    const notificacion = document.getElementById('notificacion');
    notificacion.textContent = mensaje;
    notificacion.className = `notificacion ${tipo}`;
    notificacion.classList.remove('oculto');
    setTimeout(() => notificacion.classList.add('oculto'), 3000);
}

// =======================================================
// 🔹 FUNCIÓN: Agregar registro nuevo
// =======================================================
function agregarRegistro(e) {
    e.preventDefault();
    const fecha = document.getElementById('fecha').value.trim();
    const ingreso = document.getElementById('ingreso').value.replace(/[^0-9.]/g, '');
    const salida = document.getElementById('salida').value.replace(/[^0-9.]/g, '');
    const detalleIngreso = document.getElementById('detalleIngreso').value.trim();
    const detalleSalida = document.getElementById('detalleSalida').value.trim();

    if (!fecha || !ingreso || !salida || !detalleIngreso || !detalleSalida) {
        mostrarNotificacion('⚠️ Completa todos los campos.', 'error');
        return;
    }
    if (!validarFecha(fecha)) {
        mostrarNotificacion('❌ Fecha inválida. Usa DD/MM/AAAA.', 'error');
        return;
    }

    const ingresoNum = parseFloat(ingreso);
    const salidaNum = parseFloat(salida);
    if (isNaN(ingresoNum) || isNaN(salidaNum)) {
        mostrarNotificacion('⚠️ Ingresa valores numéricos válidos.', 'error');
        return;
    }

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
    document.getElementById('formulario').reset();
    actualizarTotal();
    mostrarNotificacion('✅ Registro guardado exitosamente.', 'exito');
}

// =======================================================
// 🔹 LOCAL STORAGE: Guardar y Cargar
// =======================================================
function guardarRegistros() {
    localStorage.setItem('registros', JSON.stringify(registros));
}
function cargarRegistros() {
    const data = localStorage.getItem('registros');
    if (data) registros = JSON.parse(data);
}

// =======================================================
// 🔹 FILTROS Y VISUALIZACIÓN
// =======================================================
function mostrarRegistros() { aplicarFiltros(); }

function aplicarFiltros() {
    const busqueda = document.getElementById('busqueda').value.toLowerCase();
    const dia = document.getElementById('filtroDia').value;
    const mes = document.getElementById('filtroMes').value;
    const anio = document.getElementById('filtroAnio').value;
    let filtrados = [...registros];

    if (busqueda) filtrados = filtrados.filter(r => r.detalleIngreso.toLowerCase().includes(busqueda) || r.detalleSalida.toLowerCase().includes(busqueda));
    if (dia || mes || anio) {
        filtrados = filtrados.filter(r => {
            const [d, m, a] = r.fecha.split('/');
            return (!dia || d === dia.padStart(2, '0')) && (!mes || m === mes.padStart(2, '0')) && (!anio || a === anio);
        });
    }
    if (filtroTipo === 'ingresos') filtrados = filtrados.filter(r => r.ingreso > 0);
    if (filtroTipo === 'salidas') filtrados = filtrados.filter(r => r.salida > 0);
    renderizarRegistros(filtrados);
    calcularTotales(filtrados);
}

function filtrarPorTipo(tipo) {
    filtroTipo = tipo;
    document.querySelectorAll('.boton-filtro').forEach(b => b.classList.remove('activo'));
    document.getElementById(`btn${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`).classList.add('activo');
    aplicarFiltros();
}

function limpiarFiltros() {
    document.getElementById('busqueda').value = '';
    document.getElementById('filtroDia').value = '';
    document.getElementById('filtroMes').value = '';
    document.getElementById('filtroAnio').value = '';
    filtroTipo = 'todos';
    document.querySelectorAll('.boton-filtro').forEach(b => b.classList.remove('activo'));
    document.getElementById('btnTodos').classList.add('activo');
    aplicarFiltros();
}

// =======================================================
// 🔹 CÁLCULO DE TOTALES Y RENDERIZACIÓN
// =======================================================
function calcularTotales(filtrados) {
    let ingresos = 0, salidas = 0;
    filtrados.forEach(r => {
        ingresos += r.ingreso;
        salidas += r.salida;
    });
    document.getElementById('totalIngresos').textContent = formatoCOP.format(ingresos);
    document.getElementById('totalSalidas').textContent = formatoCOP.format(salidas);
    document.getElementById('balanceTotal').textContent = formatoCOP.format(ingresos - salidas);
}

function renderizarRegistros(filtrados) {
    const lista = document.getElementById('listaRegistros');
    const vacio = document.getElementById('mensajeVacio');
    if (filtrados.length === 0) {
        lista.innerHTML = '';
        vacio.classList.remove('oculto');
        return;
    }
    vacio.classList.add('oculto');
    lista.innerHTML = filtrados.map(r => `
        <div class="registro" id="registro-${r.id}">
            <div class="registro-header">
                <div class="registro-fecha">${r.fecha}</div>
                <div class="registro-acciones">
                    <button class="boton-editar" onclick="editarRegistro(${r.id})">Editar</button>
                    <button class="boton-eliminar" onclick="eliminarRegistro(${r.id})">Eliminar</button>
                </div>
            </div>
            <div class="registro-detalles">
                <div><b>Ingreso:</b> ${formatoCOP.format(r.ingreso)}</div>
                <div><b>Detalle Ingreso:</b> ${r.detalleIngreso}</div>
                <div><b>Salida:</b> ${formatoCOP.format(r.salida)}</div>
                <div><b>Detalle Salida:</b> ${r.detalleSalida}</div>
                <div><b>Total:</b> ${formatoCOP.format(r.total)}</div>
            </div>
        </div>
    `).join('');
}

// =======================================================
// 🔹 EDICIÓN Y ELIMINACIÓN DE REGISTROS
// =======================================================
function editarRegistro(id) {
    const r = registros.find(x => x.id === id);
    if (!r) return;
    const elem = document.getElementById(`registro-${id}`);
    elem.innerHTML = `
        <div class="registro-header">
            <div class="registro-fecha">${r.fecha}</div>
            <div class="registro-acciones">
                <button class="boton-guardar" onclick="guardarEdicion(${id})">Guardar</button>
                <button class="boton-cancelar" onclick="aplicarFiltros()">Cancelar</button>
            </div>
        </div>
        <div class="registro-detalles registro-editar">
            <input type="text" id="edit-fecha-${id}" value="${r.fecha}" maxlength="10" oninput="formatoFechaAutomatica(event)">
            <input type="text" id="edit-ingreso-${id}" value="${formatoCOP.format(r.ingreso)}" oninput="manejarFormatoNumerico(event)">
            <input type="text" id="edit-detalleIngreso-${id}" value="${r.detalleIngreso}">
            <input type="text" id="edit-salida-${id}" value="${formatoCOP.format(r.salida)}" oninput="manejarFormatoNumerico(event)">
            <input type="text" id="edit-detalleSalida-${id}" value="${r.detalleSalida}">
        </div>`;
}

function guardarEdicion(id) {
    const f = document.getElementById(`edit-fecha-${id}`).value.trim();
    const i = parseFloat(document.getElementById(`edit-ingreso-${id}`).value.replace(/[^0-9.]/g, '')) || 0;
    const s = parseFloat(document.getElementById(`edit-salida-${id}`).value.replace(/[^0-9.]/g, '')) || 0;
    const dI = document.getElementById(`edit-detalleIngreso-${id}`).value.trim();
    const dS = document.getElementById(`edit-detalleSalida-${id}`).value.trim();
    if (!validarFecha(f)) {
        mostrarNotificacion('❌ Fecha inválida.', 'error');
        return;
    }
    const r = registros.find(x => x.id === id);
    if (r) {
        r.fecha = f;
        r.ingreso = i;
        r.detalleIngreso = dI;
        r.salida = s;
        r.detalleSalida = dS;
        r.total = i - s;
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
