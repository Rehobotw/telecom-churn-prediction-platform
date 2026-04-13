const mlService = require('../services/mlService');

const getModelInfo = async (req, res, next) => {
  try {
    const modelInfo = await mlService.getModelInfo();

    res.json({
      success: true,
      data: {
        modelType: modelInfo.model_type ?? undefined,
        lastTrained: modelInfo.last_trained ?? undefined,
        trainingSamples: modelInfo.training_samples ?? undefined,
        featuresUsed: modelInfo.features_used ?? undefined,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getModelInfo,
};
