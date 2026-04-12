const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');

const getCustomers = async () => {
  try {
    const filePath = path.resolve(config.CUSTOMERS_FILE);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // File doesn't exist, return empty array
      return [];
    }
    throw err;
  }
};

const saveCustomer = async (customer) => {
  const customers = await getCustomers();
  customers.push(customer);
  await saveCustomers(customers);
};

const saveCustomers = async (customers) => {
  const filePath = path.resolve(config.CUSTOMERS_FILE);
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(customers, null, 2));
};

module.exports = {
  getCustomers,
  saveCustomer,
  saveCustomers,
};