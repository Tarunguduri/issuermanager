// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://shxcdbffuxjdxaamgcqd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoeGNkYmZmdXhqZHhhYW1nY3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMDQ2OTksImV4cCI6MjA1Nzg4MDY5OX0.R6XZ-j319QpCmubiEpspVZpFzgtQdNixDOIfv1jfhzg";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);