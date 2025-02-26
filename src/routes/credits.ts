import express from "express";
import { getCreditBalance, createTransaction, refreshCredits } from "../controllers/creditController";
import { validate } from "../middleware/validateRequest";
import { validateUserId, validateTransaction } from "../middleware/creditValidation";

const router = express.Router();

// Get credit balance and recent transactions
router.get("/:userId", validate(validateUserId), getCreditBalance);

// Create a new transaction
router.post("/:userId/transactions", validate(validateTransaction), createTransaction);

// Refresh monthly credits
router.post("/:userId/refresh", validate(validateUserId), refreshCredits);

export default router;
