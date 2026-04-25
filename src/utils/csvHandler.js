const fs = require('fs');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
};

const generateCSV = (data) => {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]).map(key => ({ id: key, title: key }));

  const csvWriter = createObjectCsvWriter({
    path: 'temp.csv',
    header: headers,
  });

  // For now, return as string, but in production, might want to stream
  return data.map(row => Object.values(row).join(',')).join('\n');
};

module.exports = {
  parseCSV,
  generateCSV,
};