const fs = require('fs').promises;
const path = require('path');

const TEMPLATE_DIR = path.resolve(__dirname, 'templates');
const templateCache = new Map();

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const loadTemplate = async (templateName) => {
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName);
  }

  const templatePath = path.join(TEMPLATE_DIR, templateName);
  const content = await fs.readFile(templatePath, 'utf8');
  templateCache.set(templateName, content);
  return content;
};

const renderTemplate = async (templateName, values = {}) => {
  const template = await loadTemplate(templateName);

  return Object.entries(values).reduce((html, [key, value]) => {
    const placeholder = `{{${String(key).toUpperCase()}}}`;
    return html.replace(new RegExp(escapeRegExp(placeholder), 'g'), String(value ?? ''));
  }, template);
};

module.exports = {
  renderTemplate,
};
