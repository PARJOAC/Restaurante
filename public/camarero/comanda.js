// Variables globales
let platos = []; // Lista de platos disponibles
let pedido = []; // Pedido actual (lo que el camarero va añadiendo)
let total = 0; // Total en euros del pedido actual

// Función para cargar los platos desde el servidor
async function cargarPlatos() {
  try {
    const res = await fetch("/public/platos"); // Petición GET a la API pública
    if (!res.ok) throw new Error(res.statusText); // Error si falla
    let todos = await res.json(); // Se guardan los platos en la variable global

    platos = todos.filter((p) => p.activo !== false);
    // Si no hay platos, mostrar mensaje
    if (!Array.isArray(platos) || platos.length === 0) {
      document.getElementById("items-menu").innerHTML =
        "<p>No hay platos disponibles.</p>";
      return;
    }

    // Si hay platos, inicializar la carta
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
  cont.innerHTML = "";
  const grupos = {}; // Diccionario por categoría

  // Agrupar platos por categoría
  platos.forEach((p) => {
    const cat = p.categoria?.nombre?.toUpperCase() || "SIN CATEGORÍA";
    if (!grupos[cat]) grupos[cat] = [];
    grupos[cat].push(p);
  });

  // Crear HTML por cada grupo de categoría
  for (const cat in grupos) {
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

    // Añadir cada plato como tarjeta
    grupos[cat].forEach((p) => {
      const div = document.createElement("div");
      div.className = "menu-item";
      div.innerHTML = `
        <img src="${p.imagen}" alt="${p.nombre}" class="item-img" />
        <h4 class="item-nombre">${p.nombre}</h4>
        ${p.descripcion ? `<p class="item-desc">${p.descripcion}</p>` : ""}
        <div class="item-footer">
          <span class="item-precio">${p.precio.toFixed(2)}€</span>
          <button onclick="agregarItem('${p._id}')">Añadir</button>
        </div>`;
      grid.appendChild(div);
    });

    contenido.appendChild(grid);
    grupoDiv.appendChild(contenido);
    cont.appendChild(grupoDiv);

    // Al hacer clic en el título, se colapsa el grupo
    titulo.addEventListener("click", () => {
      const abierto = contenido.classList.toggle("abierto");
      flecha.classList.toggle("flecha-rotada", !abierto);
    });
  }

  actualizarResumen();
}

// Añadir un plato al pedido
function agregarItem(id) {
  const p = platos.find((x) => x._id === id);
  const ex = pedido.find((i) => i._id === id);

  if (ex) {
    ex.cantidad++;
  } else {
    pedido.push({ _id: id, cantidad: 1 });
  }

  total += p.precio;
  actualizarResumen();
}

// Eliminar una unidad de un plato del pedido
function eliminarUno(id) {
  const idx = pedido.findIndex((i) => i._id === id);
  if (idx !== -1) {
    const p = platos.find((x) => x._id === id);
    pedido[idx].cantidad--;
    total -= p.precio;

    if (pedido[idx].cantidad <= 0) pedido.splice(idx, 1);
    if (total < 0) total = 0;

    actualizarResumen();
  }
}

// Eliminar completamente un plato del pedido
function eliminarTodos(id) {
  const idx = pedido.findIndex((i) => i._id === id);
  if (idx !== -1) {
    const p = platos.find((x) => x._id === id);
    total -= pedido[idx].cantidad * p.precio;
    pedido.splice(idx, 1);
    if (total < 0) total = 0;
    actualizarResumen();
  }
}

// Mostrar el resumen del pedido en el panel derecho
function actualizarResumen() {
  const lista = document.getElementById("lista-resumen");
  lista.innerHTML = pedido
    .map((i) => {
      const p = platos.find((x) => x._id === i._id);
      return `
      <li>
        <span>${p.nombre} x${i.cantidad} - <b>${(p.precio * i.cantidad).toFixed(
        2
      )}€</b></span>
        <button onclick="eliminarUno('${i._id}')">-1</button>
        <button onclick="eliminarTodos('${i._id}')">🗑️</button>
      </li>`;
    })
    .join("");
  document.getElementById("total").textContent = total.toFixed(2);
}

// Enviar la comanda al backend
async function enviarComanda() {
  const mesaInput = document.getElementById("mesa").value.trim();
  if (!mesaInput) return alert("Indica el número de la mesa.");
  if (pedido.length === 0)
    return alert("Añade al menos un plato a la comanda.");

  try {
    const res = await fetch("/api/comandas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mesa: mesaInput, platos: pedido, total }),
    });

    if (res.ok) {
      alert(`Comanda enviada - Mesa ${mesaInput}`);
      pedido = [];
      total = 0;
      actualizarResumen();
      document.getElementById("mesa").value = "";
    } else {
      const err = await res.json();
      alert("Error: " + (err.error || res.status));
    }
  } catch (e) {
    console.error(e);
    alert("Error enviando la comanda.");
  }
}

// Cuando carga el DOM, empieza cargando los platos
window.addEventListener("DOMContentLoaded", cargarPlatos);

// Escuchar cambios en el input de búsqueda
document.getElementById("busqueda").addEventListener("input", (e) => {
  const texto = e.target.value.toLowerCase().trim();
  const filtrados = texto
    ? platos.filter((p) => p.nombre.toLowerCase().includes(texto))
    : platos;

  renderPlatosFiltrados(filtrados);
});

// Función para renderizar platos filtrados por nombre
function renderPlatosFiltrados(lista) {
  const cont = document.getElementById("items-menu");
  cont.innerHTML = "";

  const grupos = {};

  lista.forEach((p) => {
    const cat = p.categoria?.nombre?.toUpperCase() || "SIN CATEGORÍA";
    if (!grupos[cat]) grupos[cat] = [];
    grupos[cat].push(p);
  });

  for (const cat in grupos) {
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

    grupos[cat].forEach((p) => {
      const div = document.createElement("div");
      div.className = "menu-item";
      div.innerHTML = `
        <img src="${p.imagen}" alt="${p.nombre}" class="item-img" />
        <h4 class="item-nombre">${p.nombre}</h4>
        ${p.descripcion ? `<p class="item-desc">${p.descripcion}</p>` : ""}
        <div class="item-footer">
          <span class="item-precio">${p.precio.toFixed(2)}€</span>
          <button onclick="agregarItem('${p._id}')">Añadir</button>
        </div>`;
      grid.appendChild(div);
    });

    contenido.appendChild(grid);
    grupoDiv.appendChild(contenido);
    cont.appendChild(grupoDiv);

    titulo.addEventListener("click", () => {
      const abierto = contenido.classList.toggle("abierto");
      flecha.classList.toggle("flecha-rotada", !abierto);
    });
  }
}
