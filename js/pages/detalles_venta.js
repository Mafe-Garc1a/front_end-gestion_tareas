import { loadContent } from "../main.js";
import { detalleVentaService } from '../api/detalle_venta.service.js';

let modalInstance = null; // Guardará la instancia del modal de Bootstrap
let createModalInstance = null;
let originalMail = null;

let detallesVenta = [];
let idVentaReciente = null; 
let ventaDataGlobal = null;
function obtenerDatosVenta() {
    try {
        const ventaData = localStorage.getItem('data_venta');
        if (ventaData) {
            const data = JSON.parse(ventaData);
            console.log("Datos de venta recuperados:", data);
            idVentaReciente = data.id_venta;
            ventaDataGlobal = data;
            return data;
        }
        return null;
    } catch (error) {
        console.error("Error al obtener datos de venta:", error);
        return null;
    }
}

// Función para mostrar la información de la venta
function mostrarInformacionVenta(ventaData) {
    const container = document.getElementById('venta-info-container');
   
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
            <p class="mb-0 form-control-sm border-secondary border shadow-sm bg-white bg-light">${ventaData.nombre_usuario}</p>
        </div>
        <div class="d-flex flex-column">
            <label class="form-label fw-semibold mb-1">Fecha</label>
            <p class="mb-0 form-control-sm border-secondary border shadow-sm bg-white bg-light">${fecha}</p>
        </div>
        <div class="d-flex flex-column">
            <label class="form-label fw-semibold mb-1">Método de Pago</label>
            <p class="mb-0 form-control-sm border-secondary border shadow-sm bg-white bg-light">${ventaData.metodo_pago}</p>
        </div>
        <div class="d-flex flex-column">
            <label class="form-label fw-semibold mb-1">ID Venta</label>
            <p class="mb-0 form-control-sm border-secondary border shadow-sm bg-white bg-light">#${ventaData.id_venta}</p>
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
}

const tableBody = document.getElementById('detalles-table-body');

function createDetalles() {
    const botonAgregar = document.getElementById('createDetalle'); 
    botonAgregar.addEventListener('click', async function(event){
        console.log('Si, soy el botón AJAJAJAJ'); 
        
        const idProducto = document.getElementById('productos_select');
        const cantidad = document.getElementById('cantidad').value;
        const valorDescuento = document.getElementById('descuento').value || 0;
        const precioVenta = document.getElementById('precio_unitario').value;
        const selectDetalle = document.getElementById('tipo_producto').value;

        //capturo valores especifocs del select de productos: 
        let nombre_producto_seleccionado = idProducto.options[idProducto.selectedIndex].dataset.nombre;
        
        
        if(idProducto == "" || cantidad == "" || precioVenta == ""){
            console.log('._., ciego');
            return;
        }

        if (cantidad <= 0 || valorDescuento < 0 || precioVenta <= 0){
            console.log('¿Y los numeros me los imagino o q?');
            return;
        }

        let descuentoPesos = (precioVenta * valorDescuento)/100; 
        const detallesData = {
            id_producto: idProducto.value,
            cantidad: cantidad,
            id_venta: idVentaReciente, 
            valor_descuento: descuentoPesos,
            precio_venta: precioVenta
        };
        const swalWithBootstrapButtonsCreateDetalle = Swal.mixin({
            customClass: {
                confirmButton: "btn btn-success ms-2",
                cancelButton: "btn btn-danger"
            },
            buttonsStyling: false
        });
        try {
            botonAgregar.disabled = true;
            botonAgregar.textContent = 'Agregando...';
            
            if(selectDetalle === '1'){
                await detalleVentaService.createDetalleHuevos(detallesData); 
                console.log('Detalle Huevo creado exitosamente');
            }else if (selectDetalle === "2"){ 
                await detalleVentaService.createDetalleSalvamento(detallesData); 
                console.log('Detalle Salvamento creado exitosamente');
            }
            
            imprimirDetalles()
            document.getElementById('productos_select').value = "";
            document.getElementById('cantidad').value = "";
            document.getElementById('descuento').value = "";
            document.getElementById('precio_unitario').value = "";
        } catch (error) {
            console.error("Error:", error);
            alert('Error al agregar el producto: ' + error.message);
            await swalWithBootstrapButtonsCreateDetalle.fire({
                title: "Error",
                text: error,
                icon: "error"
            });

        } finally {
            botonAgregar.disabled = false;
            botonAgregar.textContent = 'Agregar Producto';
        }
    });
}

