import { userService } from '../api/user.service.js';

let usuario = JSON.parse(localStorage.getItem("user"));
console.log("ola: ", usuario)
const contenedorNombre = document.getElementById("nombre");
const contenedorEmail = document.getElementById("email");
const contenedorTelefono = document.getElementById("telefono");
const contenedorDocumento = document.getElementById("documento");

const contenedorRol = document.getElementById("rol_usuario");
const contenedorDescripcionRol = document.getElementById("descripcion_rol_usuario");
const contenedorEstado = document.getElementById("estado_usuario");

contenedorRol.value = usuario.nombre_rol;
contenedorDescripcionRol.value = usuario.descripcion_rol;
contenedorEstado.value = usuario.estado ? "Activa" : "Desactivada";



let nombreOriginal = usuario.nombre;
let emailOriginal = usuario.email;
let telefonoOriginal = usuario.telefono;
let documentoOriginal = usuario.documento;

const botonEditarPerfil = document.getElementById("boton-editar-perfil");
const botonAceptar = document.getElementById("boton-aceptar");
const botonCancelar = document.getElementById("boton-cancelar");

async function init() {
    actualizarValoresCampos();

    botonEditarPerfil.addEventListener("click", habilitarEdicion);
    botonAceptar.addEventListener("click", tomarEnviarDatos);
    botonCancelar.addEventListener("click", cancelarEdicion); 
}

function actualizarValoresCampos() {
    nombreOriginal = usuario.nombre;
    emailOriginal = usuario.email;
    telefonoOriginal = usuario.telefono;
    documentoOriginal = usuario.documento;

    contenedorNombre.value = nombreOriginal;
    contenedorEmail.value = emailOriginal;
    contenedorTelefono.value = telefonoOriginal;
    contenedorDocumento.value = documentoOriginal;

    deshabilitarCampos();
}

function habilitarEdicion() {
    botonEditarPerfil.classList.add("d-none");
    botonAceptar.classList.remove("d-none");
    botonCancelar.classList.remove("d-none");

    contenedorNombre.removeAttribute("disabled");
    contenedorEmail.removeAttribute("disabled");
    contenedorTelefono.removeAttribute("disabled");
    contenedorDocumento.removeAttribute("disabled");
}

function deshabilitarCampos() {
    contenedorNombre.setAttribute("disabled", "");
    contenedorEmail.setAttribute("disabled", "");
    contenedorTelefono.setAttribute("disabled", "");
    contenedorDocumento.setAttribute("disabled", "");
}

function cancelarEdicion() {
    contenedorNombre.value = nombreOriginal;
    contenedorEmail.value = emailOriginal;
    contenedorTelefono.value = telefonoOriginal;
    contenedorDocumento.value = documentoOriginal;

    deshabilitarCampos();
    botonEditarPerfil.classList.remove("d-none");
    botonAceptar.classList.add("d-none");
    botonCancelar.classList.add("d-none");
}

async function tomarEnviarDatos() {
    let idUser = usuario.id_usuario;

    let nombreNuevo = contenedorNombre.value;
    let emailNuevo = contenedorEmail.value;
    let telefonoNuevo = contenedorTelefono.value;
    let documentoNuevo = contenedorDocumento.value;

    const updateUser = {};

    if (nombreNuevo !== nombreOriginal) {
        updateUser.nombre = nombreNuevo;
    }
    if (emailNuevo !== emailOriginal) {
        updateUser.email = emailNuevo;
    }
    if (telefonoNuevo !== telefonoOriginal) {
        updateUser.telefono = telefonoNuevo;
    }
    if (documentoNuevo !== documentoOriginal) {
        updateUser.documento = documentoNuevo;
    }

    // Si no hay cambios, no hacer nada
    if (Object.keys(updateUser).length === 0) {
        cancelarEdicion();
        return;
    }

    try {
        Swal.fire({
            title: "¿Esta seguro de guardar los cambios?",
            showDenyButton: true,
            confirmButtonText: "Guardar",
            denyButtonText: `Cancelar`,
            customClass: {
                confirmButton: "btn btn-primary text-white",
                denyButton: "btn btn-secondary text-white"
            }
        }).then( async (result) => {
            if (result.isConfirmed) {
                await userService.updateUser(idUser, updateUser);
                Swal.fire("cambios guardados!", "", "success");

                for (let key in updateUser) {
                    usuario[key] = updateUser[key];
                }

                localStorage.setItem("user", JSON.stringify(usuario));

                actualizarValoresCampos();

            } else if (result.isDenied) {                  
                cancelarEdicion();
            }
        });

        


        botonEditarPerfil.classList.remove("d-none");
        botonAceptar.classList.add("d-none");
        botonCancelar.classList.add("d-none");

    } catch (error) {
        console.log("Error al actualizar: ", error);
        alert("Error al actualizar los datos");
        cancelarEdicion();
    }
}

export { init };