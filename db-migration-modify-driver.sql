-- Modify the transports table to use text fields for drivers and assistants
-- First, remove the existing foreign key constraints
ALTER TABLE transports DROP CONSTRAINT IF EXISTS transports_driver_id_fkey;
ALTER TABLE transports DROP CONSTRAINT IF EXISTS transports_assistant_id_fkey;

-- Change the column types from UUID to TEXT
ALTER TABLE transports ALTER COLUMN driver_id TYPE TEXT USING driver_id::TEXT;
ALTER TABLE transports ALTER COLUMN assistant_id TYPE TEXT USING assistant_id::TEXT;

-- Remove the NOT NULL constraint on driver_id to be safe
ALTER TABLE transports ALTER COLUMN driver_id DROP NOT NULL;

-- Add NOT NULL constraint back only to driver_id
ALTER TABLE transports ALTER COLUMN driver_id SET NOT NULL; 