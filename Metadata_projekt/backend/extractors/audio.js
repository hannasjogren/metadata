// Extraherar metadata från ljudfiler (MP3, WAV, etc.)

const mm = require('music-metadata');

module.exports = async function extractAudioMetadata(filePath) {
  const metadata = await mm.parseFile(filePath);

  return {
    fileType: 'audio',
    fileName: filePath.split('/').pop(),
    date: metadata.common.year || null,
    artist: metadata.common.artist || null,
    title: metadata.common.title || null
  };
};