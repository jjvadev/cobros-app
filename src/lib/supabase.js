import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ddgdiavpmynkfqzxajjq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkZ2RpYXZwbXlua2ZxenhhampxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTU1MjYsImV4cCI6MjA3MzM5MTUyNn0.6MCuxOrxpfz9pyo47lJ4VFJatWp76GrhbtsieqZTJxg";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
