import cron from "node-cron";
import prisma from "../config/database";
import { TransactionType, TransactionStatus } from "@prisma/client";

const PRO_REFRESH_AMOUNT = 100;
const FREE_REFRESH_AMOUNT = 6;

async function refreshAllUserCredits() {
  try {
    console.log("Starting monthly credit refresh for all users...");

    // Get all users with AICredit records and include their user data for subscription check
    const credits = await prisma.aICredit.findMany({
      include: {
        user: {
          select: {
            stripeSubscriptionId: true,
            stripeCurrentPeriodEnd: true,
          },
        },
      },
    });

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    for (const credit of credits) {
      try {
        const lastRefresh = credit.lastRefreshDate;

        // Skip if already refreshed this month
        if (lastRefresh && lastRefresh.getMonth() === currentMonth && lastRefresh.getFullYear() === currentYear) {
          continue;
        }

        // Check if user has an active subscription
        const hasActiveSubscription = credit.user.stripeSubscriptionId && credit.user.stripeCurrentPeriodEnd && credit.user.stripeCurrentPeriodEnd > now;

        const refreshAmount = hasActiveSubscription ? PRO_REFRESH_AMOUNT : FREE_REFRESH_AMOUNT;

        // Perform the refresh in a transaction
        await prisma.$transaction(async (prisma) => {
          // Create the transaction record
          await prisma.aICreditTransaction.create({
            data: {
              creditId: credit.id,
              amount: refreshAmount,
              type: TransactionType.MONTHLY_REFRESH,
              status: TransactionStatus.COMPLETED,
              metadata: {
                subscriptionStatus: hasActiveSubscription ? "pro" : "free",
              },
            },
          });

          // Update the credit balance
          await prisma.aICredit.update({
            where: { id: credit.id },
            data: {
              balance: refreshAmount,
              lastRefreshDate: now,
            },
          });
        });

        console.log(`Successfully refreshed credits for user ${credit.userId} (${hasActiveSubscription ? "PRO" : "FREE"})`);
      } catch (error) {
        console.error(`Error refreshing credits for user ${credit.userId}:`, error);
        // Continue with next user even if one fails
      }
    }

    console.log("Completed monthly credit refresh for all users");
  } catch (error) {
    console.error("Error in credit refresh job:", error);
  }
}

// Schedule the job to run at midnight on the first day of each month
export function scheduleCreditRefresh() {
  // '0 0 1 * *' = At 00:00 on day-of-month 1
  cron.schedule("0 0 1 * *", refreshAllUserCredits, {
    timezone: "UTC",
  });

  console.log("Credit refresh job scheduled");
}

// Export for manual triggering (e.g., for testing)
export const manualRefresh = refreshAllUserCredits;
