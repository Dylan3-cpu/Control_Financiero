// =======================================================
// 🧭 SISTEMA DE CONTROL FINANCIERO
// Versión estable con formato COP y fecha automática
// =======================================================

// VARIABLES GLOBALES -----------------------------------
let registros = [];
let registroEditando = null;
let filtroTipo = 'todos';
let notificacionTimeout = null;
let agruparPorMes = false; // <-- nuevo: controlar si se agrupa la vista por mes

// Formateador de moneda colombiana 🇨🇴
const formatoCOP = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2
});

// =======================================================
// 🔹 INICIALIZACIÓN DEL SISTEMA
// (reemplaza la sección original para añadir protecciones si los elementos no existen)
// =======================================================
document.addEventListener('DOMContentLoaded', async function() {
    await cargarRegistros();            // esperar carga antes de renderizar
    aplicarFiltros();                  // renderiza registros cargados
    actualizarTotal();

    // Escuchar cambios de ingreso/salida (con comprobación defensiva)
    const ingresoElem = document.getElementById('ingreso');
    const salidaElem = document.getElementById('salida');
    if (ingresoElem) {
        ingresoElem.addEventListener('focus', quitarFormatoNumerico);
        ingresoElem.addEventListener('blur', aplicarFormatoNumerico);
        ingresoElem.addEventListener('input', actualizarTotal);
    }
    if (salidaElem) {
        salidaElem.addEventListener('focus', quitarFormatoNumerico);
        salidaElem.addEventListener('blur', aplicarFormatoNumerico);
        salidaElem.addEventListener('input', actualizarTotal);
    }

    // Formato automático de fecha (si existe)
    const fechaElem = document.getElementById('fecha');
    if (fechaElem) fechaElem.addEventListener('input', formatoFechaAutomatica);

    // Conectar input file si existe (por si no estaba en el DOM antes)
    const fileImport = document.getElementById('fileImportCSV');
    if (fileImport) fileImport.addEventListener('change', importarCSV);

    // Asegurarse de que el botón agrupar refleje el estado inicial
    const btnAgr = document.getElementById('btnAgruparMes');
    if (btnAgr) btnAgr.classList.toggle('activo', agruparPorMes);
});

// =======================================================
// 🔹 FUNCIÓN: Formatear número a pesos colombianos (robusta)
// =======================================================
function formatearCOP(valor) {
    const s = (valor === null || typeof valor === 'undefined') ? '0' : String(valor);
    const numero = parseFloat(s.replace(/[^\d.]/g, '').replace(',', '.')) || 0;
    return formatoCOP.format(numero);
}

// =======================================================
// 🔹 HELPERS: Normalizar y parsear cadenas numéricas
// =======================================================
function normalizeNumberString(str) {
    if (!str && str !== 0) return '';
    let s = String(str).trim();
    // quitar símbolos no numéricos excepto . , -
    s = s.replace(/[^\d,.\-]/g, '');
    if (s === '') return '';
    // si contiene coma asumimos formato local con coma decimal y puntos de miles
    if (s.indexOf(',') !== -1) {
        s = s.replace(/\./g, ''); // quitar separadores de miles
        s = s.replace(/,/g, '.'); // coma -> punto decimal
    } else {
        // si no hay coma, eliminar puntos de miles dejando sólo el último como decimal (si hay varios)
        const dots = (s.match(/\./g) || []).length;
        if (dots > 1) s = s.replace(/\.(?=.*\.)/g, '');
    }
    return s;
}
function parseNumberFromInput(str) {
    const norm = normalizeNumberString(str);
    const n = parseFloat(norm);
    return isNaN(n) ? 0 : n;
}

// =======================================================
// 🔹 FUNCIÓN: Mostrar valor crudo al editar (focus)
// =======================================================
function quitarFormatoNumerico(event) {
    const input = event.target;
    // Mostrar versión sin separadores de miles y con punto decimal
    const crudo = normalizeNumberString(input.value);
    input.value = crudo || '';
}

