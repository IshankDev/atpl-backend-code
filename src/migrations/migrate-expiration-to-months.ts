/**
 * Migration Script: Convert expirationDate to expirationMonths
 * 
 * This script converts existing subscription expirationDate values to expirationMonths
 * based on the difference between expirationDate and a reference date (typically creation date or current date).
 * 
 * Usage:
 * 1. Run this script manually: npx ts-node src/migrations/migrate-expiration-to-months.ts
 * 2. Or integrate it as a NestJS command
 */

import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { Model } from "mongoose";
import { Subscription } from "../subscriptions/schemas/subscription.schema";
import { getModelToken } from "@nestjs/mongoose";

async function migrateExpirationToMonths() {
  console.log("Starting migration: Convert expirationDate to expirationMonths...");

  const app = await NestFactory.createApplicationContext(AppModule);
  const subscriptionModel = app.get<Model<Subscription>>(getModelToken(Subscription.name));

  try {
    // Find all subscriptions with expirationDate but no expirationMonths
    const subscriptions = await subscriptionModel.find({
      expirationDate: { $exists: true, $ne: null },
      $or: [{ expirationMonths: { $exists: false } }, { expirationMonths: null }],
      hasExpiration: true,
    });

    console.log(`Found ${subscriptions.length} subscriptions to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const subscription of subscriptions) {
      try {
        if (!subscription.expirationDate) {
          skippedCount++;
          continue;
        }

        // Calculate months from creation date (or current date if creation date is not available)
        const referenceDate = subscription.createdAt || new Date();
        const expirationDate = new Date(subscription.expirationDate);

        // Calculate the difference in months
        const monthsDiff = calculateMonthsDifference(referenceDate, expirationDate);

        if (monthsDiff > 0) {
          await subscriptionModel.findByIdAndUpdate(subscription._id, {
            expirationMonths: monthsDiff,
          });

          console.log(
            `✓ Migrated subscription ${subscription._id}: ${monthsDiff} months (expirationDate: ${expirationDate.toISOString()})`
          );
          migratedCount++;
        } else {
          console.log(
            `⚠ Skipped subscription ${subscription._id}: expirationDate is in the past or invalid`
          );
          skippedCount++;
        }
      } catch (error) {
        console.error(`✗ Error migrating subscription ${subscription._id}:`, error.message);
        skippedCount++;
      }
    }

    console.log("\n=== Migration Summary ===");
    console.log(`Total subscriptions found: ${subscriptions.length}`);
    console.log(`Successfully migrated: ${migratedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log("\nMigration completed!");

    await app.close();
  } catch (error) {
    console.error("Migration failed:", error);
    await app.close();
    process.exit(1);
  }
}

/**
 * Calculate the difference in months between two dates
 */
function calculateMonthsDifference(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // If end date is before start date, return 0
  if (end < start) {
    return 0;
  }

  const yearsDiff = end.getFullYear() - start.getFullYear();
  const monthsDiff = end.getMonth() - start.getMonth();
  const daysDiff = end.getDate() - start.getDate();

  // Calculate total months
  let totalMonths = yearsDiff * 12 + monthsDiff;

  // If the day of month in end date is less than start date, we might need to adjust
  // For example: Jan 15 to Feb 10 is less than 1 full month
  // But for migration purposes, we'll round up if there are any days
  if (daysDiff < 0) {
    // If end day is before start day, we might be slightly less than a full month
    // But we'll still count it as a month for migration purposes
    // You can adjust this logic based on your business requirements
  }

  return Math.max(1, totalMonths); // Minimum 1 month
}

// Run the migration
if (require.main === module) {
  migrateExpirationToMonths()
    .then(() => {
      console.log("Migration script finished");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration script error:", error);
      process.exit(1);
    });
}

export { migrateExpirationToMonths };

