// Lyssnar på att formuläret skickas
document.getElementById('searchForm').addEventListener('submit', async (e) => {
  e.preventDefault(); // Hindrar att sidan laddas om

  // Hämtar formulärdata och konverterar till URL-parametrar
  const form = new FormData(e.target);
  const params = new URLSearchParams(form);

  try {
    // Skickar GET-förfrågan till backend med sökparametrar
    const response = await fetch(`/search?${params.toString()}`);
    const data = await response.json(); // Tolkar svaret som JSON

    // Hämtar resultatlistan och tömmer den
    const results = document.getElementById('results');
    results.innerHTML = '';

    // Om inga träffar hittas, visa ett meddelande
    if (data.length === 0) {
      results.innerHTML = '<li>Inga träffar hittades.</li>';
      return;
    }

    // Loopar igenom varje träff och skapar en <li> med metadata
    data.forEach(file => {
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${file.fileName}</strong> (${file.fileType})<br>
        ${file.date ? `Datum: ${file.date}<br>` : ''}
        ${file.latitude && file.longitude ? `Plats: ${file.latitude}, ${file.longitude}<br>` : ''}
        ${file.author ? `Författare: ${file.author}<br>` : ''}
        ${file.artist ? `Artist: ${file.artist}<br>` : ''}
        ${file.title ? `Titel: ${file.title}<br>` : ''}
        ${file.contentPreview ? `Förhandsvisning: ${file.contentPreview}<br>` : ''}
      `;
      results.appendChild(li); // Lägger till träffen i listan
    });
  } catch (error) {
    // Om något går fel, visa ett felmeddelande
    console.error('Fel vid hämtning av sökresultat:', error);
    document.getElementById('results').innerHTML = '<li>Ett fel uppstod vid sökningen.</li>';
  }
});