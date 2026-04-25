const mlService = require('../services/mlService');
const customerService = require('../services/customerService');
const { v4: uuidv4 } = require('uuid');

const predictChurn = async (req, res, next) => {
  try {
    const customerData = req.body;

    // Call ML service
    const mlResult = await mlService.predictCustomer(customerData);
    /*const mlResult = {
  churnProbability: 0.82,
  churnPrediction: true
};*/

    // Determine risk level
    const riskLevel = mlResult.churnProbability > 0.7 ? 'High' : mlResult.churnProbability > 0.4 ? 'Medium' : 'Low';

    // Prepare response data
    const responseData = {
      customerId: uuidv4(),
      churnProbability: mlResult.churnProbability,
      churnPrediction: mlResult.churnPrediction,
      riskLevel,
      timestamp: new Date().toISOString(),
      customerData,
    };

    // Save to storage
    await customerService.saveCustomer(responseData);

    res.json({
      success: true,
      data: responseData,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  predictChurn,
};