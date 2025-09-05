document.addEventListener('DOMContentLoaded', () => {
  const uploadForm = document.getElementById('uploadForm');
  const uploadResult = document.getElementById('uploadResult');
  const filterForm = document.getElementById('filterForm');
  const tbody = document.querySelector('#results tbody');

  // Bildförhandsvisning + metadata
  function renderTable(data) {
    tbody.innerHTML = '';
    data.forEach(file => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><img src="http://localhost:3001/uploads/${file.stored_name}" alt="${file.filename}" style="max-width: 100px;"></td>
        <td>${file.filename}</td>
        <td>${file.filetype}</td>
        <td>${file.make || ''}</td>
        <td>${file.model || ''}</td>
        <td>${file.lens_model || ''}</td>
        <td>${file.date_original ? file.date_original.split('T')[0] : ''}</td>
        <td>
          <a href="http://localhost:3001/uploads/${file.stored_name}" class="download-btn" download>
            Ladda ner
          </a>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  // GPS-karta med Leaflet
  function renderMap(data) {
    const mapContainer = document.getElementById('map');
    mapContainer.innerHTML = ''; // Rensa tidigare karta
    const map = L.map('map').setView([56.0, 14.0], 5); // Skåne som startpunkt

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    data.forEach(file => {
      if (file.gps_latitude && file.gps_longitude) {
        const marker = L.marker([file.gps_latitude, file.gps_longitude]).addTo(map);
        marker.bindPopup(`<strong>${file.filename}</strong><br>${file.model || ''}`);
      }
    });
  }

  // Ladda alla filer
  async function loadFiles() {
    try {
      const res = await fetch('http://localhost:3001/api/files');
      const data = await res.json();
      renderTable(data);
      renderMap(data);
    } catch (err) {
      console.error('Kunde inte hämta metadata:', err);
    }
  }

  // Filuppladdning
  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = uploadForm.querySelector('input[name="file"]');
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formData
      });
      const result = await res.json();
      uploadResult.textContent = result.message || 'Uppladdning klar';
      loadFiles();
    } catch (err) {
      uploadResult.textContent = 'Fel vid uppladdning';
      console.error(err);
    }
  });

  // Sökfunktion med filter
  filterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const params = new URLSearchParams(new FormData(filterForm)).toString();
    try {
      const res = await fetch(`http://localhost:3001/api/search?${params}`);
      const data = await res.json();
      renderTable(data);
      renderMap(data);
    } catch (err) {
      console.error('Kunde inte filtrera:', err);
    }
  });

  // Init
  loadFiles();
});
