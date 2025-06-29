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
        "<p>No hay platos disponibles actualmente.</p>";
      return;
    }
    initComanda();
  } catch (e) {
    console.error("Error cargando platos:", e);
    document.getElementById("items-menu").innerHTML =
      "<p>Error al cargar los platos.</p>";
  }
}

function initComanda() {
  const cont = document.getElementById("items-menu");
  cont.innerHTML = "";
  platos.forEach((p) => {
    const div = document.createElement("div");
    div.className = "menu-item";
    div.innerHTML = `
      <img src="${p.imagen}" alt="${p.nombre}" class="item-img" />
      <h4 class="item-nombre">${p.nombre}</h4>
      ${p.descripcion ? `<p class="item-desc">${p.descripcion}</p>` : ""}
      <div class="item-footer">
        <span class="item-precio">€${p.precio.toFixed(2)}</span>
        <button type="button" onclick="agregarItem('${p._id}')">Añadir</button>
      </div>
    `;
    cont.appendChild(div);
  });
  actualizarResumen();
}

function agregarItem(id) {
  const p = platos.find((x) => x._id === id);
  const existente = pedido.find((i) => i.nombre === p.nombre);
  if (existente) {
    existente.cantidad += 1;
    existente.precio += p.precio;
  } else {
    pedido.push({ nombre: p.nombre, cantidad: 1, precio: p.precio });
  }
  total += p.precio;
  actualizarResumen();
}

function eliminarUno(nombre) {
  const index = pedido.findIndex((i) => i.nombre === nombre);
  if (index !== -1) {
    pedido[index].cantidad -= 1;
    pedido[index].precio -= platos.find((p) => p.nombre === nombre).precio;
    total -= platos.find((p) => p.nombre === nombre).precio;

    if (pedido[index].cantidad <= 0) {
      pedido.splice(index, 1);
    }
    if (total < 0) total = 0;
    actualizarResumen();
  }
}

function eliminarTodos(nombre) {
  const index = pedido.findIndex((i) => i.nombre === nombre);
  if (index !== -1) {
    total -= pedido[index].precio;
    pedido.splice(index, 1);
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
        <button title="Eliminar 1" onclick="eliminarUno('${
          i.nombre
        }')">-1</button>
        <button title="Eliminar todas" onclick="eliminarTodos('${
          i.nombre
        }')">🗑️</button>
      </li>
    `
    )
    .join("");
  document.getElementById("total").textContent = total.toFixed(2);
}

async function enviarComanda() {
  if (pedido.length === 0) return alert("Añade al menos un plato");

  const mesa = window.__mesa;

  if (!mesa) {
    alert("Error: no se detectó el número de mesa.");
    return;
  }

  try {
    const res = await fetch("/api/comandas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mesa, platos: pedido, total }),
    });
    if (res.ok) {
      alert(`Comanda enviada - Mesa ${mesa}`);
      pedido = [];
      total = 0;
      actualizarResumen();
    } else {
      const error = await res.json();
      alert("Error: " + (error.message || res.status));
    }
  } catch (e) {
    console.error(e);
    alert("Error al enviar la comanda");
  }
}
