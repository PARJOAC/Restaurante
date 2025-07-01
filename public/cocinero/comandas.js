let todasLasComandas = [];

async function cargarComandas() {
  const res = await fetch("/api/comandas/cocina");
  const comandas = await res.json();
  todasLasComandas = comandas;
  renderizarComandas();
}

function renderizarComandas() {
  const contenedor = document.getElementById("comandas");
  contenedor.innerHTML = "";

  todasLasComandas.forEach((comanda, i) => {
    const div = document.createElement("div");
    div.classList.add("comanda");
    div.dataset.index = i;

    const platosHtml = comanda.platos
      .map((p, idx) => {
        const hechos = p.ready || 0;
        const total = p.cantidad;

        return `
          <div class="plato">
            <button onclick="marcarPlato(${i}, ${idx})" class="btn-marca">${
          hechos < total ? "✔" : "❌"
        }</button>
            <div>
              <span>${total} × ${p.nombre}</span><br/>
              <small>Hechos: ${hechos} / ${total}</small>
            </div>
          </div>`;
      })
      .join("");

    div.innerHTML = `
      <h2>Mesa ${comanda.mesa} - ${comanda.fecha}</h2>
      ${platosHtml}
      <div class="estado" id="estado-${i}">Estado: <span>${estadoComanda(
      comanda
    )}</span></div>`;

    div.classList.add(claseEstado(comanda));

    // Ocultar automáticamente si está finalizada
    if (estadoComanda(comanda) === "Finalizada" && !mostrarFinalizadasActivas) {
      div.style.display = "none";
    }

    contenedor.appendChild(div);
  });
}

function estadoComanda(comanda) {
  let total = 0;
  let hechos = 0;
  for (const p of comanda.platos) {
    total += p.cantidad;
    hechos += p.ready || 0;
  }
  if (hechos === 0) return "Nueva";
  if (hechos === total) return "Finalizada";
  return "En proceso";
}

function claseEstado(comanda) {
  const estado = estadoComanda(comanda);
  if (estado === "Nueva") return "nueva";
  if (estado === "Finalizada") return "finalizada";
  return "en-proceso";
}

async function marcarPlato(comandaIndex, platoIndex) {
  const comanda = todasLasComandas[comandaIndex];
  const plato = comanda.platos[platoIndex];

  if (!plato.ready) plato.ready = 1;
  else if (plato.ready < plato.cantidad) plato.ready++;
  else return;

  // Guardar cambios en servidor
  await fetch(`/api/comandas/${comanda._id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ platos: comanda.platos }),
  });

  renderizarComandas(); // Se vuelve a renderizar y ocultará si ya está finalizada
}

// Control de visualización finalizadas
let mostrarFinalizadasActivas = false;

function ocultarFinalizadas() {
  mostrarFinalizadasActivas = false;
  renderizarComandas();
}

function mostrarFinalizadas() {
  mostrarFinalizadasActivas = true;
  renderizarComandas();
}

cargarComandas();
setInterval(() => {
  cargarComandas();
  console.log("Actualizando comandas...");
}, 10000);
