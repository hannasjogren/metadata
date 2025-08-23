// Extraherar metadata från ljudfiler (MP3, FLAC, WAV m.fl.)
const mm = require('music-metadata');


module.exports = async function extractAudioMetadata(filePath) {
const { common, format } = await mm.parseFile(filePath);


return {
fileType: 'audio',
fileName: filePath.split(/[/\\]/).pop(),
date: common?.year ? new Date(`${common.year}-01-01`) : null,
artist: common?.artist || null,
title: common?.title || null,
// format.duration, format.bitrate m.m. kan även sparas vid behov
};
};