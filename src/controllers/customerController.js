const customerService = require('../services/customerService');

const getCustomers = async (req, res, next) => {
  try {
    const { search, risk, contractType } = req.query;

    let customers = await customerService.getCustomers();

    // Apply filters
    if (search) {
      customers = customers.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.customerId?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (risk) {
      customers = customers.filter(c => c.riskLevel === risk);
    }

    if (contractType) {
      customers = customers.filter(c => c.contractType === contractType);
    }

    res.json({
      success: true,
      data: customers,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCustomers,
};