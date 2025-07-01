let platos = [];
let pedido = [];
let total = 0;

async function cargarPlatos() {
  try {
    const res = await fetch("/public/platos");
    if (!res.ok) throw new Error(res.statusText);
    platos = await res.json();
    if (!Array.isArray(platos) || platos.length === 0) {
      document.getElementById("items-menu").innerHTML =
        "<p>No hay platos disponibles</p>";
      return;
    }
    initComanda();
  } catch (e) {
    console.error("Error cargando platos:", e);
    document.getElementById("items-menu").innerHTML =
      "<p>Error cargando platos</p>";
  }
}

function initComanda() {
  const cont = document.getElementById("items-menu");
  cont.innerHTML = "";
  const grupos = {};

  platos.forEach((p) => {
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

  actualizarResumen();
}

function agregarItem(id) {
  const p = platos.find((x) => x._id === id);
  const ex = pedido.find((i) => i.nombre === p.nombre);
  if (ex) {
    ex.cantidad++;
    ex.precio += p.precio;
  } else {
    pedido.push({ nombre: p.nombre, cantidad: 1, precio: p.precio });
  }
  total += p.precio;
  actualizarResumen();
}

function eliminarUno(nombre) {
  const idx = pedido.findIndex((i) => i.nombre === nombre);
  if (idx !== -1) {
    const p = platos.find((x) => x.nombre === nombre);
    pedido[idx].cantidad--;
    pedido[idx].precio -= p.precio;
    total -= p.precio;
    if (pedido[idx].cantidad <= 0) pedido.splice(idx, 1);
    if (total < 0) total = 0;
    actualizarResumen();
  }
}

function eliminarTodos(nombre) {
  const idx = pedido.findIndex((i) => i.nombre === nombre);
  if (idx !== -1) {
    total -= pedido[idx].precio;
    pedido.splice(idx, 1);
    if (total < 0) total = 0;
    actualizarResumen();
  }
}

function actualizarResumen() {
  const lista = document.getElementById("lista-resumen");
  lista.innerHTML = pedido
    .map(
      (i) => `
    <li>
      <span>${i.nombre} x${i.cantidad} - <b>${i.precio.toFixed(2)}€</b></span>
      <button onclick="eliminarUno('${i.nombre}')">-1</button>
      <button onclick="eliminarTodos('${i.nombre}')">🗑️</button>
    </li>`
    )
    .join("");
  document.getElementById("total").textContent = total.toFixed(2);
}

async function enviarComanda() {
  const mesaInput = document.getElementById("mesa").value.trim();
  if (!mesaInput) return alert("Indica el número de mesa");
  if (pedido.length === 0) return alert("Añade al menos un plato");

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
    alert("Error enviando comanda");
  }
}

window.addEventListener("DOMContentLoaded", cargarPlatos);
