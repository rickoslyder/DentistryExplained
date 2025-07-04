-- Enable necessary extensions
-- These need to be run separately as they may require special permissions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- PostGIS might require special permissions, so we'll skip it for now unless needed