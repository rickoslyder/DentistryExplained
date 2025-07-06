-- Create function to set session configuration
CREATE OR REPLACE FUNCTION set_config(setting TEXT, value TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config(setting, value, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION set_config(TEXT, TEXT) TO authenticated;