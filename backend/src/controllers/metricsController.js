const mlService = require('../services/mlService');

const getMetrics = async (req, res, next) => {
  try {
    const [metricsResult, modelInfoResult] = await Promise.allSettled([
      mlService.getMetrics(),
      mlService.getModelInfo ? mlService.getModelInfo() : Promise.resolve(null),
    ]);

    if (metricsResult.status !== 'fulfilled') {
      throw metricsResult.reason;
    }

    const metrics = metricsResult.value;
    const fallbackModelInfo =
      modelInfoResult.status === 'fulfilled' && modelInfoResult.value
        ? modelInfoResult.value
        : null;
    const fpr = metrics.roc_curve?.fpr || [];
    const tpr = metrics.roc_curve?.tpr || [];
    const rocData = fpr.map((value, index) => ({
      fpr: Number(value),
      tpr: Number(tpr[index] ?? 0),
      baseline: Number(value),
    }));

    res.json({
      success: true,
      data: {
        metrics: {
          accuracy: Number(metrics.accuracy ?? 0),
          precision: Number(metrics.precision ?? 0),
          recall: Number(metrics.recall ?? 0),
          f1Score: Number(metrics.f1 ?? 0),
          rocAuc: Number(metrics.roc_auc ?? 0),
        },
        confusionMatrix: metrics.confusion_matrix || [
          [0, 0],
          [0, 0],
        ],
        rocData,
        modelInfo: {
          modelType: metrics.model_info?.model_type ?? fallbackModelInfo?.model_type ?? undefined,
          lastTrained: metrics.model_info?.last_trained ?? fallbackModelInfo?.last_trained ?? undefined,
          trainingSamples:
            metrics.model_info?.training_samples ?? fallbackModelInfo?.training_samples ?? undefined,
          featuresUsed: metrics.model_info?.features_used ?? fallbackModelInfo?.features_used ?? undefined,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMetrics,
};
