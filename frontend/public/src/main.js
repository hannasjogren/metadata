// main.js
// Hanterar formulär för sökning och uppladdning

// Lyssnar på uppladdning
document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const response = await fetch("/upload", {
    method: "POST",
    body: formData,
  });

  const result = await response.text();
  document.getElementById("uploadResult").innerText = result;
});

// Lyssnar på sökformuläret
document.getElementById("searchForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = new FormData(e.target);
  const params = new URLSearchParams(form);

  const response = await fetch(`/search?${params.toString()}`);
  const data = await response.json();

  const tbody = document.querySelector("#results tbody");
  tbody.innerHTML = ""; // Rensa gamla resultat

  data.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.fileName || ""}</td>
      <td>${row.fileType || ""}</td>
      <td>${row.author || ""}</td>
      <td>${row.title || ""}</td>
      <td>${row.artist || ""}</td>
      <td>${row.date || ""}</td>
      <td>${row.contentPreview || ""}</td>
    `;
    tbody.appendChild(tr);
  });
});
