document.addEventListener('DOMContentLoaded', () => {
  const uploadForm = document.getElementById('uploadForm');
  const uploadResult = document.getElementById('uploadResult');
  const filterForm = document.getElementById('filterForm');

  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(uploadForm);

    try {
      const res = await fetch('/upload', { method: 'POST', body: formData });
      const data = await res.json();
      uploadResult.textContent = data.message || 'Uppladdning klar.';
      fetchResults();
    } catch (err) {
      console.error(err);
      uploadResult.textContent = 'Fel vid uppladdning.';
    }
  });

  filterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    fetchResults(new FormData(filterForm));
  });

  async function fetchResults(formData) {
    let query = '';
    if (formData) {
      const params = new URLSearchParams();
      for (const [key, value] of formData.entries()) {
        if (value) params.append(key, value);
      }
      query = '?' + params.toString();
    }

    try {
      const res = await fetch('/api/search' + query);
      const results = await res.json();
      renderResults(results);
      renderMap(results);
    } catch (err) {
      console.error('Fel vid hämtning av resultat:', err);
    }
  }

  function renderResults(results) {
    const tbody = document.querySelector('#results tbody');
    tbody.innerHTML = '';

    results.forEach(file => {
      const tr = document.createElement('tr');

      const thumb = file.filetype === 'pdf'
        ? `<a href="/pdf/${file.filename}" target="_blank">Visa PDF</a>`
        : `<img src="/uploads/${file.stored_name}" width="50" class="preview">`;

      let preview = '';
      if (file.filetype === 'pdf') {
        preview = `<pre class="pdf-text">${file.content_preview || ''}</pre>`;
      } else if (file.filetype.startsWith('image')) {
        preview = `<img src="/uploads/${file.stored_name}" width="200" class="preview">`;
      } else {
        preview = 'Ingen förhandsvisning';
      }

      const downloadLink = `<a href="/uploads/${file.stored_name}" download="${file.filename}">Ladda ner</a>`;

      tr.innerHTML = `
        <td>${thumb}</td>
        <td>${file.filename}</td>
        <td>${file.filetype}</td>
        <td>${file.camera || ''}</td>
        <td>${file.model || ''}</td>
        <td>${file.lens || ''}</td>
        <td>${file.creation_date || file.date_original || ''}</td>
        <td>${preview}</td>
        <td>${downloadLink}</td>
      `;

      tbody.appendChild(tr);
    });
  }

  function renderMap(results) {
    const mapDiv = document.getElementById('map');
    mapDiv.innerHTML = ''; // Rensa gamla markers
    const map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    results.forEach(file => {
      if (file.latitude && file.longitude) {
        L.marker([file.latitude, file.longitude]).addTo(map)
          .bindPopup(`<b>${file.filename}</b>`);
      }
    });
  }

  fetchResults();
});
