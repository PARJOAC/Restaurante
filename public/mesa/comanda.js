// Variables globales
let platos = [];
let pedido = [];
let total = 0;

// Inicia el pedido cuando el DOM está cargado
function iniciarPedido() {
  cargarPlatos();
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciarPedido);
} else {
  iniciarPedido();
}

// Carga platos desde backend
async function cargarPlatos() {
  try {
    const res = await fetch("/public/platos");
    if (!res.ok) throw new Error(res.statusText);
    let todos = await res.json();

    platos = todos.filter((p) => p.activo !== false);

    const cont = document.getElementById("items-menu");
    if (!Array.isArray(platos) || platos.length === 0) {
      cont.innerHTML = "<p>No hay platos disponibles actualmente.</p>";
      return;
    }
    initComanda();
  } catch (e) {
    console.error("Error cargando platos:", e);
    document.getElementById("items-menu").innerHTML =
      "<p>Error al cargar los platos, inténtalo más tarde.</p>";
  }
}

// Dibuja platos agrupados por categoría
function initComanda() {
  const cont = document.getElementById("items-menu");
  cont.innerHTML = "";
  const grupos = {};
  platos.forEach((p) => {
    const cat = p.categoria?.nombre?.toUpperCase() || "SIN CATEGORÍA";
    grupos[cat] = grupos[cat] || [];
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

    const contCat = document.createElement("div");
    contCat.className = "categoria-contenido abierto";
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
          <button type="button" onclick="agregarItem('${
            p._id
          }')">Añadir</button>
        </div>
      `;
      grid.appendChild(div);
    });

    contCat.appendChild(grid);
    grupoDiv.appendChild(contCat);
    cont.appendChild(grupoDiv);

    titulo.addEventListener("click", () => {
      const abierto = contCat.classList.toggle("abierto");
      flecha.classList.toggle("flecha-rotada", !abierto);
    });
  }
  actualizarResumen();
}

// Añade plato al pedido
function agregarItem(id) {
  const p = platos.find((x) => x._id === id);
  if (!p) return;
  const ex = pedido.find((i) => i._id === id);
  if (ex) {
    ex.cantidad++;
    ex.precio += p.precio;
  } else {
    pedido.push({ _id: id, nombre: p.nombre, cantidad: 1, precio: p.precio });
  }
  total += p.precio;
  actualizarResumen();
}

// Elimina unidad
function eliminarUno(id) {
  const idx = pedido.findIndex((i) => i._id === id);
  if (idx === -1) return;
  const p = platos.find((x) => x._id === id);
  pedido[idx].cantidad--;
  pedido[idx].precio -= p.precio;
  total -= p.precio;
  if (pedido[idx].cantidad <= 0) pedido.splice(idx, 1);
  if (total < 0) total = 0;
  actualizarResumen();
}

// Elimina todas
function eliminarTodos(id) {
  const idx = pedido.findIndex((i) => i._id === id);
  if (idx === -1) return;
  total -= pedido[idx].precio;
  pedido.splice(idx, 1);
  if (total < 0) total = 0;
  actualizarResumen();
}

// Actualiza resumen en pantalla
function actualizarResumen() {
  const lista = document.getElementById("lista-resumen");
  lista.innerHTML = pedido
    .map(
      (i) => `
    <li>
      <span>${i.nombre} x${i.cantidad} - <b>${i.precio.toFixed(2)}€</b></span>
      <button onclick="eliminarUno('${i._id}')">-1</button>
      <button onclick="eliminarTodos('${i._id}')">🗑️</button>
    </li>`
    )
    .join("");
  document.getElementById("total").textContent = total.toFixed(2);
}

// Envía comanda al servidor
async function enviarComanda() {
  if (pedido.length === 0) return alert("Añade al menos un plato.");
  const mesa = window.__mesa;
  if (!mesa) return alert("No se detecta mesa.");

  try {
    const res = await fetch("/api/comandas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mesa,
        platos: pedido.map((i) => ({ _id: i._id, cantidad: i.cantidad })),
        total,
      }),
    });
    if (res.ok) {
      alert(`Comanda enviada. Mesa: ${mesa}`);
      pedido = [];
      total = 0;
      actualizarResumen();
    } else {
      const e = await res.json();
      alert("Error: " + (e.message || res.status));
    }
  } catch (e) {
    console.error("Error enviando comanda:", e);
    alert("Error al enviar la comanda. Inténtalo más tarde.");
  }
}
