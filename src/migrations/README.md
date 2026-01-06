# Migration Scripts

This directory contains database migration scripts for the ATPL Gurukul backend.

## Available Migrations

### migrate-expiration-to-months.ts

Converts existing subscription `expirationDate` values to `expirationMonths` based on the time difference.

**When to run:**
- After deploying the update that adds `expirationMonths` field to subscriptions
- When you have existing subscriptions with `expirationDate` that need to be converted

**How to run:**

```bash
# Option 1: Using ts-node directly
npx ts-node src/migrations/migrate-expiration-to-months.ts

# Option 2: Using npm script (if added to package.json)
npm run migrate:expiration-to-months
```

**What it does:**
1. Finds all subscriptions with `expirationDate` but no `expirationMonths`
2. Calculates the number of months between the subscription creation date and expiration date
3. Updates the subscription with the calculated `expirationMonths` value
4. Provides a summary of migrated and skipped subscriptions

**Notes:**
- The script calculates months from the subscription creation date (or current date if creation date is unavailable)
- Subscriptions with expiration dates in the past will be skipped
- The script is idempotent - safe to run multiple times

**Example output:**
```
Starting migration: Convert expirationDate to expirationMonths...
Found 25 subscriptions to migrate
✓ Migrated subscription 507f1f77bcf86cd799439011: 6 months (expirationDate: 2024-07-01T00:00:00.000Z)
✓ Migrated subscription 507f1f77bcf86cd799439012: 12 months (expirationDate: 2025-01-01T00:00:00.000Z)
...

=== Migration Summary ===
Total subscriptions found: 25
Successfully migrated: 23
Skipped: 2
Migration completed!
```

## Adding New Migrations

When creating a new migration script:

1. Create a new TypeScript file in this directory
2. Use the NestJS application context to access models
3. Include error handling and logging
4. Make the script idempotent (safe to run multiple times)
5. Update this README with migration details

