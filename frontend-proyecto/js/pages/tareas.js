// pages/tareas.js

import { tareaService } from "../api/tareas.service.js";

let createModalInst = null;
let editModalInst = null;
let cachedTareas = []; // lista actual de tareas cargadas (página actual)
let currentPage = 1;
let pageSize = 10;
let totalPages = 1;

// Helper: obtener usuario desde localStorage (debes tener objeto user almacenado)
function getCurrentUser() {
  const s = localStorage.getItem("user");
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch (err) {
    console.error("Error parseando user desde localStorage:", err);
    return null;
  }
}

function formatDateInputToLocalDatetime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d)) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateDisplay(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d)) return value;
  return d.toLocaleString("es-CO");
}

function createTareaRow(t) {
  return `
    <tr data-id_tarea="${t.id_tarea}">
      <td class="px-0">${t.id_tarea}</td>
      <td class="px-0">${t.id_usuario}</td>
      <td class="px-0">${t.descripcion}</td>
      <td class="px-0">${formatDateDisplay(t.fecha_hora_init)}</td>
      <td class="px-0">${t.fecha_hora_fin ? formatDateDisplay(t.fecha_hora_fin) : "-"}</td>
      <td class="px-0"><span class="badge bg-secondary">${t.estado}</span></td>
      <td class="px-0 text-end">
        <div class="btn-group" role="group">
          <button class="btn btn-sm btn-info btn-edit" data-id="${t.id_tarea}" title="Editar"><i class="fa-regular fa-pen-to-square"></i></button>
        </div>
      </td>
    </tr>
  `;
}

