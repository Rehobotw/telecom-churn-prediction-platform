const Joi = require('joi');

const predictionSchema = Joi.object({
  tenure: Joi.number().integer().min(0).required(),
  monthlyCharges: Joi.number().min(0).required(),
  contractType: Joi.string().valid('month-to-month', 'one-year', 'two-year').required(),
  internetService: Joi.string().valid('dsl', 'fiber optic', 'none').required(),
  paymentMethod: Joi.string().required(),
  name: Joi.string().optional(),
  email: Joi.string().email().optional(),
});

const validatePrediction = (req, res, next) => {
  const { error } = predictionSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const validationError = new Error('Validation failed');
    validationError.status = 400;
    validationError.details = error.details.map(d => d.message);
    return next(validationError);
  }

  next();
};

module.exports = {
  validatePrediction,
};