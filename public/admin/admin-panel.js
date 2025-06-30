// Manejo de navegación lateral
const sidebarItems = document.querySelectorAll(".sidebar ul li");
const panels = document.querySelectorAll(".panel-section");

sidebarItems.forEach((item) => {
  item.addEventListener("click", () => {
    sidebarItems.forEach((i) => i.classList.remove("active"));
    item.classList.add("active");

    panels.forEach((p) => p.classList.remove("active"));
    document.getElementById(item.dataset.section).classList.add("active");

    if (item.dataset.section === "platos") loadPlatos();
    if (item.dataset.section === "categorias") loadCategorias();
    if (item.dataset.section === "comandas") loadComandas();
  });
});

window.addEventListener("DOMContentLoaded", () => {
  document.querySelector('[data-section="platos"]').click();
});

document.getElementById("logout").addEventListener("click", async () => {
  await fetch("/api/admin/logout", { method: "POST" });
  window.location = "/admin";
});

// Cambiar contraseña
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
          }')">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/></svg>
            Editar
          </button>
          <button class="btn-small delete-btn" onclick="delCategoria('${
            c._id
          }')">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14H7L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            Borrar
          </button>
        </td>
      </tr>`
      )
      .join("");

    // También actualiza el selector en el formulario de platos
    actualizarSelectorCategorias(categorias);
  } catch (e) {
    categoriasBody.innerHTML =
      "<tr><td colspan='2'>Error cargando categorías</td></tr>";
  }
}

function actualizarSelectorCategorias(categorias) {
  const select = document.querySelector("#plato-form select[name=categoria]");
  select.innerHTML = `<option value="" disabled selected>Selecciona categoría</option>`;
  categorias.forEach((c) => {
    const option = document.createElement("option");
    option.value = c._id;
    option.textContent = c.nombre.toUpperCase();
    select.appendChild(option);
  });
}

function editCategoria(id) {
  fetch(`/api/categorias/${id}`)
    .then((res) => res.json())
    .then((c) => {
      categoriaForm.id.value = c._id;
      categoriaForm.nombre.value = c.nombre.toUpperCase();
    });
}

async function delCategoria(id) {
  const confirmar = confirm(
    "¿Estás seguro de que deseas borrar esta categoría?"
  );
  if (!confirmar) return;

  await fetch(`/api/categorias/${id}`, { method: "DELETE" });
  loadCategorias();
}

categoriaForm.onsubmit = async (e) => {
  e.preventDefault();
  const data = {
    nombre: categoriaForm.nombre.value.trim().toLowerCase(),
  };
  const id = categoriaForm.id.value;
  await fetch(id ? `/api/categorias/${id}` : "/api/categorias", {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  categoriaForm.reset();
  loadCategorias();
};

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
        <button class="btn-small edit-btn" onclick="editPlato('${p._id}')">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/></svg>
          Editar
        </button>
        <button class="btn-small delete-btn" onclick="delPlato('${p._id}')">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14H7L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
          Borrar
        </button>
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

function editPlato(id) {
  fetch(`/api/platos/${id}`)
    .then((res) => res.json())
    .then((p) => {
      platoForm.id.value = p._id;
      platoForm.nombre.value = p.nombre;
      platoForm.precio.value = p.precio;
      platoForm.imagen.value = p.imagen;
      platoForm.descripcion.value = p.descripcion || "";
      if (p.categoria) {
        platoForm.categoria.value = p.categoria._id;
      } else {
        platoForm.categoria.value = "";
      }
    });
}

async function delPlato(id) {
  const confirmar = confirm("¿Estás seguro de que deseas borrar este plato?");
  if (!confirmar) return;

  await fetch(`/api/platos/${id}`, { method: "DELETE" });
  loadPlatos();
}

platoForm.onsubmit = async (e) => {
  e.preventDefault();
  const data = {
    nombre: platoForm.nombre.value,
    precio: parseFloat(platoForm.precio.value),
    imagen: platoForm.imagen.value,
    descripcion: platoForm.descripcion.value,
    categoria: platoForm.categoria.value || null, // permitir nulo si vacío
  };
  const id = platoForm.id.value;
  await fetch(id ? `/api/platos/${id}` : "/api/platos", {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  platoForm.reset();
  loadPlatos();
};

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
        <td>${c.fecha || "Sin fecha"}</td>
        <td>${c.total?.toFixed(2) ?? "0.00"}</td>
        <td><details><summary>Ver detalles</summary><ul>${detalles}</ul></details></td>
      </tr>`;
    })
    .join("");
}