async function loadPage(page = 1) {
  currentPage = page;
  const tbody = document.getElementById("tareas-table-body");
  if (!tbody) {
    console.error("No se encontró tarea en el DOM.");
    return;
  }
  tbody.innerHTML = `<tr><td colspan="7" class="text-center">Cargando...</td></tr>`;

  const user = getCurrentUser();
  if (!user) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Usuario no autenticado.</td></tr>`;
    return;
  }

  // filtros desde UI (safety: compruebo existencia)
  const estadoEl = document.getElementById("filter-estado");
  const fechaIniEl = document.getElementById("filter-fecha-inicio");
  const fechaFinEl = document.getElementById("filter-fecha-fin");
  const searchEl = document.getElementById("search-input");

  const estadoFilter = estadoEl ? estadoEl.value : "all";
  const fechaInicio = fechaIniEl ? fechaIniEl.value || null : null;
  const fechaFin = fechaFinEl ? fechaFinEl.value || null : null;
  const search = searchEl ? (searchEl.value || "").toLowerCase() : "";

  try {
    let responseData = null;

    // Si operario -> usamos GET /usuario/{id_usuario}
    if (user.id_rol === 4) {
      const tareas = await tareaService.getByUser(user.id_usuario);
      // Aseguramos que tareas sea un array
      const arr = Array.isArray(tareas) ? tareas : [];
      responseData = {
        page,
        page_size: arr.length || 0,
        total_tareas: arr.length || 0,
        total_pages: 1,
        tareas: arr,
      };
    } else {
      // paginado: usamos endpoint pag
      const pagResp = await tareaService.getPaginated({
        page,
        page_size: pageSize,
        fecha_inicio: fechaInicio || undefined,
        fecha_fin: fechaFin || undefined,
      });

      // pagResp debe contener { tareas: [...], total_tareas, total_pages }
      responseData = pagResp || { tareas: [], total_tareas: 0, total_pages: 1 };
    }

    const tareasList = responseData.tareas || [];
    cachedTareas = tareasList;

    // aplicar filtros cliente: estado y buscador
    let filtered = tareasList;
    if (estadoFilter && estadoFilter !== "all") {
      filtered = filtered.filter((t) => String(t.estado) === String(estadoFilter));
    }
    if (search) {
      filtered = filtered.filter((t) => t.descripcion && t.descripcion.toLowerCase().includes(search));
    }

    // paginación cliente si endpoint devolvió todo (solo ocurre para operarios o si tu API devuelve todo)
    let displayed = filtered;
    if (user.id_rol === 4) {
      totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
      const start = (page - 1) * pageSize;
      displayed = filtered.slice(start, start + pageSize);
    } else {
      totalPages = responseData.total_pages || Math.max(1, Math.ceil((responseData.total_tareas || filtered.length) / pageSize));
    }

    if (!displayed || displayed.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center">No se encontraron tareas.</td></tr>`;
    } else {
      tbody.innerHTML = displayed.map(createTareaRow).join("");
    }

    renderPagination(currentPage, totalPages);

    // permisos UI: si operario ocultar botón crear si no puede
    applyUiPermissions(user);

  } catch (err) {
    console.error("Error cargando tareas:", err);
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error al cargar tareas.</td></tr>`;
  }
}

function renderPagination(page, pages) {
  const list = document.getElementById("pagination-list");
  if (!list) return;
  list.innerHTML = "";

  const createPageItem = (p, text = null, active = false, disabled = false) => {
    return `<li class="page-item ${active ? "active" : ""} ${disabled ? "disabled" : ""}">
      <a class="page-link" href="#" data-page="${p}">${text ?? p}</a>
    </li>`;
  };

  // prev
  list.insertAdjacentHTML("beforeend", createPageItem(Math.max(1, page - 1), "«", false, page <= 1));

  // páginas (mostrar hasta 5)
  const start = Math.max(1, page - 2);
  const end = Math.min(pages, page + 2);
  for (let p = start; p <= end; p++) {
    list.insertAdjacentHTML("beforeend", createPageItem(p, null, p === page));
  }

  // next
  list.insertAdjacentHTML("beforeend", createPageItem(Math.min(pages, page + 1), "»", false, page >= pages));
}

function applyUiPermissions(user) {
  const btnCreate = document.getElementById("btn-open-create");
  if (!btnCreate) return;

  if (user.id_rol === 4) {
    btnCreate.style.display = "none";
  } else {
    btnCreate.style.display = "inline-block";
  }

  // Mostrar/ocultar botones de editar según rol (actualizamos después de render)
  const canEdit = user.id_rol !== 4;
  document.querySelectorAll(".btn-edit").forEach(btn => {
    btn.style.display = canEdit ? "inline-block" : "none";
  });
}

/* ---------- EVENT HANDLERS ---------- */

function handleTableClick(e) {
  const btn = e.target.closest ? e.target.closest(".btn-edit") : null;
  if (!btn) return;
  const id = btn.dataset.id;
  openEditModalFromCache(parseInt(id, 10));
}

function handlePaginationClick(e) {
  e.preventDefault();
  const a = e.target.closest ? e.target.closest("a[data-page]") : null;
  if (!a) return;
  const p = parseInt(a.dataset.page, 10);
  if (!isNaN(p)) loadPage(p);
}

function handleFilterChange() {
  loadPage(1);
}

function handleSearchInput() {
  loadPage(1);
}

/* ---------- MODALES: crear / editar ---------- */

function initModals() {
  try {
    const createEl = document.getElementById("create-tarea-modal");
    const editEl = document.getElementById("edit-tarea-modal");
    if (createEl) createModalInst = new bootstrap.Modal(createEl);
    if (editEl) editModalInst = new bootstrap.Modal(editEl);

    const btnOpen = document.getElementById("btn-open-create");
    if (btnOpen) {
      // si bootstrap está cargado, usar Modal.show(); si no, dejamos que data-bs-* abra el modal si el botón lo tiene
      btnOpen.addEventListener("click", () => {
        if (createModalInst) createModalInst.show();
      });
    }

    // crear -> submit
    const createForm = document.getElementById("create-tarea-form");
    if (createForm) {
      createForm.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        try {
          const newData = {
            id_usuario: parseInt(document.getElementById("create-id_usuario").value, 10),
            descripcion: document.getElementById("create-descripcion").value,
            fecha_hora_init: new Date(document.getElementById("create-fecha_hora_init").value).toISOString(),
            fecha_hora_fin: document.getElementById("create-fecha_hora_fin").value ? new Date(document.getElementById("create-fecha_hora_fin").value).toISOString() : null,
            estado: document.getElementById("create-estado").value
          };
          await tareaService.create(newData);
          if (createModalInst) createModalInst.hide();
          createForm.reset();
          loadPage(1);
          alert("Tarea creada correctamente.");
        } catch (err) {
          console.error("Error creando tarea:", err);
          alert("No se pudo crear la tarea.");
        }
      });
    }

    // editar -> submit
    const editForm = document.getElementById("edit-tarea-form");
    if (editForm) {
      editForm.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        try {
          const id = document.getElementById("edit-id_tarea").value;
          const data = {
            id_usuario: parseInt(document.getElementById("edit-id_usuario").value, 10),
            descripcion: document.getElementById("edit-descripcion").value,
            fecha_hora_init: new Date(document.getElementById("edit-fecha_hora_init").value).toISOString(),
            fecha_hora_fin: document.getElementById("edit-fecha_hora_fin").value ? new Date(document.getElementById("edit-fecha_hora_fin").value).toISOString() : null,
            estado: document.getElementById("edit-estado").value
          };
          await tareaService.updateById(id, data);
          if (editModalInst) editModalInst.hide();
          loadPage(currentPage);
          alert("Tarea actualizada correctamente.");
        } catch (err) {
          console.error("Error actualizar tarea:", err);
          alert("No se pudo actualizar la tarea.");
        }
      });
    }
  } catch (err) {
    console.error("Error inicializando modales:", err);
  }
}

/* Abrir modal editar usando cache (no hay endpoint GET /{id}) */
function openEditModalFromCache(id_tarea) {
  const t = cachedTareas.find(x => x.id_tarea === id_tarea);
  if (!t) {
    alert("No se encontró la tarea para editar (recarga la página).");
    return;
  }
  const setIf = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = value ?? "";
  };

  setIf("edit-id_tarea", t.id_tarea);
  setIf("edit-id_usuario", t.id_usuario);
  setIf("edit-descripcion", t.descripcion);
  setIf("edit-fecha_hora_init", formatDateInputToLocalDatetime(t.fecha_hora_init));
  setIf("edit-fecha_hora_fin", t.fecha_hora_fin ? formatDateInputToLocalDatetime(t.fecha_hora_fin) : "");
  setIf("edit-estado", t.estado);

  if (editModalInst) editModalInst.show();
}

/* ---------- EXPORT CSV ---------- */
function exportToCsv(rows, filename = "tareas.csv") {
  if (!rows || rows.length === 0) return alert("No hay datos para exportar.");
  const header = Object.keys(rows[0]);
  const csv = [
    header.join(","),
    ...rows.map(r => header.map(h => {
      const v = r[h] ?? "";
      const safe = String(v).replace(/"/g, '""');
      return `"${safe}"`;
    }).join(","))
  ].join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* ---------- INIT ---------- */
function attachEvents() {
  const pagList = document.getElementById("pagination-list");
  if (pagList) pagList.addEventListener("click", handlePaginationClick);

  const estadoEl = document.getElementById("filter-estado");
  if (estadoEl) estadoEl.addEventListener("change", handleFilterChange);

  const fi = document.getElementById("filter-fecha-inicio");
  if (fi) fi.addEventListener("change", handleFilterChange);

  const ff = document.getElementById("filter-fecha-fin");
  if (ff) ff.addEventListener("change", handleFilterChange);

  const search = document.getElementById("search-input");
  if (search) search.addEventListener("input", debounce(handleSearchInput, 300));

  const tbody = document.getElementById("tareas-table-body");
  if (tbody) tbody.addEventListener("click", handleTableClick);

  const exportBtn = document.getElementById("export-csv-btn");
  if (exportBtn) exportBtn.addEventListener("click", () => {
    exportToCsv(cachedTareas, `tareas_page${currentPage}.csv`);
  });
}

export function init() {
  initModals();
  attachEvents();
  loadPage(1);
}

/* ---------- UTIL ---------- */
function debounce(fn, ms = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}