async function imprimirDetalles(){
    const tableBody = document.getElementById('detalles-table-body');
    tableBody.innerHTML = '';

    let detalles = await detalleVentaService.getDettallesVenta(idVentaReciente);
    
    detalles.forEach(element => {
        const fila = document.createElement('tr');

        const colTipo = document.createElement('td');
        colTipo.textContent = element.tipo;

        const colProducto = document.createElement('td');
        colProducto.textContent = element.descripcion;

        const colCantidad = document.createElement('td');
        colCantidad.textContent = element.cantidad;

        const colPrecio = document.createElement('td');
        colPrecio.textContent = `$${parseFloat(element.precio_venta).toFixed(2)}`;

        const colDescuento = document.createElement('td');
        colDescuento.textContent = element.valor_descuento;

        const colAcciones = document.createElement('td');
        
        const botonEdit = document.createElement('button');
        botonEdit.classList.add('btn', 'btn-success', 'btn-sm', 'btn-edit-detalle');
        botonEdit.setAttribute('data-id-producto', element.id_producto);
        botonEdit.setAttribute('data-tipo-producto', element.tipo);
        botonEdit.setAttribute('data-detalle-id', element.id_detalle);
        botonEdit.innerHTML = '<i class="fa fa-pen me-0"></i>';

        const botonDelete = document.createElement('button');
        botonDelete.classList.add('btn', 'btn-secondary', 'btn-sm', 'ms-2', 'btn-delete-detalle');
        botonDelete.setAttribute('data-tipo-producto', element.tipo);
        botonDelete.setAttribute('data-detalle-id', element.id_detalle);
        botonDelete.innerHTML = '<i class="fa fa-trash me-0">';

        colAcciones.appendChild(botonEdit);
        colAcciones.appendChild(botonDelete);
        
        fila.appendChild(colTipo);
        fila.appendChild(colProducto);
        fila.appendChild(colCantidad);
        fila.appendChild(colPrecio);
        fila.appendChild(colDescuento);
        fila.appendChild(colAcciones);
        
        tableBody.appendChild(fila);
    });
    calcularTotal(detalles)
}

function calcularTotal(detalles){
    let totalVenta = 0;
    let totalDescuento = 0;
    detalles.forEach(producto => {
        let subtotal = (producto.precio_venta - producto.valor_descuento) * producto.cantidad;
        totalVenta += subtotal;
        totalDescuento += producto.valor_descuento * producto.cantidad;
    });
    const descuentoElement = document.getElementById('total-descuento');
    descuentoElement.textContent = `$${totalDescuento.toLocaleString('es-CO')}`;

    const totalElement = document.getElementById('total-venta');
    totalElement.textContent = `$${totalVenta.toLocaleString('es-CO')}`;
}

//Modales update

async function handleTableClick(event) {
  // Manejador para el botón de editar
    const editButton = event.target.closest('.btn-edit-detalle');
    if (editButton) {
        const id = editButton.dataset.detalleId;
        let tipo_product_edit = editButton.dataset.tipoProducto;
        let id_producto = editButton.dataset.idProducto;

        console.log(`Edit detalle with id: ${id}`);
        openEditModal(id, tipo_product_edit, id_producto);
        return;
    }
    const deleteButton = event.target.closest('.btn-delete-detalle');
    if(deleteButton){
        let tipo_producto_delete = deleteButton.dataset.tipoProducto;
        let id_detalle_delete = deleteButton.dataset.detalleId;

        if (confirm(`¿Estás seguro de que deseas eliminar este detalle?`)) {
            try {
                await detalleVentaService.deleteDetalle(id_detalle_delete, tipo_producto_delete);
                alert(`Detalle eliminado correctamente`);
                imprimirDetalles()
            } catch (error) {
                console.error(`Error al eliminar el detalle ${id_detalle_delete}:`, error);
                alert(`No se pudo eliminar el detalle.`);
                // Revertir el switch si hay error
            }
        }
    }
}

async function openEditModal(id, tipo_product, id_producto) {
  const modalElement = document.getElementById('edit-detalle-modal');
    if (!modalInstance) {
        modalInstance = new bootstrap.Modal(modalElement);
    }
    try {
        const select_edit = document.getElementById("select-edit-producto");


        const detalle = await detalleVentaService.getDetalleVenta(id, tipo_product);
        let productos_select_edit;
        if(tipo_product == 'huevos'){
            productos_select_edit = await detalleVentaService.getProductosStock()
        }else if(tipo_product == 'salvamento'){
            productos_select_edit = await detalleVentaService.getProductosSalvamento()

        }
        
        
        select_edit.innerHTML = '';
        productos_select_edit.forEach(element => {
            const option_edit = document.createElement("option");
            option_edit.value =  tipo_product == 'huevos' ? element.id_producto : element.id_salvamento;
            option_edit.dataset.tipoProducto = tipo_product;
            option_edit.textContent = tipo_product == 'huevos' ? `Huevo ${element.color} ${element.tamanio} ${element.unidad_medida}` : element.raza;

            select_edit.appendChild(option_edit);

        });
        select_edit.value = id_producto;

        const input_edit_cantidad = document.getElementById("edit-cantidad");
        const input_edit_descuento = document.getElementById("edit-descuento");
        const input_edit_precio_unitario = document.getElementById("edit-precio_unitario");
        const input_id_detalle_edit = document.getElementById("edit-detalle-id");

        console.log("acaaaaaaa", detalle);
        input_edit_cantidad.value = detalle.cantidad;
        input_edit_descuento.value = detalle.valor_descuento;
        input_edit_precio_unitario.value = detalle.precio_venta;
        input_id_detalle_edit.value = detalle.id_detalle;

        console.log("aqui: ", detalle)
        modalInstance.show();
    } catch (error) {
        console.error(`Error al obtener datos del usuario ${id}:`, error);
        alert('No se pudieron cargar los datos del usuario.');
    }
}

