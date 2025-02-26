import { Request, Response } from "express";
import prisma from "../config/database";
import { TransactionType, TransactionStatus } from "@prisma/client";

export const getCreditBalance = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const credit = await prisma.aICredit.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!credit) {
      return res.status(404).json({ message: "Credit record not found" });
    }

    res.json(credit);
  } catch (error) {
    console.error("Error fetching credit balance:", error);
    res.status(500).json({ message: "Error fetching credit balance" });
  }
};

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { amount, type, metadata } = req.body;

    const credit = await prisma.aICredit.findUnique({
      where: { userId },
    });

    if (!credit) {
      return res.status(404).json({ message: "Credit record not found" });
    }

    // Start a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create the transaction record
      const transaction = await prisma.aICreditTransaction.create({
        data: {
          creditId: credit.id,
          amount,
          type: type as TransactionType,
          status: TransactionStatus.COMPLETED,
          metadata,
        },
      });

      // Update the credit balance
      const updatedCredit = await prisma.aICredit.update({
        where: { id: credit.id },
        data: {
          balance: {
            increment: type === TransactionType.USAGE ? -amount : amount,
          },
          hasPurchaseHistory: type === TransactionType.PURCHASE ? true : undefined,
        },
      });

      return { transaction, updatedCredit };
    });

    res.json(result);
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ message: "Error creating transaction" });
  }
};

export const refreshCredits = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const MONTHLY_REFRESH_AMOUNT = 100; // Define your refresh amount

    const credit = await prisma.aICredit.findUnique({
      where: { userId },
    });

    if (!credit) {
      return res.status(404).json({ message: "Credit record not found" });
    }

    // Check if eligible for refresh
    const lastRefresh = credit.lastRefreshDate;
    const now = new Date();
    if (lastRefresh && lastRefresh.getMonth() === now.getMonth() && lastRefresh.getFullYear() === now.getFullYear()) {
      return res.status(400).json({ message: "Already refreshed this month" });
    }

    // Perform the refresh
    const result = await prisma.$transaction(async (prisma) => {
      const transaction = await prisma.aICreditTransaction.create({
        data: {
          creditId: credit.id,
          amount: MONTHLY_REFRESH_AMOUNT,
          type: TransactionType.MONTHLY_REFRESH,
          status: TransactionStatus.COMPLETED,
        },
      });

      const updatedCredit = await prisma.aICredit.update({
        where: { id: credit.id },
        data: {
          balance: MONTHLY_REFRESH_AMOUNT,
          lastRefreshDate: now,
        },
      });

      return { transaction, updatedCredit };
    });

    res.json(result);
  } catch (error) {
    console.error("Error refreshing credits:", error);
    res.status(500).json({ message: "Error refreshing credits" });
  }
};
