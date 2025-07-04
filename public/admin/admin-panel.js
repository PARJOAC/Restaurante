// Selecciona todos los botones del menú lateral y las secciones del panel
const sidebarItems = document.querySelectorAll(".sidebar ul li");
const panels = document.querySelectorAll(".panel-section");

// Recorre cada botón de menú y asigna su comportamiento al hacer clic
sidebarItems.forEach((item) => {
  item.addEventListener("click", () => {
    // Quita la clase 'active' de todos los botones del menú
    sidebarItems.forEach((i) => i.classList.remove("active"));
    // Agrega la clase 'active' solo al ítem clicado
    item.classList.add("active");

    // Oculta todas las secciones
    panels.forEach((p) => p.classList.remove("active"));
    // Muestra la sección correspondiente al ítem clicado (usando el data-section)
    document.getElementById(item.dataset.section).classList.add("active");

    // Carga los datos de la sección activa
    if (item.dataset.section === "platos") loadPlatos();
    else if (item.dataset.section === "categorias") loadCategorias();
    else if (item.dataset.section === "comandas") loadComandas();
    else if (item.dataset.section === "camareros") loadCamareros();
    else if (item.dataset.section === "cocineros") loadCocineros();
  });
});

// Al cargar la página, activa automáticamente la sección 'Platos'
window.addEventListener("DOMContentLoaded", () => {
  document.querySelector('[data-section="platos"]').click();
  document
    .getElementById("filtro-nombre")
    .addEventListener("input", renderizarPlatos);
  document
    .getElementById("filtro-categoria")
    .addEventListener("change", renderizarPlatos);
  document
    .getElementById("ordenar-por")
    .addEventListener("change", renderizarPlatos);
});

// Evento al hacer clic en el botón de cerrar sesión
document.getElementById("logout").addEventListener("click", async () => {
  // Llama a la API para cerrar sesión
  await fetch("/api/admin/logout", { method: "POST" });
  // Redirige al login
  window.location = "/admin";
});

// --------------------
// Gestión de Camareros
// --------------------
const camareroForm = document.getElementById("camarero-form");

// Cargar camareros existentes desde la API
async function loadCamareros() {
  const res = await fetch("/api/camareros");
  const lista = res.ok ? await res.json() : [];
  document.getElementById("camareros-body").innerHTML = lista
    .map(
      (c) => `
    <tr>
      <td>${c.usuario}</td>
      <td>
      <button class="btn-small delete-btn" onclick="delCamarero('${c._id}')">Eliminar</button>
      </td>
    </tr>`
    )
    .join("");
}

// Eliminar camarero con confirmación
async function delCamarero(id) {
  if (!confirm("¿Quieres eliminar el camarero?")) return;
  await fetch(`/api/camareros/${id}`, { method: "DELETE" });
  loadCamareros();
}

// Crear nuevo camarero desde el formulario
camareroForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const u = camareroForm.usuario.value.trim();
  const p = camareroForm.contraseña.value;

  const res = await fetch("/api/camareros", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario: u, contraseña: p }),
  });

  if (!res.ok) {
    const err = await res.json();
    alert("Error: " + err.error);
  } else {
    camareroForm.reset();
    loadCamareros();
  }
});

// --------------------
// Gestión de Cocineros
// --------------------
const cocineroForm = document.getElementById("cocinero-form");

// Cargar cocineros desde la API
async function loadCocineros() {
  const res = await fetch("/api/cocineros");
  const lista = res.ok ? await res.json() : [];
  document.getElementById("cocineros-body").innerHTML = lista
    .map(
      (c) => `
    <tr>
      <td>${c.usuario}</td>
      <td>
      <button class="btn-small delete-btn" onclick="delCocinero('${c._id}')">Eliminar</button>
      </td>
    </tr>`
    )
    .join("");
}

// Eliminar cocinero
async function delCocinero(id) {
  if (!confirm("¿Quieres eliminar el cocinero?")) return;
  await fetch(`/api/cocineros/${id}`, { method: "DELETE" });
  loadCocineros();
}

