-- Add is_enabled column to model table
ALTER TABLE `model` ADD COLUMN `is_enabled` integer DEFAULT true NOT NULL;
