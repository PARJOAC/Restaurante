import QrScanner from "https://cdn.jsdelivr.net/npm/qr-scanner@1.4.2/qr-scanner.min.js";

let scanner;

window.iniciarEscaneo = async () => {
  const video = document.getElementById("video");
  const resultDiv = document.getElementById("scan-result");
  video.style.display = "block";

  scanner = new QrScanner(video, (result) => {
    resultDiv.textContent = "Estás siendo redirigido...";
    scanner.stop();
    video.style.display = "none";

    setTimeout(() => {
      window.location.href = result;
    }, 1500);
  });

  try {
    await scanner.start();
  } catch (e) {
    resultDiv.textContent = "No se pudo acceder a la cámara.";
    console.error(e);
  }
};
