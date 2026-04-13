const Joi = require('joi');

const predictionSchema = Joi.object({
  customerName: Joi.string().trim().allow('').optional(),
  name: Joi.string().trim().allow('').optional(),
  email: Joi.string().email().allow('').optional(),
  gender: Joi.string().valid('Male', 'Female').required(),
  dependents: Joi.boolean().required(),
  tenure: Joi.number().integer().min(0).required(),
  monthlyCharges: Joi.number().min(0).required(),
  contractType: Joi.string().valid('Month-to-month', 'One year', 'Two year').required(),
  paperlessBilling: Joi.boolean().required(),
  paymentMethod: Joi.string()
    .valid(
      'Electronic check',
      'Mailed check',
      'Bank transfer (automatic)',
      'Credit card (automatic)'
    )
    .required(),
  phoneService: Joi.boolean().required(),
  internetService: Joi.string().valid('DSL', 'Fiber optic', 'No').required(),
  num_services: Joi.number().integer().min(0).required(),
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
