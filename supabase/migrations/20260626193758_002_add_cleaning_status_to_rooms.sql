/*
# Add cleaning_status to rooms table

1. Changes to existing tables
- Add `cleaning_status` column to `rooms` table
- Values: 'clean' (Limpia), 'dirty' (Sucia), 'in-progress' (En Progreso)
- Default value: 'clean'

2. Security
- No changes to RLS policies (column is part of existing public table)

3. Notes
- This property helps track housekeeping status for each room
- When a check-out occurs, the room status should be updated to 'dirty'
*/

ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS cleaning_status text NOT NULL DEFAULT 'clean'
CHECK (cleaning_status IN ('clean', 'dirty', 'in-progress'));

-- Create index for filtering by cleaning status
CREATE INDEX IF NOT EXISTS idx_rooms_cleaning_status ON rooms(cleaning_status);
