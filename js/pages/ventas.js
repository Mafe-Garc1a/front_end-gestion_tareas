import { ventaService } from "../api/venta.service.js";
import {loadContent} from "../main.js";

let modalInstance = null; // Guardará la instancia del modal de Bootstrap
let createModalInstance = null; // Guardará la instancia del modal de Bootstrap
let originalMail = null;

function createVentaRow(venta) {
  const fecha = new Date(venta.fecha_hora);
  const fechaFormateada = fecha.toLocaleString('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
    hour12: true
  });

    const statusBadge = venta.estado
        ? `<span class="badge bg-success">Activo</span>`
        : `<span class="badge bg-danger">Inactivo</span>`;

    return `
        <tr>
            <td class="cell">${venta.id_venta}</td>
            <td class="cell">${fechaFormateada}</td>
            <td class="cell">${venta.nombre_usuario}</td>
            <td class="cell">${venta.metodo_pago}</td>
            <td class="cell">${venta.total}</td>
            <td class="cell">
                <div class="form-check form-switch d-inline-block">
                    <input class="form-check-input venta-status-switch" type="checkbox" role="switch" 
                            id="switch-${venta.id_venta}" data-venta-id="${
                                venta.id_venta
                            }" 
                            ${venta.estado ? "checked" : ""}>
                </div>
            </td>
            <td class="cell d-flex justify-content-end gap-2">
              <button class="btn btn-success btn-sm btn-edit-venta me-1" data-venta-id="${venta.id_venta}" aria-label="Editar">
                <i class="fa-regular fa-pen-to-square"></i>
              </button>
              <button class="btn btn-success btn-sm btn-detalles-venta me-1" data-venta-id="${
                    venta.id_venta}" data-page="info_venta">
                    <i class="fas fa-search"></i>
                </button>
            </td>
        </tr>
    `;
}

//______________________________paginación para todos los datos y filtrados_____________
  let fecha_actual = new Date();
  let activeFechaInicio = convertirFecha(fecha_actual);
  let activeFechaFin =  convertirFecha(fecha_actual);

async function fetchVentas(page = 1, page_size = 10, fechaInicio = "", fechaFin = "") {
  try {
    let response;
    if (fechaInicio && fechaFin) {
      response = await ventaService.getVentasByDate(fechaInicio, fechaFin, page, page_size);
    }

    if (!response || response.length === 0) {
      return [];
    }
    console.log(response);
    return response;
  } catch (error) {
    if (error.message.includes("No hay ventas en ese rango de fechas") || error.response?.status === 404) {
      return [];
    }
    throw error;
  }
}


// Modificar la función init para que pase correctamente los filtros a la paginación
function renderPagination(total_pages, currentPage = 1) {
    const container = document.querySelector("#pagination");
    if (!container) return;

    container.innerHTML = "";

    // ---------- BOTÓN ANTERIOR ----------
    const prevLi = document.createElement("li");
    prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
    prevLi.innerHTML = `
        <a class="page-link text-success" href="#" data-page="${currentPage - 1}">
            <i class="fas fa-chevron-left"></i>
        </a>
    `;
    prevLi.addEventListener("click", () => {
        if (currentPage !== 1) {
            const prevPage = currentPage - 1;
            init(prevPage, 10, activeFechaInicio, activeFechaFin);
        }
    });
    container.appendChild(prevLi);

    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(total_pages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    // ---------- PRIMERA PÁGINA + ... ----------
    if (startPage > 1) {
        container.appendChild(createPageLi(1, currentPage));
        if (startPage > 2) container.appendChild(createDotsLi());
    }

    // ---------- NÚMEROS DE PÁGINA ----------
    for (let i = startPage; i <= endPage; i++) {
        container.appendChild(createPageLi(i, currentPage));
    }

    // ---------- ... + ÚLTIMA PÁGINA ----------
    if (endPage < total_pages) {
        if (endPage < total_pages - 1) container.appendChild(createDotsLi());
        container.appendChild(createPageLi(total_pages, currentPage));
    }

    // ---------- BOTÓN SIGUIENTE ----------
    const nextLi = document.createElement("li");
    nextLi.className = `page-item ${currentPage === total_pages ? "disabled" : ""}`;
    nextLi.innerHTML = `
        <a class="page-link text-success" href="#" data-page="${currentPage + 1}">
            <i class="fas fa-chevron-right"></i>
        </a>
    `;
    nextLi.addEventListener("click", () => {
        if (currentPage !== total_pages) {
            const nextPage = currentPage + 1;
            init(nextPage, 10, activeFechaInicio, activeFechaFin);
        }
    });
    container.appendChild(nextLi);
}

// ========== BOTÓN DE NÚMERO DE PÁGINA ==========
function createPageLi(page, currentPage) {
    const li = document.createElement("li");

    const isActive = page === currentPage;

    li.className = `page-item ${isActive ? 'active' : ''}`;
    li.innerHTML = `
        <a class="page-link ${isActive ? "bg-success border-success text-white" : "text-success"}"
           href="#" data-page="${page}">
           ${page}
        </a>
    `;

    li.addEventListener("click", () => {
        if (!isActive) {
            init(page, 10, activeFechaInicio, activeFechaFin);
        }
    });

    return li;
}

// ========== PUNTOS SUSPENSIVOS ==========
function createDotsLi() {
    const li = document.createElement("li");
    li.className = "page-item disabled";
    li.innerHTML = `<a class="page-link text-success">...</a>`;
    return li;
}


function filtrarVentas(fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) {
    Swal.fire({
      icon: 'info',
      title: 'Error',
      text: 'Debe seleccionar ambas fechas',
      confirmButtonColor: 'rgba(51, 136, 221, 1)'
    });
    return;
  }

  // Guardar fechas para usar en fetchVentas
  activeFechaInicio = fechaInicio;
  activeFechaFin = fechaFin;

  // Recargar la tabla desde la página 1 con el filtro
  init(1, 10);
}




