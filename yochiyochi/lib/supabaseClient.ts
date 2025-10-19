import { createClient } from "@supabase/supabase-js";

// あなたの Supabase プロジェクトのURLと anon key を貼り付けてください
const supabaseUrl = "https://vtdipipfntfstucukmyl.supabase.co";  // ← Supabase の「Project URL」
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0ZGlwaXBmbnRmc3R1Y3VrbXlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MDg5MTksImV4cCI6MjA3NTk4NDkxOX0.quIGkprDveHGHgvbf0P7Ee1SRVGi9YjskpjCj-D7Of4";              // ← Supabase の「anon public key」
export const supabase = createClient(supabaseUrl, supabaseKey);
