// Startar Express-servern och kopplar ihop alla delar

const express = require('express');
const multer = require('multer');
const path = require('path');

const uploadHandler = require('./upload');
const searchRoutes = require('./routes/search');

const app = express();
const upload = multer({ dest: 'uploads/' }); // Sparar uppladdade filer temporärt

app.use(express.json()); // Tillåter JSON-data i förfrågningar
app.use(express.static(path.join(__dirname, '../frontend/public'))); // Serverar frontend

app.post('/upload', upload.single('file'), uploadHandler); // Hanterar filuppladdning
app.use('/search', searchRoutes); // Hanterar sökningar

app.listen(3000, () => console.log('Servern körs på http://localhost:3000'));