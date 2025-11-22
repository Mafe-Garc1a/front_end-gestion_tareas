
import { request } from './apiClient.js';

export const ventaService = {
    getVentas: () => {
        // const userString = localStorage.getItem('user');
        // if (!userString) {
        //     return Promise.reject(new Error('Información de usuario no encontrada.'));
        // }
        // const user = JSON.parse(userString);
        
        // ejemplo de lo que se puede hacer con datos almacenados
        // if (user.id_rol != 1){
        //     if (user.id_rol != 2){
        //         alert("no tiene permisos");
        //         // redirigir a otro lado
        //     };
        // };
        
        const endpoint = `/ventas/all-ventas`;
        
        // La lógica es mucho más simple ahora, solo llamamos a nuestro cliente central.
        return request(endpoint);
    },
    
    /**
     * Obtener una venta por su id.
     * @param {string} ventaId - Id de la venta a buscar.
     * @returns {Promise<object>}
    */
    getVentaById: (ventaId) => {
        // Construimos la URL con el parámetro ?venta_id=
        const endpoint = `/ventas/by-id?venta_id=${ventaId}`;
        return request(endpoint);
    },

    /**
     * Actualizar un usuario.
     * @param {string | number} ventaId - El ID de la venta a actualizar.
     * @param {object} ventaData - Los nuevos datos del usuario.
     * @returns {Promise<object>}
    */
    updateVenta: (ventaId, ventaData) => {
        return request(`/ventas/by-id/${ventaId}`, {
        method: 'PUT',
        body: JSON.stringify(ventaData),
        });
    },

    // Cancelar una venta
    /**
     * Modifica el estado de una venta (para cancelarla).
     * @param {string | number} ventaId - El ID de la venta que va a cancelar.
     * @returns {Promise<object>}
     */
    cambiarEstado: (ventaId, newStatus) => {
        // Nuestro apiClient se encargará de añadir el token de autorización.
        return request(`/ventas/cambiar-estado/${ventaId}?nuevo_estado=${newStatus}`, {
        method: 'PUT',
        });
    },

    /**
     * Crear uma venta.
     * @param {object} ventaData - Los nuevos datos de la venta.
     * @returns {Promise<object>}
    */
    createVenta: (ventaData) => {
        return request(`/ventas/crear`, {
        method: 'POST',
        body: JSON.stringify(ventaData),
        });
    },

    getDetallesVenta: (id_venta)=>{
        const endpoint = `/ventas/all-detalles-by-id?venta_id=${id_venta}`; 
        return request(endpoint); 
    },

    // Aquí podrías añadir más servicios
    getMetodosPago: () => {
        const endpoint = `/metodo_pago/all-metodosPago`;
        return request(endpoint);
    },

    
};