// Crear cocinero
cocineroForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const u = cocineroForm.usuario.value.trim();
  const p = cocineroForm.contraseña.value;

  const res = await fetch("/api/cocineros", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario: u, contraseña: p }),
  });

  if (!res.ok) {
    const err = await res.json();
    alert("Error: " + err.error);
  } else {
    cocineroForm.reset();
    loadCocineros();
  }
});

// --------------------
// Cambiar contraseña
// --------------------
const pwdForm = document.getElementById("pwd-form");
const pwdMsg = document.getElementById("pwd-msg");

// Enviar nueva contraseña
pwdForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  pwdMsg.textContent = "";
  pwdMsg.className = "config-msg";

  const current = pwdForm.current.value.trim();
  const nw = pwdForm.new.value.trim();
  const confirm = pwdForm.confirm.value.trim();

  // Validar coincidencia
  if (nw !== confirm) {
    pwdMsg.textContent = "Las contraseñas no coinciden.";
    pwdMsg.classList.add("error");
    return;
  }

  // Enviar petición al servidor
  const res = await fetch("/api/admin/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current, new: nw }),
  });

  if (res.ok) {
    pwdMsg.textContent = "Contraseña actualizada correctamente.";
    pwdMsg.classList.add("success");
    pwdForm.reset();
  } else {
    pwdMsg.textContent = "Error al actualizar la contraseña.";
    pwdMsg.classList.add("error");
  }
});

// --------------------
// Gestión de Categorías
// --------------------
const categoriasBody = document.getElementById("categorias-body");
const categoriaForm = document.getElementById("categoria-form");

// Cargar categorías desde API y mostrarlas
async function loadCategorias() {
  try {
    const res = await fetch("/api/categorias");
    const categorias = res.ok ? await res.json() : [];

    categoriasBody.innerHTML = categorias
      .map(
        (c) => `
      <tr>
        <td>${c.nombre.toUpperCase()}</td>
        <td>
          <button class="btn-small edit-btn" onclick="editCategoria('${
            c._id
          }')">Editar</button>
          <button class="btn-small delete-btn" onclick="delCategoria('${
            c._id
          }')">Eliminar</button>
        </td>
      </tr>`
      )
      .join("");

    // Actualiza también el selector de categorías del formulario de platos
    actualizarSelectorCategorias(categorias);
  } catch {
    categoriasBody.innerHTML =
      "<tr><td colspan='2'>Error cargando categorías.</td></tr>";
  }
}

// Rellena el selector de categorías en el formulario de platos
function actualizarSelectorCategorias(categorias) {
  const select = document.querySelector("#plato-form select[name=categoria]");
  select.innerHTML = `<option value="" disabled selected>Selecciona una categoría</option>`;
  categorias.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c._id;
    opt.textContent = c.nombre.toUpperCase();
    select.appendChild(opt);
  });
}

// Editar una categoría existente
async function editCategoria(id) {
  const res = await fetch(`/api/categorias/${id}`);
  if (res.ok) {
    const c = await res.json();
    categoriaForm.id.value = c._id;
    categoriaForm.nombre.value = c.nombre;
  }
}

// Eliminar una categoría
async function delCategoria(id) {
  if (!confirm("¿Quieres eliminar la categoría?")) return;
  await fetch(`/api/categorias/${id}`, { method: "DELETE" });
  loadCategorias();
}

// Guardar categoría (nueva o editada)
categoriaForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = { nombre: categoriaForm.nombre.value.trim().toLowerCase() };
  const id = categoriaForm.id.value;
  await fetch(id ? `/api/categorias/${id}` : "/api/categorias", {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  categoriaForm.reset();
  loadCategorias();
});

// --------------------
// Gestión de Platos
// --------------------
const platosBody = document.getElementById("platos-body");
const platoForm = document.getElementById("plato-form");

// Cargar platos y mostrarlos en tabla
let todosLosPlatos = [];