function limpiarFiltros() {
  document.getElementById("fecha-inicio").value = "";
  document.getElementById("fecha-fin").value = "";
  init(1, 10);
}

function convertirFecha(fechaActual) {
  // dar formato a la fecha YYYY/MM/DD
  const fecha = fechaActual;
  const formato = fecha.getFullYear() + "/" +
               String(fecha.getMonth() + 1).padStart(2, '0') + "/" +
               String(fecha.getDate()).padStart(2, '0');
  return formato;
}

// --- FUNCIÓN PRINCIPAL DE INICIALIZACIÓN ---
async function init(page = 1, page_size = 10, fechaInicio = activeFechaInicio, fechaFin = activeFechaFin) {
  activeFechaInicio = fechaInicio;
  activeFechaFin =  fechaFin;

    const tableBody = document.getElementById("ventas-table-body");
    if (!tableBody) return;

    tableBody.innerHTML =
        '<tr><td colspan="7" class="text-center">Cargando ventas ... </td></tr>';

    try {
        const data = await fetchVentas(page, page_size, activeFechaInicio, activeFechaFin);
        const ventas = data.ventas || [];
        if (ventas.length > 0) {
          tableBody.innerHTML = ventas.map(createVentaRow).join("");
        } else {
          tableBody.innerHTML =
            '<tr><td colspan="7" class="text-center">No se encontraron ventas.</td></tr>';
        }

        renderPagination(data.total_pages || 1, page);
    } catch (error) {
        console.error("Error al obtener las ventas:", error);
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error al cargar los datos.</td></tr>`;
    }

    // Aplicamos el patrón remove/add para evitar listeners duplicados

    // Boton para crear venta
    const btnCreateVenta = document.getElementById("btnCreateVenta");

    // formulario para actualizar venta
    const editForm = document.getElementById("edit-venta-form");
    
    btnCreateVenta.removeEventListener("click", handleCreateVentaClick);
    btnCreateVenta.addEventListener("click", handleCreateVentaClick);

    tableBody.removeEventListener("click", handleTableClick);
    tableBody.addEventListener("click", handleTableClick);

    // para boton ver detalles
    tableBody.removeEventListener("click", handleDetallesClick);
    tableBody.addEventListener("click", handleDetallesClick);

    tableBody.removeEventListener("change", handleStatusSwitch);
    tableBody.addEventListener("change", handleStatusSwitch);

    editForm.removeEventListener("submit", handleUpdateSubmit);
    editForm.addEventListener("submit", handleUpdateSubmit);

    document.getElementById('edit-venta-modal').addEventListener('show.bs.modal', function () {
      cargarMetodosPago();  // Llamamos a la función para cargar los métodos de pago
    });

    // Botón para aplicar filtro
    document.getElementById("btn-apply-date-filter").addEventListener("click", () => {
      const fechaInicio = document.getElementById("fecha-inicio").value;
      const fechaFin = document.getElementById("fecha-fin").value;
      filtrarVentas(fechaInicio, fechaFin);
    });

    //Boton para limpiar filtros
    const btnClear = document.getElementById('btn_clear_filters');
    btnClear.removeEventListener('click', limpiarFiltros);
    btnClear.addEventListener('click', limpiarFiltros);
}

export { init };

// --- MANEJADORES DE EVENTOS ---

//  Cambiar estado
async function handleStatusSwitch(event) {
  const switchElement = event.target;

  if (!switchElement.classList.contains("venta-status-switch")) return;

  const ventaId = switchElement.dataset.ventaId;

  const previousStatus = !switchElement.checked;
  const newStatus = switchElement.checked;

  // Si la venta estaba cancelada y está intentando habilitar
  if (previousStatus === false && newStatus === true) {
    Swal.fire({
      icon: "error",
      title: "Ups...",
      text: "La venta ya fue cancelada, no se puede habilitar",
    });
    switchElement.checked = false;
    return;
  }

  // Confirmación con SweetAlert2
  const result = await Swal.fire({
    title: "¿Estás seguro de cancelar esta venta?",
    text: "Una vez cancelada no se puede revertir.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, cancelar",
    cancelButtonText: "No, volver",
    reverseButtons: true,
  });

  if (result.isConfirmed) {
    try {
      await ventaService.cambiarEstado(ventaId, false);

      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Venta cancelada con éxito",
      });

      init(); 
    } catch (error) {
      console.error("Error al cancelar venta:", error);
      Swal.fire({
        icon: "error",
        title: "Ups...",
        text: "Hubo un error al cancelar la venta",
      });

      switchElement.checked = true; // revertir el cambio
    }
  } else {
    // si el usuario cancela, revierte el switch
    switchElement.checked = true;
  }
}



// manejador para crear usuario (al dar click en el botón)
async function handleCreateVentaClick(event) {
    event.preventDefault();
    console.log("Creando nueva venta y navegando a detalles...");
    
    // Obtener datos del usuario
    let user_token_objeto = JSON.parse(localStorage.getItem('user'));
    let usuario_token = user_token_objeto.id_usuario;

    // Crear fecha/hora actual
    const fechaHoraLocal = new Date();
    const offset = fechaHoraLocal.getTimezoneOffset();
    fechaHoraLocal.setMinutes(fechaHoraLocal.getMinutes() - offset);
    const fechaHoraISO = fechaHoraLocal.toISOString();
    
    const ventaData = {
        id_usuario: usuario_token,
        fecha_hora: fechaHoraISO,
    };

    try {
        // Crear la venta en la base de datos
        const response = await ventaService.createVenta(ventaData);
        let dataVenta = response.data_venta;
        console.log("Venta creada:", dataVenta);

        // Guardar en localStorage
        localStorage.setItem('data_venta', JSON.stringify(dataVenta));
        
        Swal.fire({
          icon: 'success',
          title: "Creando venta...",
        });
        
        const pageToLoad = event.target.dataset.page;
        loadContent(pageToLoad);

        
    } catch (error) {
        console.error("Error al crear la venta:", error);
        Swal.fire({
          icon: "error",
          title: 'Ups...',
          text: "No se pudo crear la venta",
        });
    }
}
// async function handleCreateSubmit(event) {
//     event.preventDefault();

//     // obtener token y parsear
//     let user_token_objeto = JSON.parse(localStorage.getItem('user'));
    
//     //id_usuario que registra la venta
//     let usuario_token = user_token_objeto.id_usuario;


//     //fecha_hora del dispositivo que usa la aplicacion
//     const fechaHoraLocal = new Date(); // Obtener fecha y hora local
    
//     const offset = fechaHoraLocal.getTimezoneOffset(); // Obtener el desplazamiento de la zona horaria local en minutos
    
//     fechaHoraLocal.setMinutes(fechaHoraLocal.getMinutes() - offset); // Ajustar la fecha para la zona horaria local (sumar el offset)
    
//     const fechaHoraISO = fechaHoraLocal.toISOString(); // Convertir a formato ISO
//     console.log(fechaHoraISO);
    
//     const ventaData = {
//         id_usuario: usuario_token,
//         fecha_hora: fechaHoraISO,
//     };

//     try {
//         const response = await ventaService.createVenta(ventaData);
//         let dataVenta = response.data_venta
//         console.log("dataVenta", dataVenta);

//         // guardar en el localstorage convertido a string
//         localStorage.setItem('data_venta', JSON.stringify(dataVenta));
        
//         if (createModalInstance) createModalInstance.hide();
//         document.getElementById("create-venta-form").reset(); // Limpiamos el formulario
//         alert("Venta creada exitosamente.");
//         init(); // Recargamos la tabla para ver la nueva venta
//     } catch (error) {
//         console.error("Error al crear la venta:", error);
//         alert("No se pudo crear la venta.");
//     }
// }


async function handleTableClick(event) {
  // Manejador para el botón de editar
  const editButton = event.target.closest(".btn-edit-venta");
  if (editButton) {
    const ventaId = editButton.dataset.ventaId;
    console.log(`Edita la venta: ${ventaId}`);
    openEditModal(ventaId);
    return;
  }
}

async function handleDetallesClick(event) {
  // Manejador para el botón de ver detalles
  const detallesButton = event.target.closest(".btn-detalles-venta");
  if (detallesButton) {
    const ventaId = detallesButton.dataset.ventaId;

    localStorage.setItem('id_venta_ver', JSON.stringify(ventaId));
    
    console.log(`Ver detalles de la venta: ${ventaId}`);

    const pageToLoad = detallesButton.dataset.page;
    loadContent(pageToLoad);
  }
}

async function openEditModal(ventaId) {
  // Manejador para abrir modal editar con datos
    const modalElement = document.getElementById('edit-venta-modal');
    if (modalElement) {
      modalInstance = new bootstrap.Modal(modalElement);
    }

    try {
        const venta = await ventaService.getVentaById(ventaId);
        
        document.getElementById('edit-venta-id').value = venta.id_venta;
        document.getElementById('edit-tipo-pago').value = venta.metodo_pago;

        modalInstance.show();
    } catch (error) {
        console.error(`Error al obtener datos de la venta ${ventaId}:`, error);
        Swal.fire({
          icon: "error",
          title: 'Ups...',
          text: "Error al cargar datos de la venta.",
        });
    }
}


async function handleUpdateSubmit(event) {
  // manejador de formulario para actualizar venta (enviar informacion)
  event.preventDefault();
  const ventaId = document.getElementById('edit-venta-id').value
  const ventaData = {
    tipo_pago: document.getElementById('edit-tipo-pago').value,
  };

  try {
    await ventaService.updateVenta(ventaId, ventaData);
    modalInstance.hide();
    Swal.fire({
      icon: 'success',
      title: "Exito",
      text: "Venta actualizada exitosamente.",
    });
    init(); // Recargamos la tabla para ver los cambios
  } catch (error) {
    console.error(`Error al actualizar la venta ${ventaId}:`, error);
    Swal.fire({
      icon: "error",
      title: 'Ups...',
      text: "Error al actualizar venta.",
    });
  }
}


async function cargarMetodosPago() {
  try {
    const metodosPago = await ventaService.getMetodosPago();
    console.log(metodosPago);

    const selectTipoPago = document.getElementById('edit-tipo-pago');

    selectTipoPago.innerHTML = '';

    if (Array.isArray(metodosPago)) {

    const activos = metodosPago.filter(m => m.estado === true);

    if (activos.length === 0) {
      selectTipoPago.innerHTML = '<option disabled>No hay métodos de pago activos</option>';
      return;
    }

      // Insertar solo los activos
        activos.forEach(metodo => {
        const option = document.createElement('option');
        option.value = metodo.id_tipo;
        option.textContent = metodo.nombre;
        selectTipoPago.appendChild(option);
      });
    } else {
      // Si no hay métodos de pago disponibles, mostramos un mensaje
      selectTipoPago.innerHTML += '<option disabled>No se encontraron métodos de pago</option>';
    };

  } catch (error) {
    console.error('Error al cargar los métodos de pago:', error);
    Swal.fire({
      icon: "error",
      title: 'Ups...',
      text: "Error al cargar los métodos de pago.",
    });
  }
};


// Export: manejar clicks en el dropdown (CSV / Excel)
//   const pageUtilities = document.querySelector(".page-utilities");
//   if (pageUtilities) {
//     pageUtilities.removeEventListener("click", handleExportClick);
//     pageUtilities.addEventListener("click", handleExportClick);
//   }

// function convertToCSV(rows, columns) {
//   const escapeCell = (val) => {
//     if (val === null || val === undefined) return "";
//     const s = String(val);
//     // Escape quotes
//     return `"${s.replace(/"/g, '""')}"`;
//   };