// =======================================================
// 🔹 FUNCIÓN: Aplicar formato COP al perder foco (blur)
// =======================================================
function aplicarFormatoNumerico(event) {
    const input = event.target;
    const numero = parseNumberFromInput(input.value);
    if (numero !== 0 || input.value.trim().length > 0) {
        input.value = formatoCOP.format(numero);
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
// 🔹 FUNCIÓN: Actualiza el total en tiempo real (defensiva)
// =======================================================
function actualizarTotal() {
	// obtener elementos de forma defensiva
	const ingresoElem = document.getElementById('ingreso');
	const salidaElem = document.getElementById('salida');
	const totalElem = document.getElementById('totalDisplay');

	const ingreso = ingresoElem ? parseNumberFromInput(ingresoElem.value) : 0;
	const salida = salidaElem ? parseNumberFromInput(salidaElem.value) : 0;
	const total = ingreso - salida;
	if (totalElem) totalElem.textContent = formatoCOP.format(total);
}

// =======================================================
// 🔹 FUNCIÓN: Validar formato correcto de fecha (con rango de año)
// =======================================================
function validarFecha(fecha) {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(fecha)) return false;
    const [dia, mes, anio] = fecha.split('/').map(Number);
    if (anio < 2000 || anio > 2100) return false; // rango aceptable
    const diasMes = [31, (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return mes >= 1 && mes <= 12 && dia >= 1 && dia <= diasMes[mes - 1];
}

// =======================================================
// 🔹 FUNCIÓN: Mostrar notificaciones tipo banner (segura)
// - evita timeouts superpuestos y limpia el banner anterior
// =======================================================
function mostrarNotificacion(mensaje, tipo = 'info') {
    const notificacion = document.getElementById('notificacion');
    if (!notificacion) return;
    // limpiar timeout anterior
    if (notificacionTimeout) {
        clearTimeout(notificacionTimeout);
        notificacionTimeout = null;
    }
    notificacion.textContent = mensaje;
    notificacion.className = `notificacion ${tipo}`;
    notificacion.classList.remove('oculto');
    // Ocultar después de 3s y guardar el id
    notificacionTimeout = setTimeout(() => {
        notificacion.classList.add('oculto');
        notificacionTimeout = null;
    }, 3000);
}

// =======================================================
// 🔹 FUNCIÓN: Agregar registro nuevo (permitir sólo ingreso o sólo salida)
// - ahora obtiene elementos de forma defensiva y evita excepciones si faltan
// =======================================================
function agregarRegistro(e) {
    e.preventDefault();

    const fechaElem = document.getElementById('fecha');
    const ingresoElem = document.getElementById('ingreso');
    const salidaElem = document.getElementById('salida');
    const detalleIngresoElem = document.getElementById('detalleIngreso');
    const detalleSalidaElem = document.getElementById('detalleSalida');
    const formulario = document.getElementById('formulario');

    if (!fechaElem || !ingresoElem || !salidaElem || !detalleIngresoElem || !detalleSalidaElem) {
        mostrarNotificacion('Formulario incompleto en el DOM.', 'error');
        return;
    }

    const fecha = fechaElem.value.trim();
    const ingresoRaw = ingresoElem.value;
    const salidaRaw = salidaElem.value;
    const detalleIngreso = detalleIngresoElem.value.trim();
    const detalleSalida = detalleSalidaElem.value.trim();

    if (!fecha) {
        mostrarNotificacion('⚠️ Completa la fecha.', 'error');
        return;
    }
    if (!validarFecha(fecha)) {
        mostrarNotificacion('❌ Fecha inválida. Usa DD/MM/AAAA.', 'error');
        return;
    }

    const ingresoNum = parseNumberFromInput(ingresoRaw);
    const salidaNum = parseNumberFromInput(salidaRaw);

    // Debe existir al menos ingreso o salida
    if (ingresoNum === 0 && salidaNum === 0) {
        mostrarNotificacion('⚠️ Ingresa un valor en ingreso o en salida.', 'error');
        return;
    }
    // Validar detalles sólo si corresponde
    if (ingresoNum > 0 && !detalleIngreso) {
        mostrarNotificacion('⚠️ Agrega detalle para el ingreso.', 'error');
        return;
    }
    if (salidaNum > 0 && !detalleSalida) {
        mostrarNotificacion('⚠️ Agrega detalle para la salida.', 'error');
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
    if (formulario) formulario.reset();
    actualizarTotal();
    mostrarNotificacion('✅ Registro guardado exitosamente.', 'exito');
    // opcional: mostrar la pantalla de registros
    // mostrarPantalla('registros');
}

// =======================================================
// 🔹 GUARDAR y CARGAR registros (más robusto)
// - Maneja JSON corrupto y usa data/registros.json como fallback si no hay localStorage
// - Normaliza tipos numéricos al cargar
// =======================================================
function guardarRegistros() {
    try {
        localStorage.setItem('registros', JSON.stringify(registros));
    } catch (err) {
        console.error('Error guardando registros en localStorage:', err);
        mostrarNotificacion('Error al guardar datos localmente.', 'error');
    }
}

async function cargarRegistros() {
    // primero intentar localStorage
    try {
        const data = localStorage.getItem('registros');
        if (data) {
            try {
                registros = JSON.parse(data);
            } catch (err) {
                console.warn('JSON de localStorage corrupto, se ignorará. Error:', err);
                registros = [];
            }
        } else {
            // fallback: intentar cargar archivo estático (si existe)
            try {
                const resp = await fetch('data/registros.json', { cache: 'no-store' });
                if (resp.ok) {
                    registros = await resp.json();
                }
            } catch (err) {
                // no hay archivo o no es accesible (ok), simplemente no hacemos nada
                registros = registros || [];
            }
        }
    } catch (err) {
        console.error('Error leyendo registros:', err);
        registros = [];
    }

    // normalizar tipos numéricos y total por registro
    registros = (registros || []).map(r => {
        const ingreso = Number(r.ingreso) || 0;
        const salida = Number(r.salida) || 0;
        const total = (typeof r.total !== 'undefined') ? Number(r.total) || (ingreso - salida) : (ingreso - salida);
        return {
            ...r,
            ingreso,
            salida,
            total
        };
    });
}

// =======================================================
// 🔹 MOSTRAR Y FILTRAR REGISTROS
// =======================================================
function mostrarRegistros() { aplicarFiltros(); }

// =======================================================
// 🔹 HELPERS: Parsear fecha "DD/MM/YYYY" a comparable "YYYYMMDD"
// =======================================================
function fechaAClave(fecha) {
    if (!fecha) return '00000000';
    const parts = String(fecha).split('/');
    if (parts.length !== 3) return '00000000';
    const [d, m, a] = parts;
    return `${String(a).padStart(4,'0')}${String(m).padStart(2,'0')}${String(d).padStart(2,'0')}`;
}

function aplicarFiltros() {
    const busqElem = document.getElementById('busqueda');
    const busqueda = busqElem ? busqElem.value.toLowerCase() : '';
    const diaElem = document.getElementById('filtroDia');
    const mesElem = document.getElementById('filtroMes');
    const anioElem = document.getElementById('filtroAnio');
    const dia = diaElem ? diaElem.value : '';
    const mes = mesElem ? mesElem.value : '';
    const anio = anioElem ? anioElem.value : '';
    let filtrados = [...registros];

    if (busqueda)
        filtrados = filtrados.filter(r => (String(r.detalleIngreso || '').toLowerCase().includes(busqueda) || String(r.detalleSalida || '').toLowerCase().includes(busqueda)));

    if (dia || mes || anio) {
        filtrados = filtrados.filter(r => {
            const [d, m, a] = (r.fecha || '').split('/');
            return (!dia || d === String(dia).padStart(2, '0')) && (!mes || m === String(mes).padStart(2,'0')) && (!anio || a === String(anio));
        });
    }

    if (filtroTipo === 'ingresos') filtrados = filtrados.filter(r => Number(r.ingreso) > 0);
    if (filtroTipo === 'salidas') filtrados = filtrados.filter(r => Number(r.salida) > 0);

    // Ordenar por fecha descendente (mas reciente primero). Si fecha inválida, fallback por id.
    filtrados.sort((a, b) => {
        const ka = fechaAClave(a.fecha) || ('00000000' + (a.id||0));
        const kb = fechaAClave(b.fecha) || ('00000000' + (b.id||0));
        if (ka === kb) return (b.id || 0) - (a.id || 0);
        return kb.localeCompare(ka);
    });

    renderizarRegistros(filtrados);
    calcularTotales(filtrados);
}

function filtrarPorTipo(tipo) {
    filtroTipo = tipo;
    document.querySelectorAll('.boton-filtro').forEach(b => b.classList.remove('activo'));
    const idBoton = `btn${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`;
    const boton = document.getElementById(idBoton);
    if (boton) boton.classList.add('activo');
    aplicarFiltros();
}

function limpiarFiltros() {
    const busq = document.getElementById('busqueda');
    const fd = document.getElementById('filtroDia');
    const fm = document.getElementById('filtroMes');
    const fa = document.getElementById('filtroAnio');
    if (busq) busq.value = '';
    if (fd) fd.value = '';
    if (fm) fm.value = '';
    if (fa) fa.value = '';
    filtroTipo = 'todos';
    document.querySelectorAll('.boton-filtro').forEach(b => b.classList.remove('activo'));
    const btnTodos = document.getElementById('btnTodos');
    if (btnTodos) btnTodos.classList.add('activo');
    aplicarFiltros();
}

// =======================================================
// 🔹 CALCULAR TOTALES (defensivo con comprobación de elementos)
// =======================================================
function calcularTotales(filtrados) {
    let ingresos = 0, salidas = 0;
    filtrados.forEach(r => {
        ingresos += Number(r.ingreso) || 0;
        salidas += Number(r.salida) || 0;
    });
    const ti = document.getElementById('totalIngresos');
    const ts = document.getElementById('totalSalidas');
    const bt = document.getElementById('balanceTotal');
    if (ti) ti.textContent = formatoCOP.format(ingresos);
    if (ts) ts.textContent = formatoCOP.format(salidas);
    if (bt) bt.textContent = formatoCOP.format(ingresos - salidas);
}

// =======================================================
// 🔹 FUNCIÓN: Alternar agrupado por mes
// =======================================================
function toggleAgruparPorMes() {
    agruparPorMes = !agruparPorMes;
    const btn = document.getElementById('btnAgruparMes');
    if (btn) btn.classList.toggle('activo', agruparPorMes);
    aplicarFiltros();
}

// =======================================================
// 🔹 FUNCIÓN: Exportar registros a CSV (añadir BOM para Excel)
// =======================================================
function exportCSV() {
    if (!registros || registros.length === 0) {
        mostrarNotificacion('No hay registros para exportar.', 'info');
        return;
    }
    const headers = ['id','fecha','ingreso','detalleIngreso','salida','detalleSalida','total'];
    const lines = [headers.join(',')];
    registros.forEach(r => {
        const row = [
            r.id,
            `"${String(r.fecha || '').replace(/"/g, '""')}"`,
            r.ingreso,
            `"${String(r.detalleIngreso || '').replace(/"/g, '""')}"`,
            r.salida,
            `"${String(r.detalleSalida || '').replace(/"/g, '""')}"`,
            r.total
        ];
        lines.push(row.join(','));
    });
    const csv = lines.join('\r\n');
    // BOM para compatibilidad Excel
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registros_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    mostrarNotificacion('✅ CSV generado.', 'exito');
}

// =======================================================
// 🔹 FUNCIÓN: Trigger para input file (abrir diálogo de importación)
// =======================================================
function triggerImportCSV() {
    const f = document.getElementById('fileImportCSV');
    if (f) f.click();
    else mostrarNotificacion('Elemento de importación no disponible.', 'error');
}

// =======================================================
// 🔹 FUNCIÓN: Importar CSV (más robusto con mapeo por encabezado)
// =======================================================
function importarCSV(event) {
    const file = event && event.target ? event.target.files[0] : null;
    if (!file) {
        mostrarNotificacion('No se seleccionó ningún archivo.', 'error');
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length <= 1) {
            mostrarNotificacion('CSV vacío o sin datos.', 'error');
            return;
        }
        // cabecera robusta: quitar comillas y normalizar
        const rawHeader = lines[0];
        const headerCols = rawHeader.split(',').map(h => h.trim().replace(/^"|"$/g,'').toLowerCase());
        const indexOf = (name) => headerCols.findIndex(h => h === name);
        // campos esperados (aceptar varias variantes)
        const headerMap = {
            fecha: indexOf('fecha'),
            ingreso: indexOf('ingreso'),
            detalleingreso: indexOf('detalleingreso') >=0 ? indexOf('detalleingreso') : indexOf('detalle_ingreso'),
            salida: indexOf('salida'),
            detallesalida: indexOf('detallesalida') >=0 ? indexOf('detallesalida') : indexOf('detalle_salida')
        };
        // si no encontramos al menos fecha y (ingreso o salida) en cabecera, fallamos
        if (headerMap.fecha < 0 || (headerMap.ingreso < 0 && headerMap.salida < 0)) {
            mostrarNotificacion('CSV con encabezado inesperado. Debe contener: fecha, ingreso o salida.', 'error');
            return;
        }

        const nuevos = [];
        let contador = 0;
        for (let i = 1; i < lines.length; i++) {
            const raw = lines[i];
            // split respetando comillas (aprox.)
            const cols = raw.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
            const clean = cols.map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"'));
            const fecha = (clean[headerMap.fecha] || '').trim();
            const ingreso = headerMap.ingreso >= 0 ? parseNumberFromInput(clean[headerMap.ingreso] || '') : 0;
            const detalleIngreso = headerMap.detalleingreso >= 0 ? (clean[headerMap.detalleingreso] || '').trim() : '';
            const salida = headerMap.salida >= 0 ? parseNumberFromInput(clean[headerMap.salida] || '') : 0;
            const detalleSalida = headerMap.detallesalida >= 0 ? (clean[headerMap.detallesalida] || '').trim() : '';

            if (!validarFecha(fecha)) {
                console.warn(`Fila ${i+1} ignorada por fecha inválida:`, fecha);
                continue;
            }
            if (ingreso === 0 && salida === 0) {
                console.warn(`Fila ${i+1} ignorada por montos vacíos.`);
                continue;
            }
            const idNuevo = Date.now() + (contador++);
            const registro = {
                id: idNuevo,
                fecha,
                ingreso,
                detalleIngreso,
                salida,
                detalleSalida,
                total: ingreso - salida
            };
            nuevos.push(registro);
        }

        if (nuevos.length === 0) {
            mostrarNotificacion('No se importaron filas válidas del CSV.', 'info');
            return;
        }

        registros = registros.concat(nuevos);
        guardarRegistros();
        aplicarFiltros();
        mostrarNotificacion(`✅ Importadas ${nuevos.length} filas.`, 'exito');

        // limpiar input file (si existe)
        if (event && event.target) event.target.value = '';
    };
    reader.onerror = function(err) {
        console.error('Error leyendo CSV:', err);
        mostrarNotificacion('Error leyendo archivo CSV.', 'error');
    };
    reader.readAsText(file, 'UTF-8');
}

// =======================================================
// 🔹 MOSTRAR REGISTROS EN PANTALLA (ACTUALIZADO PARA AGRUPAR)
// - Si agruparPorMes === true, muestra headers por mes y subtotal por mes
// - Cada registro conserva el mismo wrapper con id="registro-<id>" para que editar/eliminar funcionen
// =======================================================
function renderizarRegistros(filtrados) {
	const lista = document.getElementById('listaRegistros');
	const vacio = document.getElementById('mensajeVacio');
	if (!lista || !vacio) return;
	if (filtrados.length === 0) {
		lista.innerHTML = '';
		vacio.classList.remove('oculto');
		return;
	}
	vacio.classList.add('oculto');

	if (!agruparPorMes) {
		lista.innerHTML = filtrados.map(r => {
			const ingreso = Number(r.ingreso) || 0;
			const salida = Number(r.salida) || 0;
			const totalComputed = ingreso - salida;
			return `
			<div class="registro" id="registro-${r.id}">
				<div class="registro-header">
					<div class="registro-fecha">${r.fecha}</div>
					<div class="registro-acciones">
						<button class="boton-editar" onclick="editarRegistro(${r.id})">Editar</button>
						<button class="boton-eliminar" onclick="eliminarRegistro(${r.id})">Eliminar</button>
					</div>
				</div>
				<div class="registro-detalles">
					<div><b>Ingreso:</b> ${formatoCOP.format(ingreso)}</div>
					<div><b>Detalle Ingreso:</b> ${r.detalleIngreso || ''}</div>
					<div><b>Salida:</b> ${formatoCOP.format(salida)}</div>
					<div><b>Detalle Salida:</b> ${r.detalleSalida || ''}</div>
					<div><b>Total:</b> ${formatoCOP.format(totalComputed)}</div>
				</div>
			</div>
		`;
		}).join('');
		return;
	}

	// AGRUPADO POR MES: construir grupo y mantener el mismo markup por registro
	const grupos = {}; // clave 'YYYY-MM' -> { items: [], ingresos:0, salidas:0, year, month }
	filtrados.forEach(r => {
		const [d, m, a] = (r.fecha || '').split('/');
		const mes = (m || '01').padStart(2, '0');
		const year = a || '0000';
		const key = `${year}-${mes}`;
		if (!grupos[key]) grupos[key] = { items: [], ingresos: 0, salidas: 0, year, month: mes };
		const ingreso = Number(r.ingreso) || 0;
		const salida = Number(r.salida) || 0;
		grupos[key].items.push(r);
		grupos[key].ingresos += ingreso;
		grupos[key].salidas += salida;
	});

	// ordenar keys descendente (reciente primero)
	const keys = Object.keys(grupos).sort((a, b) => b.localeCompare(a));
	const html = keys.map(key => {
		const g = grupos[key];
		const fechaRef = new Date(Number(g.year), Number(g.month) - 1, 1);
		const etiqueta = fechaRef.toLocaleString('es-CO', { month: 'long', year: 'numeric' });
		const subtotal = formatoCOP.format(g.ingresos - g.salidas);

		// header del grupo
		const headerHtml = `<div class="registro grupo-mes"><div class="registro-header"><div class="registro-fecha">${etiqueta} — Total: ${subtotal}</div></div></div>`;

		// items: usar el mismo markup que en vista normal para que IDs sean consistentes
		const itemsHtml = g.items.map(r => {
			const ingreso = Number(r.ingreso) || 0;
			const salida = Number(r.salida) || 0;
			const totalComputed = ingreso - salida;
			return `
				<div class="registro" id="registro-${r.id}">
					<div class="registro-header">
						<div class="registro-fecha">${r.fecha}</div>
						<div class="registro-acciones">
							<button class="boton-editar" onclick="editarRegistro(${r.id})">Editar</button>
							<button class="boton-eliminar" onclick="eliminarRegistro(${r.id})">Eliminar</button>
						</div>
					</div>
					<div class="registro-detalles">
						<div><b>Ingreso:</b> ${formatoCOP.format(ingreso)}</div>
						<div><b>Detalle Ingreso:</b> ${r.detalleIngreso || ''}</div>
						<div><b>Salida:</b> ${formatoCOP.format(salida)}</div>
						<div><b>Detalle Salida:</b> ${r.detalleSalida || ''}</div>
						<div><b>Total:</b> ${formatoCOP.format(totalComputed)}</div>
					</div>
				</div>
			`;
		}).join('');

		return headerHtml + itemsHtml;
	}).join('');

	lista.innerHTML = html;
}

// =======================================================
// 🔹 EDITAR Y ELIMINAR REGISTROS
// =======================================================
function editarRegistro(id) {
    const r = registros.find(x => x.id === id);
    if (!r) return;
    const elem = document.getElementById(`registro-${id}`);
    if (!elem) {
        // elemento no encontrado (p. ej. DOM cambiado), evitar excepción
        mostrarNotificacion('Elemento no disponible para editar.', 'error');
        return;
    }
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
            <input type="text" id="edit-ingreso-${id}" value="${formatoCOP.format(r.ingreso)}" onfocus="quitarFormatoNumerico(event)" onblur="aplicarFormatoNumerico(event)">
            <input type="text" id="edit-detalleIngreso-${id}" value="${r.detalleIngreso || ''}">
            <input type="text" id="edit-salida-${id}" value="${formatoCOP.format(r.salida)}" onfocus="quitarFormatoNumerico(event)" onblur="aplicarFormatoNumerico(event)">
            <input type="text" id="edit-detalleSalida-${id}" value="${r.detalleSalida || ''}">
        </div>`;
}

function guardarEdicion(id) {
    // Obtener elementos de forma defensiva
    const elFecha = document.getElementById(`edit-fecha-${id}`);
    const elIngreso = document.getElementById(`edit-ingreso-${id}`);
    const elSalida = document.getElementById(`edit-salida-${id}`);
    const elDetI = document.getElementById(`edit-detalleIngreso-${id}`);
    const elDetS = document.getElementById(`edit-detalleSalida-${id}`);

    if (!elFecha || !elIngreso || !elSalida || !elDetI || !elDetS) {
        mostrarNotificacion('Campos de edición no disponibles. Intenta refrescar la lista.', 'error');
        aplicarFiltros();
        return;
    }

    const f = elFecha.value.trim();
    const i = parseNumberFromInput(elIngreso.value);
    const s = parseNumberFromInput(elSalida.value);
    const dI = elDetI.value.trim();
    const dS = elDetS.value.trim();

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

// =======================================================
// 🔹 FUNCIÓN: Mostrar/ocultar pantallas (navegación)
// - enfoque automático en pantalla de ingreso
// =======================================================
function mostrarPantalla(nombre) {
    // Quita la clase activa de todas las pantallas
    document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('activa'));
    // Activa la pantalla solicitada si existe
    const destino = document.getElementById(nombre);
    if (!destino) return;
    destino.classList.add('activa');
    // Si se muestra la pantalla de registros, renderiza los registros y totales
    if (nombre === 'registros') {
        aplicarFiltros();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // Si se muestra la pantalla de ingresar, actualiza el total en tiempo real y enfoca fecha
    if (nombre === 'ingresar') {
        actualizarTotal();
        const fechaElem = document.getElementById('fecha');
        if (fechaElem) fechaElem.focus();
    }
}