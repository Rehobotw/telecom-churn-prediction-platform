const mlService = require('../services/mlService');
const customerService = require('../services/customerService');
const { v4: uuidv4 } = require('uuid');
const { generateCSV } = require('../utils/csvHandler');

const FIRST_NAMES = [
  'Amina',
  'Noah',
  'Liya',
  'Caleb',
  'Maya',
  'Elias',
  'Sara',
  'Nathan',
  'Hana',
  'Daniel',
];

const LAST_NAMES = [
  'Tesfaye',
  'Johnson',
  'Bekele',
  'Carter',
  'Abebe',
  'Nguyen',
  'Ali',
  'Brown',
  'Mekonnen',
  'Davis',
];

const buildFakeIdentity = (index) => {
  const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
  const lastName = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length];
  const name = `${firstName} ${lastName}`;
  const email = `${firstName}.${lastName}.${index + 1}@example.com`.toLowerCase();
  return { name, email };
};

const predictBatch = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const mlResults = await mlService.predictBatch(req.file);
    const processedData = mlResults.map((result, index) => {
      const customerId = uuidv4();
      const fallbackIdentity = buildFakeIdentity(index);
      return {
        id: customerId,
        customerId,
        name: result.customerData.customerName || result.customerData.name || fallbackIdentity.name,
        email: result.customerData.email || fallbackIdentity.email,
        tenure: Number(result.customerData.tenure ?? 0),
        monthlyCharges: Number(result.customerData.monthlyCharges ?? result.customerData.MonthlyCharges ?? 0),
        contractType: result.customerData.contractType || result.customerData.Contract || '',
        internetService: result.customerData.internetService || result.customerData.InternetService || '',
        paymentMethod: result.customerData.paymentMethod || result.customerData.PaymentMethod || '',
        ...result.customerData,
        churnProbability: result.churnProbability,
        churnPrediction: result.churnPrediction,
        riskLevel: result.riskLevel,
        predictionDate: new Date().toISOString(),
        source: 'batch',
      };
    });

    const existingCustomers = await customerService.getCustomers();
    await customerService.saveCustomers([...existingCustomers, ...processedData]);

    const csvContent = generateCSV(
      processedData.map((row) => ({
        customerId: row.customerId,
        name: row.name,
        email: row.email,
        tenure: row.tenure,
        monthlyCharges: row.monthlyCharges,
        contractType: row.contractType,
        internetService: row.internetService,
        paymentMethod: row.paymentMethod,
        churnProbability: row.churnProbability,
        churnPrediction: row.churnPrediction,
        riskLevel: row.riskLevel,
        predictionDate: row.predictionDate,
      }))
    );

    res.json({
      success: true,
      data: {
        processed: processedData.length,
        results: processedData,
        csvContent,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  predictBatch,
};
