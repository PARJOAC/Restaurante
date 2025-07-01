// Arrays para guardar los platos disponibles, el pedido actual y el total del pedido
let platos = [];
let pedido = [];
let total = 0;

// Carga los platos desde el servidor
async function cargarPlatos() {
  try {
    const res = await fetch("/public/platos"); // Solicita los platos al backend
    if (!res.ok) throw new Error(res.statusText); // Lanza error si hay fallo de red
    platos = await res.json(); // Almacena los platos en el array global

    // Si no hay platos disponibles, mostrar mensaje
    if (!Array.isArray(platos) || platos.length === 0) {
      document.getElementById("items-menu").innerHTML =
        "<p>No hay platos disponibles actualmente.</p>";
      return;
    }

    initComanda(); // Si todo va bien, inicializa el menú
  } catch (e) {
    console.error("Error cargando platos:", e);
    document.getElementById("items-menu").innerHTML =
      "<p>Error al cargar los platos.</p>";
  }
}

// Muestra los platos organizados por categoría
function initComanda() {
  const cont = document.getElementById("items-menu");
  cont.innerHTML = "";

  const grupos = {}; // Agrupar platos por categoría

  // Clasifica los platos
  platos.forEach((p) => {
    const cat = p.categoria?.nombre?.toUpperCase() || "SIN CATEGORÍA";
    if (!grupos[cat]) grupos[cat] = [];
    grupos[cat].push(p);
  });

  // Recorre cada categoría y la dibuja en pantalla
  for (const categoria in grupos) {
    const grupoDiv = document.createElement("div");
    grupoDiv.className = "categoria-grupo";

    const titulo = document.createElement("h3");
    titulo.textContent = categoria;

    const flecha = document.createElement("span");
    flecha.className = "flecha";
    titulo.appendChild(flecha);
    grupoDiv.appendChild(titulo);

    const contenido = document.createElement("div");
    contenido.className = "categoria-contenido abierto";

    const gridDiv = document.createElement("div");
    gridDiv.className = "menu-grid";

    // Añade cada plato dentro de su categoría
    grupos[categoria].forEach((p) => {
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
      gridDiv.appendChild(div);
    });

    contenido.appendChild(gridDiv);
    grupoDiv.appendChild(contenido);
    cont.appendChild(grupoDiv);

    // Alternar visibilidad al hacer clic en el título de la categoría
    titulo.addEventListener("click", () => {
      const abierto = contenido.classList.toggle("abierto");
      flecha.classList.toggle("flecha-rotada", !abierto);
    });
  }

  actualizarResumen(); // Muestra el resumen del pedido
}

// Agrega un plato al pedido
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

// Elimina una unidad del plato del pedido
function eliminarUno(nombre) {
  const index = pedido.findIndex((i) => i.nombre === nombre);
  if (index !== -1) {
    const precioUnidad = platos.find((p) => p.nombre === nombre).precio;
    pedido[index].cantidad -= 1;
    pedido[index].precio -= precioUnidad;
    total -= precioUnidad;

    if (pedido[index].cantidad <= 0) pedido.splice(index, 1);
    if (total < 0) total = 0;
    actualizarResumen();
  }
}

// Elimina todas las unidades de un plato
function eliminarTodos(nombre) {
  const index = pedido.findIndex((i) => i.nombre === nombre);
  if (index !== -1) {
    total -= pedido[index].precio;
    pedido.splice(index, 1);
    if (total < 0) total = 0;
    actualizarResumen();
  }
}

// Actualiza la lista de resumen del pedido
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
      </li>`
    )
    .join("");
  document.getElementById("total").textContent = total.toFixed(2);
}

// Envía la comanda al servidor
async function enviarComanda() {
  if (pedido.length === 0) return alert("Añade al menos un plato");

  const mesa = window.__mesa; // Se obtiene del HTML al cargar la página

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
