// js/main.js
const mainContent = document.getElementById('main-content');
const navLinks = document.querySelector('#app-nav-main');

console.log("main.js cargado. El script principal está listo.");

const loadContent = async (page) => {
  console.log(`Paso 2: Se llamó a loadContent con el parámetro: '${page}'`);
  try {
    const response = await fetch(`pages/${page}.html`);
    console.log("Paso 3: Se intentó hacer fetch. Respuesta recibida:", response);

    if (!response.ok) {
      throw new Error(`Error de red: ${response.status} - ${response.statusText}`);
    }
    
    const html = await response.text();
    mainContent.innerHTML = html;
    console.log("Paso 4: El contenido HTML se ha inyectado en #main-content.");
    
    // Actualizar clase active en el menú
    updateActiveMenuItem(page);
    
    // Cargar el módulo JS correspondiente
    if (page === 'users') {
      import('./pages/users.js')
        .then(usersModule => usersModule.init());
    }

    if (page === 'metodos_pago') {
      import('./pages/metodo_pago.js')
        .then(modulo => modulo.init());
    }
    // Agregar más módulos según sea necesario

  } catch (error) {
    console.error("¡ERROR! Algo falló dentro de loadContent:", error);
    mainContent.innerHTML = `
      <div class="alert alert-danger" role="alert">
        <h4 class="alert-heading">Error al cargar el contenido</h4>
        <p>No se pudo cargar el módulo solicitado. Por favor, intenta nuevamente.</p>
        <hr>
        <p class="mb-0">Si el problema persiste, contacta al administrador del sistema.</p>
      </div>
    `;
  }
};

// Función para actualizar el item activo en el menú
const updateActiveMenuItem = (page) => {
  // Remover clase active de todos los links
  document.querySelectorAll('#app-nav-main .nav-link').forEach(link => {
    link.classList.remove('active');
  });
  
  // Agregar clase active al link correspondiente
  const activeLink = document.querySelector(`#app-nav-main .nav-link[data-page="${page}"]`);
  if (activeLink) {
    activeLink.classList.add('active');
  }
};

// Event listener para los links del menú
navLinks.addEventListener('click', (event) => {
  console.log(event);
  const link = event.target.closest('a[data-page]');
  
  if (link) {
    event.preventDefault();
    const pageToLoad = link.dataset.page;
    console.log(`Paso 1: Clic detectado. Se va a cargar la página: '${pageToLoad}'`);
    loadContent(pageToLoad);
    
    // Cerrar el sidepanel en móviles
    const sidepanel = document.getElementById('app-sidepanel');
    if (sidepanel && window.innerWidth < 1200) {
      sidepanel.classList.remove('sidepanel-visible');
      sidepanel.classList.add('sidepanel-hidden');
    }
  }
});

// Carga inicial
document.addEventListener('DOMContentLoaded', () => {
  loadContent('panel');
});

// Botón de logout
const logoutButton = document.getElementById('logout-button');
if (logoutButton) {
  logoutButton.addEventListener('click', (event) => {
    event.preventDefault();
    console.log('Cerrando sesión...');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
  });
}