//   const header = columns.map((c) => escapeCell(c.header)).join(",");
//   const body = rows
//     .map((row) =>
//       columns
//         .map((c) => {
//           const v = typeof c.key === "function" ? c.key(row) : row[c.key];
//           return escapeCell(v);
//         })
//         .join(",")
//     )
//     .join("\n");
//   return `${header}\n${body}`;
// }

// function downloadBlob(content, mimeType, filename) {
//   const blob = new Blob([content], { type: mimeType });
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = filename;
//   document.body.appendChild(a);
//   a.click();
//   a.remove();
//   URL.revokeObjectURL(url);
// }

// function exportToCSV(data, filename = "ventas.csv") {
//   const columns = [
//     { header: "ID", key: "id_venta" },
//     { header: "fecha_hora", key: "fecha_hora" },
//     { header: "nombre_usuario", key: "nombre_usuario" },
//     { header: "metodo_pago", key: "metodo_pago" },
//     { header: "total", key: "total" },
//     { header: "Estado", key: (r) => (r.estado ? "Activo" : "Inactivo") },
//   ];
//   const csv = convertToCSV(data, columns);
//   downloadBlob(csv, "text/csv;charset=utf-8;", filename);
// }

// async function exportToExcel(data, filename = "ventas.xlsx") {
//   // Intentar usar SheetJS (XLSX) para crear un .xlsx real en el navegador.
//   // Si no está cargado, lo cargamos dinámicamente desde CDN.
//   const loadSheetJS = () =>
//     new Promise((resolve, reject) => {
//       if (window.XLSX) return resolve(window.XLSX);
//       const script = document.createElement("script");
//       script.src =
//         "https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js";
//       script.onload = () => resolve(window.XLSX);
//       script.onerror = (e) => reject(new Error("No se pudo cargar SheetJS"));
//       document.head.appendChild(script);
//     });

