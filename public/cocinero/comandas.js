// Lista que contiene todas las comandas cargadas desde el servidor
let todasLasComandas = [];

// Variable que indica si se deben mostrar las comandas finalizadas
let mostrarFinalizadasActivas = false;

// Función para cargar las comandas desde el backend
async function cargarComandas() {
  const res = await fetch("/api/comandas/cocina"); // Llamada al backend
  const comandas = await res.json(); // Conversión de respuesta a JSON
  todasLasComandas = comandas; // Se actualiza la lista global
  renderizarComandas(); // Se muestran en pantalla
}

// Función para renderizar las comandas en el DOM
function renderizarComandas() {
  const contenedorActivas = document.getElementById("comandas-activas");
  const contenedorFinalizadas = document.getElementById("comandas-finalizadas");

  // Limpia los contenedores para volver a pintarlos
  contenedorActivas.innerHTML = "";
  contenedorFinalizadas.innerHTML = "";

  // Recorre todas las comandas y las pinta en su respectivo contenedor
  todasLasComandas.forEach((comanda, i) => {
    const div = document.createElement("div");
    div.classList.add("comanda");
    div.dataset.index = i; // Guardamos el índice para identificarla luego

    // Se generan los botones y la información de los platos de la comanda
    const platosHtml = comanda.platos
      .map((p, idx) => {
        const hechos = p.ready || 0;
        const total = p.cantidad;
        return `
        <div class="plato">
          <button onclick="marcarPlato(${i}, ${idx})" class="btn-marca">${
          hechos < total ? "✔" : "❌" // Muestra ✔ si aún faltan, ❌ si están todos listos
        }</button>
          <div>
            <span>${total} × ${p.nombre}</span><br/>
            <small>Hechos: ${hechos} / ${total}</small>
          </div>
        </div>`;
      })
      .join("");

    // Se compone el HTML principal de la comanda
    div.innerHTML = `
      <h2>Mesa ${comanda.mesa} - ${comanda.fecha}</h2>
      ${platosHtml}
      <div class="estado" id="estado-${i}">Estado: <span>${estadoComanda(
      comanda
    )}</span></div>`;

    // Añadimos la clase visual según el estado de la comanda
    const clase = claseEstado(comanda);
    div.classList.add(clase);

    // Se añade la comanda al contenedor adecuado según su estado
    const esFinalizada = estadoComanda(comanda) === "Finalizada";
    if (esFinalizada) {
      if (mostrarFinalizadasActivas) contenedorFinalizadas.appendChild(div);
    } else {
      contenedorActivas.appendChild(div);
    }
  });
}

// Devuelve el estado actual de una comanda: Nueva / En proceso / Finalizada
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

// Devuelve la clase CSS correspondiente según el estado
function claseEstado(comanda) {
  const estado = estadoComanda(comanda);
  if (estado === "Nueva") return "nueva";
  if (estado === "Finalizada") return "finalizada";
  return "en-proceso";
}

// Función para marcar un plato como hecho
async function marcarPlato(comandaIndex, platoIndex) {
  const comanda = todasLasComandas[comandaIndex];
  const plato = comanda.platos[platoIndex];

  // Lógica para incrementar el número de platos hechos
  if (!plato.ready) plato.ready = 1;
  else if (plato.ready < plato.cantidad) plato.ready++;
  else return; // Si ya están todos hechos, no hace nada

  // Se envía la actualización al servidor
  await fetch(`/api/comandas/${comanda._id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ platos: comanda.platos }),
  });

  // Se vuelve a renderizar la lista con los cambios
  renderizarComandas();
}

// Alterna la visualización de las comandas finalizadas
function toggleFinalizadas() {
  mostrarFinalizadasActivas = !mostrarFinalizadasActivas;
  renderizarComandas(); // Se vuelve a pintar según la nueva configuración
}

// Al cargar la página, se obtienen las comandas
cargarComandas();

// Refresca automáticamente las comandas cada 10 segundos
setInterval(() => {
  cargarComandas();
}, 10000);
