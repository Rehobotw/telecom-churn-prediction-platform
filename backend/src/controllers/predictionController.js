const mlService = require('../services/mlService');
const customerService = require('../services/customerService');
const { v4: uuidv4 } = require('uuid');
const notificationService = require('../services/notificationService');

const predictChurn = async (req, res, next) => {
  try {
    const customerData = req.body;
    const mlResult = await mlService.predictCustomer(customerData);
    const customerId = uuidv4();
    const responseData = {
      id: customerId,
      customerId,
      name: customerData.customerName || customerData.name || 'Unknown',
      email: customerData.email || '',
      tenure: Number(customerData.tenure),
      monthlyCharges: Number(customerData.monthlyCharges),
      contractType: customerData.contractType,
      internetService: customerData.internetService,
      paymentMethod: customerData.paymentMethod,
      churnProbability: mlResult.churnProbability,
      churnPrediction: mlResult.churnPrediction,
      riskLevel: mlResult.riskLevel,
      predictionDate: new Date().toISOString(),
      customerData: { ...customerData },
    };

    await customerService.saveCustomer(responseData);

    await notificationService.notifySinglePrediction(responseData).catch((err) => {
      console.error('[notifications] failed for single prediction:', err?.message || err);
    });

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
