import { body, param } from 'express-validator';

export const reportValidations = [
  param('year')
    .isInt({ min: 2000, max: new Date().getFullYear() + 1 })
    .withMessage('El año debe ser un valor válido')
];