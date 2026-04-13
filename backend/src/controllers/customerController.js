const customerService = require('../services/customerService');

const getCustomers = async (req, res, next) => {
  try {
    const { search, risk, contractType } = req.query;
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(200, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 100));

    let customers = await customerService.getCustomers();

    customers = [...customers].sort(
      (a, b) =>
        new Date(b.predictionDate || 0).getTime() - new Date(a.predictionDate || 0).getTime()
    );

    if (search) {
      const normalizedSearch = search.toLowerCase();
      customers = customers.filter(c =>
        c.name?.toLowerCase().includes(normalizedSearch) ||
        c.email?.toLowerCase().includes(normalizedSearch) ||
        c.customerId?.toLowerCase().includes(normalizedSearch)
      );
    }

    if (risk) {
      customers = customers.filter(c => c.riskLevel === risk);
    }

    if (contractType) {
      customers = customers.filter(c => c.contractType === contractType);
    }

    const total = customers.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const data = customers.slice(startIndex, startIndex + pageSize);

    res.json({
      success: true,
      data,
      pagination: {
        page: safePage,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCustomers,
};
