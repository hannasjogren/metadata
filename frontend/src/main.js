document.addEventListener('DOMContentLoaded', () => {
  const uploadForm = document.getElementById('uploadForm');
  const uploadResult = document.getElementById('uploadResult');
  const filterForm = document.getElementById('filterForm');
  const resultsBody = document.querySelector('#results tbody');
  const musicBody = document.querySelector('#musicResults tbody');
  const pdfBody = document.querySelector('#pdfResults tbody');
  const officeBody = document.querySelector('#officeResults tbody');

  const map = L.map('map').setView([56.05, 12.70], 6);
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
      fetchMusic();
      fetchOfficeFiles();
      fetchPdfFiles();
    } catch (err) {
      console.error(err);
      uploadResult.textContent = 'Fel vid uppladdning.';
    }
  });

  filterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    fetchResults(new FormData(filterForm));
  });

  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) return '';
    return date.toISOString().slice(0, 10);
  }

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
      if (file.filetype === 'pdf') return;

      const tr = document.createElement('tr');

      let preview = '';
      if (file.filetype.startsWith('image')) {
        preview = `<img src="/uploads/${file.stored_name}" width="200">`;
      } else {
        preview = 'Ingen förhandsvisning';
      }

      const downloadLink = `<a href="/uploads/${file.stored_name}" download="${file.filename}">Ladda ner</a>`;

      tr.innerHTML = `
        <td>${file.filename}</td>
        <td>${file.filetype}</td>
        <td>${file.make || ''}</td>
        <td>${file.model || ''}</td>
        <td>${file.lens_model || ''}</td>
        <td>${formatDate(file.date_original || file.creation_date)}</td>
        <td>${preview}</td>
        <td>${downloadLink}</td>
      `;
      resultsBody.appendChild(tr);

      if (file.gps_latitude && file.gps_longitude) {
        L.marker([file.gps_latitude, file.gps_longitude])
          .addTo(map)
          .bindPopup(file.filename);
      }
    });
  }

  async function fetchPdfFiles() {
    try {
      const res = await fetch('/api/search?filetype=pdf');
      const files = await res.json();
      pdfBody.innerHTML = '';

      files.forEach(file => {
        const tr = document.createElement('tr');
        const safeFilename = encodeURIComponent(file.filename);

        const preview = `<iframe src="/uploads/${file.stored_name}" class="preview"></iframe>`;
        const downloadLink = `<a href="/uploads/${file.stored_name}" download="${file.filename}">Ladda ner</a>`;

        tr.innerHTML = `
          <td>${file.filename}</td>
          <td>${file.filetype}</td>
          <td>${formatDate(file.creation_date)}</td>
          <td>${preview}</td>
          <td>${downloadLink}</td>
        `;
        pdfBody.appendChild(tr);
      });
    } catch (err) {
      console.error('Fel vid hämtning av PDF-filer:', err);
    }
  }

  async function fetchMusic() {
    try {
      const res = await fetch('/api/music');
      const tracks = await res.json();
      musicBody.innerHTML = '';

      tracks.forEach(track => {
        const tr = document.createElement('tr');
        const safeFilename = encodeURIComponent(track.filename);

        tr.innerHTML = `
          <td>${track.filename}</td>
          <td>${track.artist || ''}</td>
          <td>${track.title || ''}</td>
          <td>${track.year || ''}</td>
          <td>
            <audio controls preload="none">
              <source src="/audio/${safeFilename}" type="audio/mpeg">
              Din webbläsare stöder inte ljuduppspelning.
            </audio>
          </td>
        `;
        musicBody.appendChild(tr);
      });
    } catch (err) {
      console.error('Fel vid hämtning av musik:', err);
    }
  }

  async function fetchOfficeFiles() {
    try {
      const res = await fetch('/api/office');
      const files = await res.json();
      officeBody.innerHTML = '';

      files.forEach(file => {
        const tr = document.createElement('tr');
        const safeFilename = encodeURIComponent(file.filename);

        tr.innerHTML = `
          <td>${file.filename}</td>
          <td>${file.filetype}</td>
          <td><a href="/office/${safeFilename}" download="${file.filename}">Ladda ner</a></td>
        `;
        officeBody.appendChild(tr);
      });
    } catch (err) {
      console.error('Fel vid hämtning av kontorsfiler:', err);
    }
  }

  fetchResults();
  fetchMusic();
  fetchOfficeFiles();
  fetchPdfFiles();
});
