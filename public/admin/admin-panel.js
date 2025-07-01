// Manejo de navegación lateral
const sidebarItems = document.querySelectorAll(".sidebar ul li");
const panels = document.querySelectorAll(".panel-section");

sidebarItems.forEach((item) => {
  item.addEventListener("click", () => {
    // Activar sección
    sidebarItems.forEach((i) => i.classList.remove("active"));
    item.classList.add("active");

    panels.forEach((p) => p.classList.remove("active"));
    document.getElementById(item.dataset.section).classList.add("active");

    // Cargar datos según sección activa
    if (item.dataset.section === "platos") loadPlatos();
    else if (item.dataset.section === "categorias") loadCategorias();
    else if (item.dataset.section === "comandas") loadComandas();
    else if (item.dataset.section === "camareros") loadCamareros();
    else if (item.dataset.section === "cocineros") loadCocineros();
  });
});

// Abrir sección por defecto al cargar la página
window.addEventListener("DOMContentLoaded", () => {
  document.querySelector('[data-section="platos"]').click();
});

// Logout
document.getElementById("logout").addEventListener("click", async () => {
  await fetch("/api/admin/logout", { method: "POST" });
  window.location = "/admin";
});

// --------------------
// Gestión de Camareros
// --------------------
const camareroForm = document.getElementById("camarero-form");

async function loadCamareros() {
  const res = await fetch("/api/camareros");
  const lista = res.ok ? await res.json() : [];
  document.getElementById("camareros-body").innerHTML = lista
    .map(
      (c) => `
    <tr>
      <td>${c.usuario}</td>
      <td>
        <button onclick="delCamarero('${c._id}')">Eliminar</button>
      </td>
    </tr>`
    )
    .join("");
}

async function delCamarero(id) {
  if (!confirm("¿Eliminar este camarero?")) return;
  await fetch(`/api/camareros/${id}`, { method: "DELETE" });
  loadCamareros();
}

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

async function loadCocineros() {
  const res = await fetch("/api/cocineros");
  const lista = res.ok ? await res.json() : [];
  document.getElementById("cocineros-body").innerHTML = lista
    .map(
      (c) => `
    <tr>
      <td>${c.usuario}</td>
      <td>
        <button onclick="delCocinero('${c._id}')">Eliminar</button>
      </td>
    </tr>`
    )
    .join("");
}

async function delCocinero(id) {
  if (!confirm("¿Eliminar este cocinero?")) return;
  await fetch(`/api/cocineros/${id}`, { method: "DELETE" });
  loadCocineros();
}

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

pwdForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  pwdMsg.textContent = "";
  pwdMsg.className = "config-msg";

  const current = pwdForm.current.value.trim();
  const nw = pwdForm.new.value.trim();
  const confirm = pwdForm.confirm.value.trim();

  if (nw !== confirm) {
    pwdMsg.textContent = "Las contraseñas no coinciden";
    pwdMsg.classList.add("error");
    return;
  }

  const res = await fetch("/api/admin/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current, new: nw }),
  });

  const data = await res.json();
  if (res.ok) {
    pwdMsg.textContent = "Contraseña actualizada correctamente";
    pwdMsg.classList.add("success");
    pwdForm.reset();
  } else {
    pwdMsg.textContent = data.error || "Error al actualizar";
    pwdMsg.classList.add("error");
  }
});

// --------------------
// Gestión de Categorías
// --------------------
const categoriasBody = document.getElementById("categorias-body");
const categoriaForm = document.getElementById("categoria-form");

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
          }')">Borrar</button>
        </td>
      </tr>`
      )
      .join("");

    actualizarSelectorCategorias(categorias);
  } catch {
    categoriasBody.innerHTML =
      "<tr><td colspan='2'>Error cargando categorías</td></tr>";
  }
}

function actualizarSelectorCategorias(categorias) {
  const select = document.querySelector("#plato-form select[name=categoria]");
  select.innerHTML = `<option value="" disabled selected>Selecciona categoría</option>`;
  categorias.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c._id;
    opt.textContent = c.nombre.toUpperCase();
    select.appendChild(opt);
  });
}

async function editCategoria(id) {
  const res = await fetch(`/api/categorias/${id}`);
  if (res.ok) {
    const c = await res.json();
    categoriaForm.id.value = c._id;
    categoriaForm.nombre.value = c.nombre;
  }
}

async function delCategoria(id) {
  if (!confirm("¿Estás seguro?")) return;
  await fetch(`/api/categorias/${id}`, { method: "DELETE" });
  loadCategorias();
}

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

async function loadPlatos() {
  const res = await fetch("/api/platos");
  const platos = res.ok ? await res.json() : [];
  platosBody.innerHTML = platos
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
        }')">Borrar</button>
      </td>
    </tr>`
    )
    .join("");

  actualizarSelectorCategorias(await fetchCategorias());
}

async function fetchCategorias() {
  const res = await fetch("/api/categorias");
  return res.ok ? await res.json() : [];
}

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

async function delPlato(id) {
  if (!confirm("¿Estás seguro?")) return;
  await fetch(`/api/platos/${id}`, { method: "DELETE" });
  loadPlatos();
}

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
async function loadComandas() {
  const res = await fetch("/api/comandas");
  const cmds = res.ok ? await res.json() : [];
  const tbody = document.getElementById("comandas-body");

  tbody.innerHTML = cmds
    .map((c) => {
      const detalles = (c.platos || [])
        .map((i) => `<li>${i.nombre} × ${i.cantidad}</li>`)
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
