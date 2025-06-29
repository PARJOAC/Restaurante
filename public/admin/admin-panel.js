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

// DATOS PLATOS
const platosBody = document.getElementById("platos-body");
const platoForm = document.getElementById("plato-form");

async function loadPlatos() {
  const res = await fetch("/api/platos");
  const items = res.ok ? await res.json() : [];
  platosBody.innerHTML = items
    .map(
      (p) => `
    <tr>
      <td><img src="${p.imagen}" alt="" /></td>
      <td>${p.nombre}</td>
      <td>${p.precio.toFixed(2)}</td>
      <td>
        <button onclick="editPlato('${p._id}')">Editar</button>
        <button onclick="delPlato('${p._id}')">Borrar</button>
      </td>
    </tr>`
    )
    .join("");
}

function editPlato(id) {
  fetch(`/api/platos/${id}`)
    .then((res) => res.json())
    .then((p) => {
      platoForm.id.value = p._id;
      platoForm.nombre.value = p.nombre;
      platoForm.precio.value = p.precio;
      platoForm.imagen.value = p.imagen;
      platoForm.descripcion.value = p.descripcion;
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

// DATOS COMANDAS
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
