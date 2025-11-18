import { ventaService } from "../api/venta.service.js";
import {loadContent} from "../main.js";

let modalInstance = null; // Guardará la instancia del modal de Bootstrap
let createModalInstance = null; // Guardará la instancia del modal de Bootstrap
let originalMail = null;

function createVentaRow(venta) {
    const statusBadge = venta.estado
        ? `<span class="badge bg-success">Activo</span>`
        : `<span class="badge bg-danger">Inactivo</span>`;

    return `
        <tr>
            <td class="cell">${venta.id_venta}</td>
            <td class="cell">${venta.fecha_hora}</td>
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
            <td class="cell">
                <button class="btn btn-sm btn-info btn-edit-venta me-1" data-venta-id="${
                    venta.id_venta
                }">
                    <i class="fa-regular fa-pen-to-square"></i>
                </button>
            </td>
        </tr>
    `;
}

// --- FUNCIÓN PRINCIPAL DE INICIALIZACIÓN ---
async function init() {
    const tableBody = document.getElementById("ventas-table-body");
    if (!tableBody) return;

    tableBody.innerHTML =
        '<tr><td colspan="6" class="text-center">Cargando ventas ... </td></tr>';

    try {
        const ventas = await ventaService.getVentas();
        if (ventas && ventas.length > 0) {
        tableBody.innerHTML = ventas.map(createVentaRow).join("");
        } else {
        tableBody.innerHTML =
            '<tr><td colspan="6" class="text-center">No se encontraron ventas.</td></tr>';
        }
    } catch (error) {
        console.error("Error al obtener las ventas:", error);
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error al cargar los datos.</td></tr>`;
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

    tableBody.removeEventListener("click", handleDetallesClick);
    tableBody.addEventListener("click", handleDetallesClick);

    tableBody.removeEventListener("change", handleStatusSwitch);
    tableBody.addEventListener("change", handleStatusSwitch);

    editForm.removeEventListener("submit", handleUpdateSubmit);
    editForm.addEventListener("submit", handleUpdateSubmit);

    document.getElementById('edit-venta-modal').addEventListener('show.bs.modal', function () {
      cargarMetodosPago();  // Llamamos a la función para cargar los métodos de pago
    });

}

export { init };

// --- MANEJADORES DE EVENTOS ---

//  Cambiar estado
async function handleStatusSwitch(event) {
    // casos:
    // Activa a cancelada (Permitir)
    // Cancelada a activa (No permitir)

    const switchElement = event.target;

    if (!switchElement.classList.contains("venta-status-switch")) return;

    const ventaId = switchElement.dataset.ventaId;

    const previousStatus = !switchElement.checked;
    const newStatus = switchElement.checked;

    // Si la venta YA estaba cancelada antes del clic
    if (previousStatus === false && newStatus === true) {
        alert("La venta ya fue cancelada, no se puede habilitar");

        switchElement.checked = false;
        return;
    }

    if (
        confirm(
        "¿Estás seguro de que deseas cancelar esta venta? No se puede revertir la acción"
        )
    ) {
        try {
        await ventaService.cambiarEstado(ventaId, false);
        alert("La venta ha sido cancelada exitosamente.");
        init();
        } catch (error) {
        console.error("Error al cancelar venta:", error);
        alert("No se pudo cancelar la venta.");
        switchElement.checked = true; // revertir el cambio
        }
    } else {
        switchElement.checked = true;
    }
}

// Manejador para el botón de crear (abrir el modal)
// async function handleModalCreate(event) {
//   event.preventDefault();

//   const createModalElement = document.getElementById("create-venta-modal");
//   if (createModalElement) {
//     createModalInstance = new bootstrap.Modal(createModalElement);
//     createModalInstance.show();
//   }
// }


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
        
        alert("Venta creada exitosamente.");
        
        const pageToLoad = event.target.dataset.page;
        loadContent(pageToLoad);

        
    } catch (error) {
        console.error("Error al crear la venta:", error);
        alert("No se pudo crear la venta.");
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
  // Manejador para el botón de editar
  const detallesButton = event.target.closest(".btn-detalles-venta");
  if (detallesButton) {
    const ventaId = detallesButton.dataset.ventaId;
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
        alert('No se pudieron cargar los datos de la venta.');
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
    alert("Venta actualizada exitosamente.");
    init(); // Recargamos la tabla para ver los cambios
  } catch (error) {
    console.error(`Error al actualizar la venta ${ventaId}:`, error);
    alert("No se pudo actualizar la venta.");
  }
}


async function cargarMetodosPago() {
  try {
    const metodosPago = await ventaService.getMetodosPago();
    console.log(metodosPago);

    const selectTipoPago = document.getElementById('edit-tipo-pago');

    if (Array.isArray(metodosPago)) {
      metodosPago.forEach(metodo => {
      // Creamos un nuevo option para cada método de pago recibido


      

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
    alert('Error al cargar los métodos de pago.');
  }
};


// export const init = () => {
//     console.log('********************************************');
//     console.log("Módulo de ventas inicializado");
    
//     const button_venta = document.getElementById("button_venta");
    
//     if (button_venta) {
//         button_venta.addEventListener("click", (event) => {
//             event.preventDefault();
//             console.log("¡Botón de venta clickeado!");
            
//             const pageToLoad = button_venta.dataset.page;
//             console.log(`Navegando a: ${pageToLoad}`);
            
//             // Usar la función de navegación
//             loadContent(pageToLoad);
//         });
//     }
// };

