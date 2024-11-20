const platos = [
    { nombre: "Alitas / Wings", precio: 9 },
    { nombre: "Rabas / Fried Squid", precio: 9 },
    { nombre: "Aros de Cebolla / Onion Rings", precio: 9 },
    { nombre: "Queso Cheddar / Cheddar Cheese", precio: 9 },
    { nombre: "Croquetas / Croquettes", precio: 9 },
    { nombre: "Burger de Pollo / Chicken Burger", precio: 9 },
    { nombre: "Patatas Fritas / Fries", precio: 5 },
    { nombre: "Pizza BBQ", precio: 10 },
    { nombre: "Pizza Pepperoni", precio: 10 },
    { nombre: "Pizza Salami", precio: 10 },
    { nombre: "Pizza 4 Quesos / Four Cheese Pizza", precio: 10 }
];

const menu = document.getElementById("menu");
const comandas = document.getElementById("comandas");
const totalElement = document.getElementById("total");

const renderizarMenu = () => {
    menu.innerHTML = "";
    platos.forEach((plato, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
        <td>${plato.nombre}</td>
        <td>${plato.precio.toFixed(2)} €</td>
        <td><input type="number" id="cantidad-${index}" value="0" min="0" onchange="calcularTotal()"></td>
      `;
        menu.appendChild(row);
    });
};

const calcularTotal = () => {
    let total = 0;
    platos.forEach((plato, index) => {
        const cantidadInput = document.getElementById(`cantidad-${index}`);
        const cantidad = Math.max(0, parseInt(cantidadInput.value) || 0);
        cantidadInput.value = cantidad;
        total += cantidad * plato.precio;
    });
    totalElement.textContent = total.toFixed(2);
};

const resetCantidades = () => {
    platos.forEach((plato, index) => {
        const cantidadInput = document.getElementById(`cantidad-${index}`);
        cantidadInput.value = 0;
    });
    calcularTotal();
};

const guardarComanda = async () => {
    const nuevaComanda = { platos: [], total: 0 };

    platos.forEach((plato, index) => {
        const cantidad = parseInt(document.getElementById(`cantidad-${index}`).value) || 0;
        if (cantidad > 0) {
            nuevaComanda.platos.push({
                nombre: plato.nombre,
                cantidad,
                precio: plato.precio
            });
            nuevaComanda.total += cantidad * plato.precio;
        }
    });

    if (nuevaComanda.platos.length > 0) {
        try {
            const response = await fetch('/api/comandas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevaComanda)
            });
            if (response.ok) {
                alert("Comanda guardada con éxito.");
                resetCantidades();
                mostrarComandas();
            } else {
                const errorData = await response.json();
                alert(`Error al guardar la comanda: ${errorData.details}`);
            }
        } catch (err) {
            alert("No se pudo conectar al servidor." + err);
        }
    } else {
        alert("Selecciona al menos un plato.");
    }
};

const mostrarComandas = async () => {
    try {
        const response = await fetch('/api/comandas');
        if (response.ok) {
            const comandasData = await response.json();
            comandas.innerHTML = '';
            comandasData.forEach(comanda => {
                const comandaDiv = document.createElement('div');
                comandaDiv.classList.add('comanda');
                comandaDiv.innerHTML = `
          <h3>Comanda ${comanda.identificador}</h3>
          ${comanda.platos.map(plato => `
            <div>
              <span>${plato.nombre} (${plato.cantidad} x ${plato.precio.toFixed(2)} €)</span>
              <span>${(plato.cantidad * plato.precio).toFixed(2)} €</span>
            </div>
          `).join('')}
          <div class="total">Fecha: ${comanda.fecha.toFixed(2)}</div>
          <div class="total">Total: ${comanda.total.toFixed(2)} €</div>
          <button class="btn btn-danger" onclick="eliminarComanda('${comanda.identificador}')">Eliminar</button>
        `;
                comandas.appendChild(comandaDiv);
            });
        }
    } catch (err) {
        alert("No se pudo obtener las comandas.");
    }
};


const eliminarComanda = async (id) => {
    try {
        const response = await fetch(`/api/comandas/${id}`, { method: 'DELETE' });
        if (response.ok) {
            alert("Comanda eliminada.");
            mostrarComandas();
        } else {
            alert("Error al eliminar la comanda.");
        }
    } catch (err) {
        alert("No se pudo conectar al servidor.");
    }
};

const eliminarTodasLasComandas = async () => {
    try {
        const response = await fetch('/api/comandas', { method: 'DELETE' });
        if (response.ok) {
            alert("Todas las comandas eliminadas.");
            mostrarComandas();
        } else {
            alert("Error al eliminar todas las comandas.");
        }
    } catch (err) {
        alert("No se pudo conectar al servidor.");
    }
};

document.addEventListener('DOMContentLoaded', () => {
    renderizarMenu();
    mostrarComandas();
    calcularTotal();
});
