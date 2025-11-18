import { userService } from '../api/user.service.js';

let modalInstance = null;
let createModalInstance = null;
let originalMail = null;

let allUsers = [];
let filteredUsers = [];

// -----------------------------------------------------
// ROW TEMPLATE
// -----------------------------------------------------

function createUserRow(usuario) {
  const userId = usuario.id_usuario;

  return `
    <tr>
      <td class="px-0 text-center">${usuario.nombre}</td>
      <td class="px-0">${usuario.documento}</td>
      <td class="px-0">${usuario.email}</td>
      <td class="px-0">${usuario.telefono}</td>
      <td class="px-0">${usuario.nombre_rol}</td>

      <td class="px-0 text-center">
        <div class="form-check form-switch">
          <input 
            class="form-check-input user-status-switch"
            type="checkbox"
            data-user-id="${userId}"
            ${usuario.estado ? "checked" : ""}
          >
        </div>
      </td>

      <td class="px-0 text-center">
        <button class="btn btn-sm btn-info btn-edit-user" data-user-email="${usuario.email}">
          <i class="fa-regular fa-pen-to-square"></i>
        </button>
      </td>
    </tr>
  `;
}



// -----------------------------------------------------
//       EXPORT FUNCTIONS (CSV / XLSX)
// -----------------------------------------------------

function convertToCSV(rows, columns) {
  const escapeCell = (val) => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    return `"${s.replace(/"/g, '""')}"`;
  };

  const header = columns.map((c) => escapeCell(c.header)).join(",");

  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const v = typeof c.key === "function" ? c.key(row) : row[c.key];
          return escapeCell(v);
        })
        .join(",")
    )
    .join("\n");

  return `${header}\n${body}`;
}

function downloadBlob(content, mimeType, filename) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportToCSV(data, filename = "usuarios.csv") {
  const columns = [
    { header: "ID", key: "id_usuario" },
    { header: "Nombre", key: "nombre" },
    { header: "Documento", key: "documento" },
    { header: "Correo", key: "email" },
    { header: "Teléfono", key: "telefono" },
    { header: "Rol", key: "nombre_rol" },
    { header: "Estado", key: (r) => (r.estado ? "Activo" : "Inactivo") },
  ];

  const csv = convertToCSV(data, columns);
  downloadBlob(csv, "text/csv;charset=utf-8", filename);

}