//   try {
//     await loadSheetJS();
//   } catch (err) {
//     console.warn(
//       "SheetJS no disponible, se usará exportación CSV en su lugar",
//       err
//     );
//     // Fallback al CSV con extensión xlsx si falla la carga
//     exportToCSV(data, filename.replace(/\.xlsx?$/, ".csv"));
//     return;
//   }

//   // Mapear datos a objetos planos para json_to_sheet
//   const rows = data.map((r) => ({
//     ID: r.id_venta,
//     fecha_hora: r.fecha_hora,
//     vendedor: r.nombre_usuario,
//     metodo_pago: r.metodo_pago,
//     Total: r.total,
//     estado: r.estado ? "Activo" : "Inactivo",
//   }));

//   const ws = XLSX.utils.json_to_sheet(rows);
//   const wb = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(wb, ws, "Ventas");

//   try {
//     XLSX.writeFile(wb, filename);
//   } catch (e) {
//     // Algunos navegadores / entornos pueden requerir otra ruta: crear blob desde write
//     try {
//       const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
//       const blob = new Blob([wbout], { type: "application/octet-stream" });
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = filename;
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       URL.revokeObjectURL(url);
//     } catch (err) {
//       console.error("No se pudo generar el archivo .xlsx:", err);
//       Swal.fire({
//         title: "Error al generar .xlsx",
//         text: err.message || String(err),
//         icon: "error",
//       });
//     }
//   }
// }

// function handleExportClick(event) {
//   const item = event.target.closest(".export-format");
//   if (!item) return;
//   event.preventDefault();
//   const fmt = item.dataset.format;
//   const dateTag = new Date().toISOString().slice(0, 10);
//   const data = filteredLands && filteredLands.length ? filteredLands : allLands;
//   if (!data || data.length === 0) {
//     Swal.fire({ title: "No hay datos para exportar.", icon: "info" });
//     return;
//   }

//   if (fmt === "csv") {
//     exportToCSV(data, `ventas_${dateTag}.csv`);
//   } else if (fmt === "excel") {
//     exportToExcel(data, `ventas_${dateTag}.xls`); 
//   }
// }
//end export
