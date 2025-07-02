let todasLasComandas = [];
let mostrarFinalizadasActivas = false;

// Trae y actualiza las comandas periódicamente
async function cargarComandas() {
  try {
    const res = await fetch("/api/comandas");
    todasLasComandas = await res.json();
    renderizarComandas();
  } catch (e) {
    console.error("Error al cargar comandas:", e);
  }
}

// Renderiza las comandas en pantalla
function renderizarComandas() {
  const contAct = document.getElementById("comandas-activas");
  const contFin = document.getElementById("comandas-finalizadas");
  contAct.innerHTML = "";
  contFin.innerHTML = "";

  todasLasComandas.forEach((comanda, i) => {
    const div = document.createElement("div");
    div.className = `comanda ${claseEstado(comanda)}`;
    div.innerHTML = `
      <h2>Mesa ${comanda.mesa} - ${comanda.fecha}</h2>
      ${comanda.platos
        .map(
          (p, idx) => `
        <div class="plato">
          <button onclick="marcarPlato('${
            comanda._id
          }', ${idx})" class="btn-marca">
            ${p.ready < p.cantidad ? "✔" : "❌"}
          </button>
          <div><span>${p.cantidad} × ${
            p.plato?.nombre || "Desconocido"
          }</span><br/>

          <small>Hechos: ${p.ready} / ${p.cantidad}</small></div>
        </div>`
        )
        .join("")}
      <div class="estado">Estado: <span>${estadoComanda(comanda)}</span></div>
    `;
    const esFinal = estadoComanda(comanda) === "Finalizada";
    if (esFinal) {
      if (mostrarFinalizadasActivas) contFin.appendChild(div);
    } else {
      contAct.appendChild(div);
    }
  });
}

// Determina el estado (Nueva, En proceso, Finalizada)
function estadoComanda(comanda) {
  const total = comanda.platos.reduce((a, p) => a + p.cantidad, 0);
  const hechos = comanda.platos.reduce((a, p) => a + (p.ready || 0), 0);
  if (hechos === 0) return "Nueva";
  if (hechos >= total) return "Finalizada";
  return "En proceso";
}
function claseEstado(c) {
  const e = estadoComanda(c);
  return e === "Nueva"
    ? "nueva"
    : e === "Finalizada"
    ? "finalizada"
    : "en-proceso";
}

// Marca un plato como preparado
async function marcarPlato(comandaId, platoIndex) {
  const comanda = todasLasComandas.find((c) => c._id === comandaId);
  if (!comanda) return console.error("Comanda no encontrada");

  const p = comanda.platos[platoIndex];
  if (p.ready < p.cantidad) p.ready++;
  else return; // ya estaba completa

  try {
    // Envia PATCH al servidor con solo el plato actualizado
    await fetch(`/api/comandas/${comandaId}/plato`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platoIndex, nuevosHechos: p.ready }),
    });
    renderizarComandas();
  } catch (e) {
    console.error("Error al marcar plato:", e);
  }
}

// Alterna visibilidad de comandas finalizadas
function toggleFinalizadas() {
  mostrarFinalizadasActivas = !mostrarFinalizadasActivas;
  renderizarComandas();
}

// Inicialización
cargarComandas();
setInterval(cargarComandas, 10000);
