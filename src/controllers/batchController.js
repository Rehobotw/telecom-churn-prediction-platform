const mlService = require('../services/mlService');
const customerService = require('../services/customerService');
const csvHandler = require('../utils/csvHandler');
const { v4: uuidv4 } = require('uuid');

const predictBatch = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Parse CSV
    const csvData = await csvHandler.parseCSV(req.file.path);

    // Call ML service
    const mlResults = await mlService.predictBatch(csvData);

    // Process results
    const processedData = mlResults.map((result, index) => {
      const riskLevel = result.churnProbability > 0.7 ? 'High' : result.churnProbability > 0.4 ? 'Medium' : 'Low';
      return {
        customerId: uuidv4(),
        ...result.customerData,
        churnProbability: result.churnProbability,
        churnPrediction: result.churnPrediction,
        riskLevel,
        predictionTimestamp: new Date().toISOString(),
        source: 'batch',
      };
    });

    // Save to storage
    await customerService.saveCustomers(processedData);

    // Generate CSV for download
    const csvOutput = csvHandler.generateCSV(processedData);

    res.json({
      success: true,
      data: {
        processed: processedData.length,
        results: processedData,
        csvData: csvOutput,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  predictBatch,
};