async function exportToExcel(data, filename = "usuarios.xlsx") {
  const loadSheetJS = () =>
    new Promise((resolve, reject) => {
      if (window.XLSX) return resolve(window.XLSX);
      const script = document.createElement("script");
      script.src = "https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js";
      script.onload = () => resolve(window.XLSX);
      script.onerror = () => reject("No se pudo cargar SheetJS");
      document.head.appendChild(script);
    });

  try {
    await loadSheetJS();
  } catch (err) {
    console.warn("Fallo XLSX, se exportará CSV", err);
    exportToCSV(data, filename.replace(/\.xlsx?$/, ".csv"));
    return;
  }

  const rows = data.map((r) => ({
    ID: r.id_usuario,
    Nombre: r.nombre,
    Documento: r.documento,
    Correo: r.email,
    Teléfono: r.telefono,
    Rol: r.nombre_rol,
    Estado: r.estado ? "Activo" : "Inactivo",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Usuarios");

  XLSX.writeFile(wb, filename);
}

function handleExportClick(event) {
  const item = event.target.closest(".export-format");
  if (!item) return;

  event.preventDefault();

  const fmt = item.dataset.format;
  const dateTag = new Date().toISOString().slice(0, 10);

  const data = filteredUsers.length ? filteredUsers : allUsers;

  if (!data || data.length === 0) {
    Swal.fire({ title: "No hay datos para exportar.", icon: "info" });
    return;
  }

  if (fmt === "csv") {
    exportToCSV(data, `usuarios_${dateTag}.csv`);
  } else if (fmt === "excel") {
    exportToExcel(data, `usuarios_${dateTag}.xlsx`);
  }
}



// -----------------------------------------------------
//       EDIT MODAL
// -----------------------------------------------------

async function openEditModal(email) {
  const modalElement = document.getElementById('edit-user-modal');

  if (!modalInstance) {
    modalInstance = new bootstrap.Modal(modalElement);
  }

  try {
    const user = await userService.getUserByEmail(email);
    originalMail = user.email;

    document.getElementById('edit-user-id').value = user.id_usuario;
    document.getElementById('edit-nombre').value = user.nombre;
    document.getElementById('edit-documento').value = user.documento;
    document.getElementById('edit-email').value = user.email;
    document.getElementById('edit-telefono').value = user.telefono;
  

    modalInstance.show();
  } catch (error) {
    console.error(`Error al obtener usuario ${email}:`, error);
    alert('No se pudieron cargar los datos del usuario.');
  }
}



// -----------------------------------------------------
//       HANDLERS
// -----------------------------------------------------

async function handleUpdateSubmit(event) {
  event.preventDefault();

  const userId = document.getElementById('edit-user-id').value;
  const updatedData = {
    nombre: document.getElementById('edit-nombre').value,
    telefono: document.getElementById('edit-telefono').value,
    documento: document.getElementById('edit-documento').value,
  };

  let newEmail = document.getElementById('edit-email').value;

  if (newEmail != originalMail){
    updatedData.email = newEmail;
  }

  try {
    await userService.updateUser(userId, updatedData);
    modalInstance.hide();
    await init();
    applyUserFilters();
  } catch (error) {
    console.error(`Error al actualizar usuario ${userId}:`, error);
    alert('No se pudo actualizar el usuario.');
  }
}

async function handleTableClick(event) {
  const editButton = event.target.closest('.btn-edit-user');
  if (editButton) {
    const email = editButton.dataset.userEmail;
    console.log(`Edit user with email: ${email}`);
    openEditModal(email);
    return;
  }
}

async function handleStatusSwitch(event) {
  const switchElement = event.target;
  if (!switchElement.classList.contains('user-status-switch')) return;

  const userId = switchElement.dataset.userId;
  const newStatus = switchElement.checked;

  const actionText = newStatus ? 'activar' : 'desactivar';

  if (confirm(`¿Estás seguro de que deseas ${actionText} este usuario?`)) {
    try {
      await userService.changeEstatusUser(userId, newStatus);
      alert(`Usuario ${newStatus ? 'activado' : 'desactivado'} exitosamente.`);
      await init();
      applyUserFilters();
    } catch (error) {
      console.error(`Error al ${actionText} usuario ${userId}:`, error);
      alert(`No se pudo ${actionText} el usuario.`);
      switchElement.checked = !newStatus;
    }
  } else {
    switchElement.checked = !newStatus;
  }
}



// -----------------------------------------------------
//       CREAR
// -----------------------------------------------------

async function handleCreateSubmit(event) {
  event.preventDefault();

  const newUserData = {
    nombre: document.getElementById('create-nombre').value,
    documento: document.getElementById('create-documento').value,
    email: document.getElementById('create-email').value,
    pass_hash: document.getElementById('create-password').value,
    telefono: document.getElementById('create-telefono').value,
    id_rol: parseInt(document.getElementById('create-id_rol').value),
    estado: true
  };
  
  try {
    await userService.createUser(newUserData);


    if (createModalInstance) {
      createModalInstance.hide();
    }
    
  document.getElementById('create-user-form').reset();
  alert('Usuario creado exitosamente.');
  await init();
  applyUserFilters();
  } catch (error) {
    console.error('Error al crear usuario:', error);
    alert('No se pudo crear el usuario.');
  }
}





// -----------------------------------------------------
//       INIT
// -----------------------------------------------------

async function init() {

  const createModalElement = document.getElementById('create-user-modal');
    createModalInstance = new bootstrap.Modal(createModalElement);

  createModalElement.addEventListener("hidden.bs.modal", () => {
    document.getElementById("create-user-form").reset();
  });

  const tableBody = document.getElementById('users-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Cargando usuarios ...</td></tr>';

  try {
    allUsers = await userService.getUsers();
    filteredUsers = [];

    if (allUsers && allUsers.length > 0) {
      tableBody.innerHTML = allUsers.map(createUserRow).join('');
    } else {
      tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron usuarios.</td></tr>';
    }
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error al cargar los datos.</td></tr>';
  }

  const editForm = document.getElementById('edit-user-form');
  const createForm = document.getElementById('create-user-form');

  tableBody.removeEventListener('click', handleTableClick);
  tableBody.addEventListener('click', handleTableClick);

  tableBody.removeEventListener('change', handleStatusSwitch);
  tableBody.addEventListener('change', handleStatusSwitch);

  editForm.removeEventListener('submit', handleUpdateSubmit);
  editForm.addEventListener('submit', handleUpdateSubmit);

  createForm.removeEventListener('submit', handleCreateSubmit);
  createForm.addEventListener('submit', handleCreateSubmit);

  // <<<------ EXPORT HOOK ----->>>
  const pageUtilities = document.querySelector(".page-utilities");
  if (pageUtilities) {
    pageUtilities.removeEventListener("click", handleExportClick);
    pageUtilities.addEventListener("click", handleExportClick);

    
  }

  const roleSelect = document.getElementById("filter-role");
  const statusSelect = document.getElementById("filter-status");

  if (roleSelect) {
    roleSelect.removeEventListener("change", applyUserFilters);
    roleSelect.addEventListener("change", applyUserFilters);
  }

  if (statusSelect) {
    statusSelect.removeEventListener("change", applyUserFilters);
    statusSelect.addEventListener("change", applyUserFilters);
  }
}

export { init };

function applyUserFilters() {
  const roleFilter = document.getElementById("filter-role")?.value || "all";
  const statusFilter = document.getElementById("filter-status")?.value || "all";

  const tableBody = document.getElementById("users-table-body");
  if (!allUsers.length) return;

  // Empieza con todos
  let result = [...allUsers];

  // Filtro por rol
  if (roleFilter !== "all") {
    result = result.filter(u => u.nombre_rol === roleFilter);
  }

  // Filtro por estado
  if (statusFilter === "active") {
    result = result.filter(u => u.estado === true);
  }
  if (statusFilter === "inactive") {
    result = result.filter(u => u.estado === false);
  }

  filteredUsers = result;

  tableBody.innerHTML = result.length
    ? result.map(createUserRow).join("")
    : `<tr><td colspan="7" class="text-center">No hay usuarios con esos criterios.</td></tr>`;
}
