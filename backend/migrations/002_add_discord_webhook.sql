-- Migration: Add Discord Webhook URL to Companies
-- Date: 2025-01-XX
-- Description: Adds discord_webhook_url column to companies table for notification integration

-- =========================================================
-- ADD DISCORD WEBHOOK URL COLUMN
-- =========================================================
ALTER TABLE companies ADD COLUMN IF NOT EXISTS discord_webhook_url VARCHAR(500);

-- =========================================================
-- CREATE INDEX FOR PERFORMANCE (if needed for queries)
-- =========================================================
-- Note: Index not needed for webhook_url as it's not typically queried
-- Only updated/retrieved by company_id

-- =========================================================
-- MIGRATION COMPLETE
-- =========================================================
-- Companies can now store Discord webhook URLs for notifications
-- Use GET /companies/discord-webhook to retrieve
-- Use PUT /companies/discord-webhook to update

