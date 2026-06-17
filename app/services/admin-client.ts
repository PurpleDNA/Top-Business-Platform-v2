import { createClient } from "@supabase/supabase-js";

// Note: This client uses the SERVICE_ROLE_KEY and should ONLY be used in server-side contexts (Server Actions)
// NEVER import this in client components.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  // We don't throw immediately to allow build time to pass, but it will fail at runtime if used.
}

export const adminAuthClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
