import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Lazy initializer for Supabase client.
 * Avoids crashing on load if keys are not configured yet, following SDK instructions.
 */
export const getSupabase = (): SupabaseClient | null => {
  let url = (import.meta as any).env?.VITE_SUPABASE_URL;
  const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  // Normalize URL: trim whitespace, strip trailing slash, and remove trailing /rest/v1
  url = url.trim();
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  if (url.endsWith('/rest/v1')) {
    url = url.slice(0, -8);
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(url, anonKey.trim());
  }

  return supabaseInstance;
};

/**
 * Verifies if a given Minecraft username matches the Discord link-code in Supabase.
 * Returns an object with the result status and any helpful messages.
 */
export async function verifyWithSupabase(username: string, inputCode: string): Promise<{
  success: boolean;
  message?: string;
  isSimulated?: boolean;
}> {
  const supabase = getSupabase();
  
  if (!supabase) {
    // If Supabase is not configured, we provide a simulated check warning so that the preview 
    // is completely functional and informs the developer how to finish the linking.
    return {
      success: true, // Allow simulation/bypass for local preview testing when keys are missing
      isSimulated: true,
      message: "Supabase connection is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your AI Studio Secrets. Simulating verification for testing..."
    };
  }

  try {
    // We try to query a typical 'discord_connections' or 'verifications' table for competitive Minecraft servers.
    // Clean and normalize the query terms
    const cleanUsername = username.trim();
    const cleanCode = inputCode.trim();

    // Query 1: Try typical 'discord_connections' table (using case-insensitive .ilike for username)
    const { data: connData, error: connError } = await supabase
      .from('discord_connections')
      .select('*')
      .ilike('username', cleanUsername)
      .eq('code', cleanCode);

    if (!connError && connData && connData.length > 0) {
      return { success: true };
    }

    // Query 2: Fallback try 'verifications' table if the first table error was due to missing table or yielded nothing
    const { data: verifData, error: verifError } = await supabase
      .from('verifications')
      .select('*')
      .ilike('username', cleanUsername)
      .eq('code', cleanCode);

    if (!verifError && verifData && verifData.length > 0) {
      return { success: true };
    }

    // Check if both tables returned errors because they don't exist
    const isConnUndefinedRelation = connError && connError.message?.includes('relation');
    const isVerifUndefinedRelation = verifError && verifError.message?.includes('relation');

    if (isConnUndefinedRelation && isVerifUndefinedRelation) {
      return {
        success: false,
        message: `Connected to Supabase successfully! However, neither 'discord_connections' nor 'verifications' tables were found. Please create a table in your Supabase database with columns: 'username' (text) and 'code' (text).`
      };
    }

    // If we queried successfully but found no match
    return {
      success: false,
      message: `The username "${username}" does not match the provided Discord code "${inputCode}" in the database. Please make sure the code matches exactly.`
    };
  } catch (err: any) {
    console.error("Supabase verification error:", err);
    return {
      success: false,
      message: `Supabase database error: ${err.message || 'Unknown network error'}`
    };
  }
}
