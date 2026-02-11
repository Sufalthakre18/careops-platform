import { validationResult } from 'express-validator';
import { ApiError } from './errorHandler.js';

//Validate request and format errors

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().reduce((acc, error) => {
      acc[error.path] = error.msg;
      return acc;
    }, {});

    return next(new ApiError(400, 'Validation failed', formattedErrors));
  }

  next();
};