async function handleUpdateSubmit(event) {
  event.preventDefault();
  const detalleId = document.getElementById('edit-detalle-id').value;
  const selectProductoEdit = document.getElementById('select-edit-producto');
  
  const selectedOption = selectProductoEdit.options[selectProductoEdit.selectedIndex];
  
  const tipoProducto = selectedOption.dataset.tipoProducto;
  const updatedData = {
    id_producto: document.getElementById('select-edit-producto').value,
    cantidad: document.getElementById('edit-cantidad').value,
    valor_descuento: document.getElementById('edit-descuento').value,
    precio_venta : document.getElementById('edit-precio_unitario').value
  };

  try {
    await detalleVentaService.updateDetalle(detalleId, updatedData, tipoProducto);
    modalInstance.hide();
    await imprimirDetalles(); // Recargamos la tabla para ver los cambios
  } catch (error) {
    console.error(`Error al actualizar el usuario ${detalleId}:`, error);
    alert('No se pudo actualizar el usuario.');
  }
}


//funcion para inicializar
export const init = () => {
    console.log('****************');
    console.log("Módulo de detalles inicializado");
    const ventaData = obtenerDatosVenta(); 

    if (idVentaReciente) {
        console.log(`Trabajando con venta ID: ${idVentaReciente}`);
        console.log("Estos son sus datos:", ventaData); 

        mostrarInformacionVenta(ventaData);

        // configurarBotonEditar(); 

    } else {
        console.log("No se encontró data de venta");
        alert("Error: No se encontró información de la venta");
    }

    const selectDetalle = document.getElementById('tipo_producto');
    const productos_select = document.getElementById('productos_select');

    // Función para cargar productos basado en el tipo
    async function cargarProductos(typeDetalle) {
        productos_select.innerHTML = '<option value="">Selecciona producto</option>';
        
        if (typeDetalle === "1"){
            try {
                const productos = await detalleVentaService.getProductosStock();
                console.log("Productos:", productos);

                productos.forEach(producto => {
                    const opcion = document.createElement('option');
                    opcion.value = producto.id_producto;
                    opcion.textContent = `Huevo ${producto.color}-${producto.tamanio}-${producto.unidad_medida}`;
                    opcion.dataset.nombre = `Huevo ${producto.color}-${producto.tamanio}-${producto.unidad_medida}`;
                    productos_select.appendChild(opcion); 
                });
            } catch (error) {
                console.error("Error:", error);
            }  
        } else if (typeDetalle === "2") {
            try {
                const productos = await detalleVentaService.getProductosSalvamento();
                console.log("Productos", productos);
                
                productos.forEach(producto => {
                    const opcion = document.createElement('option');
                    opcion.value = producto.id_salvamento;
                    opcion.textContent = producto.raza;
                    opcion.dataset.nombre = producto.raza;
                    productos_select.appendChild(opcion); 
                });
            } catch (error) {
                console.error("Error:", error);
            }  
        }
    }

    // Event listener para cuando cambie el tipo
    selectDetalle.addEventListener('change', async function(event){
        let typeDetalle = event.target.value; 
        console.log(typeDetalle); 
        await cargarProductos(typeDetalle);
    });

    // Cargar productos de huevos automáticamente al iniciar
    cargarProductos('1'); // '1' es el valor para Huevos
    const editForm = document.getElementById('edit-detalle-form');


    createDetalles();  
    tableBody.removeEventListener('click', handleTableClick);
    tableBody.addEventListener('click', handleTableClick);
    editForm.removeEventListener('submit', handleUpdateSubmit);
    editForm.addEventListener('submit', handleUpdateSubmit);

    const button_guardar_venta = document.getElementById("guardar_venta");
    
    if (button_guardar_venta) {
        button_guardar_venta.addEventListener("click", (event) => {
            event.preventDefault();
            console.log("¡Botón de venta clickeado!");
            
            // limpiar el localStorage
            // localStorage.clear(); 
            
            // console.log("LocalStorage limpiado");
           Swal.fire({
                icon: 'success',
                title: 'Venta guardada con exito',
                text: 'Detalles añadidos exitosamente'
            });
            const pageToLoad = button_guardar_venta.dataset.page;
            console.log(`Navegando a: ${pageToLoad}`);
            
            // Usar la función de navegación
            loadContent(pageToLoad);
        });
    }
};
