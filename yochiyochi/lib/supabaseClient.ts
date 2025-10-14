import { createClient } from "@supabase/supabase-js";

// あなたの Supabase プロジェクトのURLと anon key を貼り付けてください
const supabaseUrl = "https://tjtizctvkqvecghyiwvk.supabase.co";  // ← Supabase の「Project URL」
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqdGl6Y3R2a3F2ZWNnaHlpd3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MzA3NTgsImV4cCI6MjA3NjAwNjc1OH0.B3nGqzFaxsCyfv4NmHTNIOTcb3iGkJiElGl0yTyJnXA";              // ← Supabase の「anon public key」

export const supabase = createClient(supabaseUrl, supabaseKey);
