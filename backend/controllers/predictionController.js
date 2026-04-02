const Joi = require('joi');
const mlService = require('../services/mlService');

const predictionSchema = Joi.object({
  tenure: Joi.number().integer().min(0).required(),
  monthlyCharges: Joi.number().min(0).required(),
  contractType: Joi.string().valid('month-to-month', 'one-year', 'two-year').required(),
  internetService: Joi.string().valid('dsl', 'fiber optic', 'none').required(),
});

async function predictChurn(req, res, next) {
  try {
    const { error, value } = predictionSchema.validate(req.body, { abortEarly: false });

    if (error) {
      const validationError = new Error('Validation failed');
      validationError.status = 400;
      validationError.details = error.details.map((d) => d.message);
      throw validationError;
    }

    const predictionResult = await mlService.getChurnPrediction(value);

    return res.json(predictionResult);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  predictChurn,
};

