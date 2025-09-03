document.addEventListener('DOMContentLoaded', () => {
  fetch('http://localhost:3001/api/files')
    .then(res => res.json())
    .then(data => {
      const tbody = document.querySelector('#results tbody');
      tbody.innerHTML = '';

      data.forEach(file => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${file.filename}</td>
          <td>${file.filetype}</td>
          <td>${file.metadata?.author || ''}</td>
          <td>${file.metadata?.title || ''}</td>
          <td>${file.metadata?.artist || ''}</td>
          <td>${file.metadata?.date || ''}</td>
          <td><a href="${file.filepath}" class="download-btn" download>Ladda ner</a></td>
        `;
        tbody.appendChild(row);
      });
    })
    .catch(err => {
      console.error('Kunde inte hämta filer:', err);
    });
});
