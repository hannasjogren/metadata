// Väntar tills hela dokumentet är laddat innan skriptet körs
document.addEventListener('DOMContentLoaded', () => {
  // Referenser till formulär och tabeller i DOM
  const uploadForm = document.getElementById('uploadForm');
  const uploadResult = document.getElementById('uploadResult');
  const filterForm = document.getElementById('filterForm');
  const resultsBody = document.querySelector('#results tbody');
  const musicBody = document.querySelector('#musicResults tbody');

  // Initialiserar Leaflet-kartan med centrum i Skåne
  const map = L.map('map').setView([56.05, 12.70], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Hanterar uppladdningsformuläret
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
      fetchResults(); // Uppdaterar metadata-tabellen
      fetchMusic();   // Uppdaterar musik-tabellen
    } catch (err) {
      console.error(err);
      uploadResult.textContent = 'Fel vid uppladdning.';
    }
  });

  // Hanterar filterformuläret för metadata-sökning
  filterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    fetchResults(new FormData(filterForm));
  });

  /**
   * Hämtar metadataresultat från servern baserat på filter
   */
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

  /**
   * Renderar metadataresultat i tabellen och på kartan
   */
  function renderResults(results) {
    resultsBody.innerHTML = '';

    // Tar bort tidigare markörer från kartan
    map.eachLayer(layer => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    results.forEach(file => {
      const tr = document.createElement('tr');

      // Visar miniatyr beroende på filtyp
      let thumb = '';
      if (file.filetype === 'pdf') {
        thumb = 'PDF';
      } else if (file.filetype.startsWith('image')) {
        thumb = `<img src="/uploads/${file.stored_name}" width="50">`;
      } else {
        thumb = 'Ingen';
      }

      // Visar förhandsvisning beroende på filtyp
      let preview = '';
      if (file.filetype === 'pdf') {
        preview = `<iframe src="/uploads/${file.stored_name}" class="preview"></iframe>`;
      } else if (file.filetype.startsWith('image')) {
        preview = `<img src="/uploads/${file.stored_name}" width="200">`;
      } else {
        preview = 'Ingen förhandsvisning';
      }

      // Skapar nedladdningslänk
      const downloadLink = `<a href="/uploads/${file.stored_name}" download="${file.filename}">Ladda ner</a>`;

      // Fyller tabellraden med metadata
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

      // Lägger till markör på kartan om GPS-data finns
      if (file.gps_latitude && file.gps_longitude) {
        L.marker([file.gps_latitude, file.gps_longitude])
          .addTo(map)
          .bindPopup(file.filename);
      }
    });
  }

  /**
   * Hämtar musikmetadata och renderar i tabellen
   */
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

  /**
   * Hämtar metadata om kontorsfiler och renderar i tabellen
   */
  async function fetchOfficeFiles() {
    try {
      const res = await fetch('/api/office');
      const files = await res.json();
      const officeBody = document.querySelector('#officeResults tbody');
      officeBody.innerHTML = '';

      files.forEach(file => {
        const tr = document.createElement('tr');
        const safeFilename = encodeURIComponent(file.filename);

        tr.innerHTML = `
          <td>${file.filename}</td>
          <td>${file.filetype}</td>
          <td>${file.content_preview?.slice(0, 100) || 'Ingen förhandsvisning'}</td>
          <td><a href="/office/${safeFilename}" download="${file.filename}">Ladda ner</a></td>
        `;
        officeBody.appendChild(tr);
      });
    } catch (err) {
      console.error('Fel vid hämtning av kontorsfiler:', err);
    }
  }

  // Kör initiala hämtningar vid sidladdning
  fetchResults();
  fetchMusic();
  fetchOfficeFiles();
});
