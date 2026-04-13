const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');

let cachedCustomers = null;
let cachedMtimeMs = null;

const normalizeCustomer = (customer) => {
  const customerData = customer.customerData || {};
  const identity = {
    id: customer.id || customer.customerId || customerData.customerId || '',
    customerId: customer.customerId || customer.id || customerData.customerId || '',
    name: customer.name || customer.customerName || customerData.customerName || customerData.name || 'Unknown',
    email: customer.email || customerData.email || '',
  };

  return {
    ...customer,
    ...identity,
    tenure: Number(customer.tenure ?? customerData.tenure ?? 0),
    monthlyCharges: Number(customer.monthlyCharges ?? customerData.monthlyCharges ?? 0),
    contractType: customer.contractType || customerData.contractType || '',
    internetService: customer.internetService || customerData.internetService || '',
    paymentMethod: customer.paymentMethod || customerData.paymentMethod || '',
    churnProbability: Number(customer.churnProbability ?? customer.probability ?? 0),
    churnPrediction: Boolean(
      customer.churnPrediction ?? customer.prediction ?? customerData.churnPrediction ?? false
    ),
    riskLevel: customer.riskLevel || customer.risk || customerData.riskLevel || 'Low',
    predictionDate:
      customer.predictionDate ||
      customer.predictionTimestamp ||
      customer.timestamp ||
      customer.createdAt ||
      null,
  };
};

const getCustomers = async () => {
  try {
    const filePath = path.resolve(config.CUSTOMERS_FILE);
    const stats = await fs.stat(filePath);

    if (cachedCustomers && cachedMtimeMs === stats.mtimeMs) {
      return cachedCustomers;
    }

    const data = await fs.readFile(filePath, 'utf8');
    const customers = JSON.parse(data).map(normalizeCustomer);
    cachedCustomers = customers;
    cachedMtimeMs = stats.mtimeMs;
    return customers;
  } catch (err) {
    if (err.code === 'ENOENT') {
      // File doesn't exist, return empty array
      cachedCustomers = [];
      cachedMtimeMs = null;
      return [];
    }
    throw err;
  }
};

const saveCustomer = async (customer) => {
  const customers = await getCustomers();
  customers.push(normalizeCustomer(customer));
  await saveCustomers(customers);
};

const saveCustomers = async (customers) => {
  const filePath = path.resolve(config.CUSTOMERS_FILE);
  const dir = path.dirname(filePath);
  const normalizedCustomers = customers.map(normalizeCustomer);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    filePath,
    JSON.stringify(normalizedCustomers, null, 2)
  );
  const stats = await fs.stat(filePath);
  cachedCustomers = normalizedCustomers;
  cachedMtimeMs = stats.mtimeMs;
};

module.exports = {
  getCustomers,
  normalizeCustomer,
  saveCustomer,
  saveCustomers,
};
