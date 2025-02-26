import { body, param } from "express-validator";
import { TransactionType } from "@prisma/client";

export const validateUserId = [param("userId").isString().notEmpty().withMessage("User ID is required")];

export const validateTransaction = [
  ...validateUserId,
  body("amount").isFloat({ min: 0 }).withMessage("Amount must be a positive number"),
  body("type").isIn(Object.values(TransactionType)).withMessage("Invalid transaction type"),
  body("metadata").optional().isObject().withMessage("Metadata must be an object"),
];
