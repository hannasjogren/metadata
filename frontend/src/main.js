document.addEventListener('DOMContentLoaded', () => {
  const uploadForm = document.getElementById('uploadForm');
  const uploadResult = document.getElementById('uploadResult');
  const filterForm = document.getElementById('filterForm');
  const resultsBody = document.querySelector('#results tbody');

  const map = L.map('map').setView([56.05, 12.70], 6); // Ängelholm-ish
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(uploadForm);

    try {
      const res = await fetch('/upload', {
        method: 'POST',
        body: formData
      });
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
    } catch (err) {
      console.error('Fel vid hämtning av resultat:', err);
    }
  }

  function renderResults(results) {
    resultsBody.innerHTML = '';
    map.eachLayer(layer => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    results.forEach(file => {
      const tr = document.createElement('tr');

      // Miniatyr
      let thumb = '';
      if (file.filetype === 'pdf') {
        thumb = 'PDF';
      } else if (file.filetype.startsWith('image')) {
        thumb = `<img src="/uploads/${file.stored_name}" width="50">`;
      } else {
        thumb = 'Ingen';
      }

      // Preview
      let preview = '';
      if (file.filetype === 'pdf') {
        preview = `<iframe src="/uploads/${file.stored_name}" class="preview"></iframe>`;
      } else if (file.filetype.startsWith('image')) {
        preview = `<img src="/uploads/${file.stored_name}" width="200">`;
      } else {
        preview = 'Ingen förhandsvisning';
      }

      const downloadLink = `<a href="/uploads/${file.stored_name}" download="${file.filename}">Ladda ner</a>`;

      tr.innerHTML = `
        <td>${thumb}</td>
        <td>${file.filename}</td>
        <td>${file.filetype}</td>
        <td>${file.make || ''}</td>
        <td>${file.model || ''}</td>
        <td>${file.lens_model || ''}</td>
        <td>${file.date_original || file.creation_date || ''}</td>
        <td>${preview}</td>
        <td>${downloadLink}</td>
      `;
      resultsBody.appendChild(tr);

      // GPS
      if (file.gps_latitude && file.gps_longitude) {
        L.marker([file.gps_latitude, file.gps_longitude])
          .addTo(map)
          .bindPopup(file.filename);
      }
    });
  }

  fetchResults();
});
