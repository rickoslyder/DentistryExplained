-- Add new fields to glossary_terms table
ALTER TABLE glossary_terms 
ADD COLUMN IF NOT EXISTS also_known_as text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS difficulty varchar(20) CHECK (difficulty IN ('basic', 'advanced')),
ADD COLUMN IF NOT EXISTS example text;

-- Update the search function to include new fields
CREATE OR REPLACE FUNCTION update_glossary_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.term, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.definition, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.pronunciation, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.related_terms, ' '), '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.also_known_as, ' '), '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.example, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS update_glossary_search_vector_trigger ON glossary_terms;
CREATE TRIGGER update_glossary_search_vector_trigger
BEFORE INSERT OR UPDATE ON glossary_terms
FOR EACH ROW
EXECUTE FUNCTION update_glossary_search_vector();

-- Update existing terms to populate search vectors with new fields
UPDATE glossary_terms SET search_vector = 
  setweight(to_tsvector('english', COALESCE(term, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(definition, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(pronunciation, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(related_terms, ' '), '')), 'C');