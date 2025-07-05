// Variables globales
let platos = []; // Lista de platos disponibles
let pedido = []; // Pedido actual (lo que el camarero va añadiendo)
let total = 0; // Total en euros del pedido actual

// Función para cargar los platos desde el servidor
async function cargarPlatos() {
  try {
    const res = await fetch("/public/platos");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const todos = await res.json();
    platos = todos.filter((p) => p.activo !== false);

    const cont = document.getElementById("items-menu");
    if (!Array.isArray(platos) || platos.length === 0) {
      cont.innerHTML = "<p>No hay platos disponibles.</p>";
      return;
    }

    initComanda();
  } catch (e) {
    console.error("Error cargando platos:", e);
    document.getElementById("items-menu").innerHTML =
      "<p>Error cargando los platos.</p>";
  }
}

// Renderiza todos los platos agrupados por categoría
function initComanda() {
  const cont = document.getElementById("items-menu");
  const indice = document.getElementById("indice-categorias");
  cont.innerHTML = "";
  indice.innerHTML = "";
  const grupos = {};

  platos.forEach((p) => {
    const cat = (p.categoria?.nombre || "Sin Categoría").toUpperCase();
    if (!grupos[cat]) grupos[cat] = [];
    grupos[cat].push(p);
  });

  Object.entries(grupos).forEach(([cat, lista]) => {
    const id = `cat-${cat.toLowerCase().replace(/\s+/g, "-")}`;

    // Enlace en el índice
    const link = document.createElement("a");
    link.href = `#${id}`;
    link.textContent = cat;
    indice.appendChild(link);

    // Contenedor de categoría
    const grupoDiv = document.createElement("div");
    grupoDiv.className = "categoria-grupo";
    grupoDiv.id = id;

    const titulo = document.createElement("h3");
    titulo.textContent = cat;
    const flecha = document.createElement("span");
    flecha.className = "flecha";
    titulo.appendChild(flecha);
    grupoDiv.appendChild(titulo);

    const contenido = document.createElement("div");
    contenido.className = "categoria-contenido abierto";
    const grid = document.createElement("div");
    grid.className = "menu-grid";

    lista.forEach((p) => {
      const item = document.createElement("div");
      item.className = "menu-item";
      item.innerHTML = `
        <img src="${p.imagen}" alt="${p.nombre}" class="item-img" />
        <h4 class="item-nombre">${p.nombre}</h4>
        ${p.descripcion ? `<p class="item-desc">${p.descripcion}</p>` : ""}
        <div class="item-footer">
          <span class="item-precio">${p.precio.toFixed(2)}€</span>
          <button onclick="agregarItem('${p._id}')">Añadir</button>
        </div>
      `;
      grid.appendChild(item);
    });

    contenido.appendChild(grid);
    grupoDiv.appendChild(contenido);
    cont.appendChild(grupoDiv);

    titulo.addEventListener("click", () => {
      const abierto = contenido.classList.toggle("abierto");
      flecha.classList.toggle("flecha-rotada", !abierto);
    });
  });

  actualizarResumen();
}

function agregarItem(id) {
  const plato = platos.find((p) => p._id === id);
  if (!plato) return;

  const existente = pedido.find((i) => i._id === id);
  if (existente) {
    existente.cantidad++;
  } else {
    pedido.push({ _id: id, cantidad: 1 });
  }

  total += plato.precio;
  actualizarResumen();
}

function eliminarUno(id) {
  const idx = pedido.findIndex((i) => i._id === id);
  if (idx === -1) return;

  const plato = platos.find((p) => p._id === id);
  pedido[idx].cantidad--;
  total -= plato.precio;
  if (pedido[idx].cantidad <= 0) pedido.splice(idx, 1);

  total = Math.max(0, total);
  actualizarResumen();
}

function eliminarTodos(id) {
  const idx = pedido.findIndex((i) => i._id === id);
  if (idx === -1) return;

  const plato = platos.find((p) => p._id === id);
  total -= pedido[idx].cantidad * plato.precio;
  pedido.splice(idx, 1);

  total = Math.max(0, total);
  actualizarResumen();
}

function actualizarResumen() {
  const lista = document.getElementById("lista-resumen");
  lista.innerHTML = "";

  pedido.forEach((i) => {
    const p = platos.find((x) => x._id === i._id);
    if (!p) return;
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${p.nombre} x${i.cantidad} - <b>${(p.precio * i.cantidad).toFixed(
      2
    )}€</b></span>
      <button onclick="eliminarUno('${i._id}')">-1</button>
      <button onclick="eliminarTodos('${i._id}')">🗑️</button>
    `;
    lista.appendChild(li);
  });

  document.getElementById("total").textContent = total.toFixed(2);
}

async function enviarComanda() {
  const mesaInput = document.getElementById("mesa").value.trim();
  if (!mesaInput) return alert("Indica el número de la mesa.");
  if (pedido.length === 0) return alert("Añade al menos un plato.");

  try {
    const res = await fetch("/api/comandas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mesa: mesaInput, platos: pedido, total }),
    });

    if (!res.ok) {
      const err = await res.json();
      return alert("Error: " + (err.error || res.status));
    }

    alert(`Comanda enviada - Mesa ${mesaInput}`);
    pedido = [];
    total = 0;
    actualizarResumen();
    document.getElementById("mesa").value = "";
  } catch (e) {
    console.error("Error al enviar comanda:", e);
    alert("Error al enviar la comanda.");
  }
}

window.addEventListener("DOMContentLoaded", cargarPlatos);

document.getElementById("busqueda")?.addEventListener("input", (e) => {
  const texto = e.target.value.toLowerCase().trim();
  const filtrados = texto
    ? platos.filter((p) => p.nombre.toLowerCase().includes(texto))
    : platos;

  renderPlatosFiltrados(filtrados);
});

function renderPlatosFiltrados(lista) {
  const cont = document.getElementById("items-menu");
  cont.innerHTML = "";

  const grupos = {};
  lista.forEach((p) => {
    const cat = (p.categoria?.nombre || "SIN CATEGORÍA").toUpperCase();
    if (!grupos[cat]) grupos[cat] = [];
    grupos[cat].push(p);
  });

  Object.entries(grupos).forEach(([cat, lista]) => {
    const grupoDiv = document.createElement("div");
    grupoDiv.className = "categoria-grupo";

    const titulo = document.createElement("h3");
    titulo.textContent = cat;
    const flecha = document.createElement("span");
    flecha.className = "flecha";
    titulo.appendChild(flecha);
    grupoDiv.appendChild(titulo);

    const contenido = document.createElement("div");
    contenido.className = "categoria-contenido abierto";
    const grid = document.createElement("div");
    grid.className = "menu-grid";

    lista.forEach((p) => {
      const item = document.createElement("div");
      item.className = "menu-item";
      item.innerHTML = `
        <img src="${p.imagen}" alt="${p.nombre}" class="item-img" />
        <h4 class="item-nombre">${p.nombre}</h4>
        <p class="item-desc">${p.descripcion}</p>
        <div class="item-footer">
          <span class="item-precio">${p.precio.toFixed(2)}€</span>
          <button onclick="agregarItem('${p._id}')">Añadir</button>
        </div>
      `;
      grid.appendChild(item);
    });

    contenido.appendChild(grid);
    grupoDiv.appendChild(contenido);
    cont.appendChild(grupoDiv);

    titulo.addEventListener("click", () => {
      const abierto = contenido.classList.toggle("abierto");
      flecha.classList.toggle("flecha-rotada", !abierto);
    });
  });
}
