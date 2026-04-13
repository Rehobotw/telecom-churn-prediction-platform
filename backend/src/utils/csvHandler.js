const fs = require('fs');
const csv = require('csv-parser');

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

const escapeCsvValue = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  const normalized = String(value);
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
};

const generateCSV = (data) => {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const headerRow = headers.join(',');
  const rows = data.map((row) =>
    headers.map((key) => escapeCsvValue(row[key])).join(',')
  );

  return [headerRow, ...rows].join('\n');
};

module.exports = {
  parseCSV,
  generateCSV,
};
