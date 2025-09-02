// main.js
// Hanterar formulär för sökning och uppladdning

document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const resultEl = document.getElementById("uploadResult");

  try {
    const res = await fetch("http://localhost:3000/upload", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();
    resultEl.textContent = result.success
      ? "Uppladdning lyckades!"
      : `Misslyckades: ${result.error || "Okänt fel"}`;
  } catch (err) {
    resultEl.textContent = "Fel vid uppladdning.";
    console.error("Upload error:", err);
  }
});

document.getElementById("searchForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const loadingEl = document.getElementById("loading");
  const tbody = document.querySelector("#results tbody");
  loadingEl.style.display = "block";
  tbody.innerHTML = "";

  try {
    const res = await fetch("http://localhost:3000/search");
    const files = await res.json();

    if (files.length === 0) {
      tbody.innerHTML = "<tr><td colspan='3'>Inga filer hittades.</td></tr>";
    } else {
      files.forEach((file) => {
        tbody.innerHTML += renderFileRow(file);
      });
    }
  } catch (err) {
    console.error("Search error:", err);
    tbody.innerHTML = "<tr><td colspan='3'>Fel vid sökning.</td></tr>";
  } finally {
    loadingEl.style.display = "none";
  }
});

function renderFileRow(file) {
  let previewHTML = "-";

  if (file.mimetype.startsWith("image/")) {
    previewHTML = `
      <img src="http://localhost:3000/preview/${file.filename}" class="preview-img"><br>
      <a href="http://localhost:3000/download/${file.filename}" class="download-btn">Ladda ner</a>
    `;
  } else if (file.mimetype.startsWith("audio/")) {
    previewHTML = `
      <audio controls src="http://localhost:3000/preview/${file.filename}" class="preview-audio"></audio><br>
      <a href="http://localhost:3000/download/${file.filename}" class="download-btn">Ladda ner</a>
    `;
  } else if (file.mimetype === "application/pdf") {
    previewHTML = `
      <a href="http://localhost:3000/preview/${file.filename}" target="_blank" class="preview-pdf">Visa PDF</a><br>
      <a href="http://localhost:3000/download/${file.filename}" class="download-btn">Ladda ner</a>
    `;
  } else {
    previewHTML = `<a href="http://localhost:3000/download/${file.filename}" class="download-btn">Ladda ner</a>`;
  }

  return `
    <tr>
      <td>${file.filename}</td>
      <td>${file.mimetype}</td>
      <td>${previewHTML}</td>
    </tr>
  `;
}
