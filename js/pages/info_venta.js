import { ventaService } from "../api/venta.service.js";
import {loadContent} from "../main.js";

let modalInstance = null; // Guardará la instancia del modal de Bootstrap
let createModalInstance = null;
let originalMail = null;


let idVentaVer = null;

async function obtenerDatosVenta(idVentaVer) {
    const container = document.getElementById("info-venta-container");
    if (!container) return;
    container.innerHTML = `
        <div class="col-12 text-center">
            <p class="text-danger">Cargando informacion de la venta</p>
        </div>
    `;
    
    try {
        const ventaData = await ventaService.getVentaById(idVentaVer);
        if (ventaData) {
            console.log(ventaData);
            mostrarInformacionVenta(ventaData);
        } else {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-danger">No se encontró información de la venta</p>
                </div>
            `;
        }
    } catch (error) {
        console.error("Error al obtener la venta:", error);
        container.innerHTML = `
            <div class="col-12 text-center">
                <p class="text-danger">Error al cargar los datos de la venta</p>
            </div>
        `;
    }
}


// Función para mostrar la información de la venta
function mostrarInformacionVenta(ventaData) {
    const container = document.getElementById('info-venta-container');
   
    if (!ventaData) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <p class="text-danger">No se encontró información de la venta</p>
            </div>
        `;
        return;
    }

    // Formatear la fecha (si viene en formato ISO)
    const fecha = ventaData.fecha_hora ? 
        new Date(ventaData.fecha_hora).toLocaleDateString('es-ES') : 
        'Fecha no disponible';

    container.innerHTML = `
        <div class="d-flex flex-column">
            <label class="form-label fw-semibold mb-1">Vendedor</label>
            <p class="mb-0 form-control bg-light">${ventaData.nombre_usuario}</p>
        </div>
        <div class="d-flex flex-column">
            <label class="form-label fw-semibold mb-1">Fecha</label>
            <p class="mb-0 form-control bg-light">${fecha}</p>
        </div>
        <div class="d-flex flex-column">
            <label class="form-label fw-semibold mb-1">Método de Pago</label>
            <p class="mb-0 form-control bg-light">${ventaData.metodo_pago}</p>
        </div>
        <div class="d-flex flex-column">
            <label class="form-label fw-semibold mb-1">ID Venta</label>
            <p class="mb-0 form-control bg-light">#${ventaData.id_venta}</p>
        </div>
        <!-- 
        <div class="d-flex flex-column justify-content-end">
            <label class="form-label fw-semibold mb-1">Acciones</label>
            <button class="btn btn-primary btn-edit-venta-detalles" 
                    data-venta-id="${ventaData.id_venta}">
                <i class="fa-regular fa-pen-to-square me-1"></i>
                Editar
            </button>
        </div>
        -->
    `;
    imprimirDetalles();
}

async function imprimirDetalles() {
    const tableBody = document.getElementById('info-venta-table-body');

    tableBody.innerHTML =
        '<tr><td colspan="7" class="text-center">Cargando detalles ...</td></tr>';

    let detalles;

    try {
        detalles = await ventaService.getDetallesVenta(idVentaVer);
    } catch (err) {
        console.warn("Error desde API:", err.message);

        tableBody.innerHTML =
            `<tr><td colspan="7" class="text-center">${err.message}</td></tr>`;
        
        const descuentoElement = document.getElementById('tot-descuento');
        const totalElement = document.getElementById('tot-venta');
        
        descuentoElement.textContent = `$${(0).toLocaleString('es-CO')}`;
        totalElement.textContent = `$${(0).toLocaleString('es-CO')}`;
        return;
    }

    if (!detalles || !Array.isArray(detalles) || detalles.length === 0) {
        tableBody.innerHTML =
            '<tr><td colspan="7" class="text-center">No hay detalles para esta venta</td></tr>';
        return;
    }

    // limpiar tabla
    tableBody.innerHTML = "";

    detalles.forEach(element => {
        const fila = document.createElement('tr');

        let cant_producto = element.cantidad;
        let precio_producto = parseFloat(element.precio_venta);
        let descuento = parseFloat(element.valor_descuento);
        let subtotal = (precio_producto - descuento) * cant_producto

        fila.innerHTML = `
        
            <td>${element.tipo}</td>
            <td>${element.descripcion}</td>
            <td>${cant_producto}</td>
            <td>$${precio_producto.toFixed(2)}</td>
            <td>$${descuento.toFixed(2)}</td>
            <td>$${subtotal.toFixed(2)}</td>
        `;

        tableBody.appendChild(fila);
    });

    calcularTotal(detalles);
}

function calcularTotal(detalles){
    let totalVenta = 0;
    let totalDescuento = 0;
    detalles.forEach(producto => {
        let subtotal = (producto.precio_venta - producto.valor_descuento) * producto.cantidad;
        totalVenta += subtotal;
        totalDescuento += producto.valor_descuento * producto.cantidad;
    });
    const descuentoElement = document.getElementById('tot-descuento');
    descuentoElement.textContent = `$${totalDescuento.toLocaleString('es-CO')}`;

    const totalElement = document.getElementById('tot-venta');
    totalElement.textContent = `$${totalVenta.toLocaleString('es-CO')}`;
}


//funcion para inicializar
async function init() {
    console.log('****************');
    console.log("Módulo de info inicializado");

    idVentaVer = JSON.parse(localStorage.getItem('id_venta_ver'));   

    if (!idVentaVer) {
        console.log("No se encontró data de venta");
        alert("Error: No se encontró información de la venta");
        return;

    } else {
        console.log(`Trabajando con venta ID: ${idVentaVer}`);
        obtenerDatosVenta(idVentaVer);
    }

    const boton_atras = document.getElementById("btn-volver");
    
    
    if (boton_atras) {
        boton_atras.addEventListener("click", (event) => {
            event.preventDefault();
            console.log("¡Botón volver clickeado!");
            
            localStorage.removeItem('id_venta_ver');
            const pageToLoad = boton_atras.dataset.page;
            console.log(`Navegando a: ${pageToLoad}`);
            
            // Usar la función de navegación
            loadContent(pageToLoad);
        });
    }
};

export { init };