async function loadPlatos() {
  const res = await fetch("/api/platos");
  todosLosPlatos = res.ok ? await res.json() : [];

  const categorias = await fetchCategorias();
  const filtroCategoria = document.getElementById("filtro-categoria");
  filtroCategoria.innerHTML = `<option value="">Todas las categorías</option>`;
  categorias.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.nombre.toLowerCase();
    opt.textContent = c.nombre.toUpperCase();
    filtroCategoria.appendChild(opt);
  });

  renderizarPlatos();
}

function renderizarPlatos() {
  const nombreFiltro = document
    .getElementById("filtro-nombre")
    .value.toLowerCase();
  const categoriaFiltro = document.getElementById("filtro-categoria").value;
  const ordenarPor = document.getElementById("ordenar-por").value;

  let filtrados = todosLosPlatos.filter((p) => {
    const nombre = p.nombre.toLowerCase();
    const categoria = p.categoria?.nombre?.toLowerCase() || "";
    return (
      nombre.includes(nombreFiltro) &&
      (categoriaFiltro === "" || categoria === categoriaFiltro)
    );
  });

  filtrados.sort((a, b) => {
    if (ordenarPor === "precio") return a.precio - b.precio;
    if (ordenarPor === "nombre") return a.nombre.localeCompare(b.nombre);
    if (ordenarPor === "categoria")
      return (a.categoria?.nombre || "").localeCompare(
        b.categoria?.nombre || ""
      );
    return 0;
  });

  platosBody.innerHTML = filtrados
    .map(
      (p) => `
    <tr>
      <td><img src="${p.imagen}" alt="" /></td>
      <td>${p.nombre}</td>
      <td>${p.precio.toFixed(2)}</td>
      <td>${p.categoria?.nombre.toUpperCase() || "SIN CATEGORÍA"}</td>
      <td>
        <button class="btn-small edit-btn" onclick="editPlato('${
          p._id
        }')">Editar</button>
        <button class="btn-small delete-btn" onclick="delPlato('${
          p._id
        }')">Eliminar</button>
      </td>
    </tr>`
    )
    .join("");
}

// Petición para obtener las categorías
async function fetchCategorias() {
  const res = await fetch("/api/categorias");
  return res.ok ? await res.json() : [];
}

// Rellena el formulario con los datos del plato seleccionado para editar
async function editPlato(id) {
  const res = await fetch(`/api/platos/${id}`);
  if (res.ok) {
    const p = await res.json();
    platoForm.id.value = p._id;
    platoForm.nombre.value = p.nombre;
    platoForm.precio.value = p.precio;
    platoForm.imagen.value = p.imagen;
    platoForm.descripcion.value = p.descripcion || "";
    platoForm.categoria.value = p.categoria?._id || "";
  }
}

// Eliminar un plato
async function delPlato(id) {
  if (!confirm("¿Quieres eliminar el plato?")) return;
  await fetch(`/api/platos/${id}`, { method: "DELETE" });
  loadPlatos();
}

// Guardar plato (nuevo o editado)
platoForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {
    nombre: platoForm.nombre.value,
    precio: parseFloat(platoForm.precio.value),
    imagen: platoForm.imagen.value,
    descripcion: platoForm.descripcion.value,
    categoria: platoForm.categoria.value || null,
  };
  const id = platoForm.id.value;
  await fetch(id ? `/api/platos/${id}` : "/api/platos", {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  platoForm.reset();
  loadPlatos();
});

// --------------------
// Gestión de Comandas
// --------------------
// Cargar comandas y mostrarlas con detalles de platos
async function loadComandas() {
  const res = await fetch("/api/comandas");
  const cmds = res.ok ? await res.json() : [];
  const tbody = document.getElementById("comandas-body");

  tbody.innerHTML = cmds
    .map((c) => {
      // Genera lista de platos dentro de cada comanda
      const detalles = (c.platos || [])
        .map((i) => `<li>${i.plato?.nombre} x ${i.cantidad}</li>`)
        .join("");
      return `
      <tr>
        <td>${c.mesa}</td>
        <td>${c.fecha || ""}</td>
        <td>${c.total.toFixed(2)}</td>
        <td><details><summary>Ver detalles</summary><ul>${detalles}</ul></details></td>
      </tr>`;
    })
    .join("");
}
