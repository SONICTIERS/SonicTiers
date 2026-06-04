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
    const cleanUsername = username.trim();
    const cleanCode = inputCode.trim();

    // Typical competitor link configurations
    const candidateTables = [
      'sonicbot',
      'discord_connections',
      'verifications',
      'discord_links',
      'connections',
      'user_links',
      'players',
      'users'
    ];

    const foundTables: string[] = [];
    let databaseErrorDetail = '';

    // Step 1: Probe candidate tables to see which ones exist
    for (const tableName of candidateTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          const msg = error.message || '';
          
          // Check for key/permission/JWT invalidation errors
          const isAuthError = msg.includes('JWT') || msg.includes('apiKey') || msg.includes('Invalid API key') || error.code === 'PGRST111' || error.code === 'PGRST102';
          if (isAuthError) {
            return {
              success: false,
              message: `Supabase Authentication Error: ${msg}. Please make sure your VITE_SUPABASE_ANON_KEY and VITE_SUPABASE_URL secrets match your Supabase project settings.`
            };
          }

          // Undefined relation is Postgres code '42P01'
          const isRelationMissing = msg.includes('relation') || msg.includes('does not exist') || error.code === '42P01';
          if (!isRelationMissing) {
            foundTables.push(tableName);
          }
        } else {
          foundTables.push(tableName);
        }
      } catch (e: any) {
        console.error(`Probing table "${tableName}" failed:`, e);
      }
    }

    if (foundTables.length === 0) {
      return {
        success: false,
        message: `Connected to Supabase! However, we couldn't find any typical verification tables (checked: ${candidateTables.join(', ')}). Please construct a table in your Supabase database called 'discord_connections' with columns 'minecraft_name' (text) and 'code' (text).`
      };
    }

    // List of candidate columns to try in order of preference
    const usernameCols = ['minecraft_name', 'username', 'user', 'mc_username', 'minecraft_username', 'player_username', 'player', 'ign', 'name'];
    const codeCols = ['code', 'verification_code', 'link_code', 'discord_code', 'token', 'pin'];

    // Step 2: Query each existing table dynamically
    for (const tableName of foundTables) {
      // Step 2a: Try to fetch a sample row to inspect actual keys if available
      let detectedUserCol = 'minecraft_name';
      let detectedCodeCol = 'code';
      let keysDetected = false;

      try {
        const { data: sampleRows, error: sampleError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (!sampleError && sampleRows && sampleRows.length > 0) {
          const keys = Object.keys(sampleRows[0]);
          
          // Find closest matches
          const foundUserKey = keys.find(k => usernameCols.map(c => c.toLowerCase()).includes(k.toLowerCase()));
          if (foundUserKey) detectedUserCol = foundUserKey;

          const foundCodeKey = keys.find(k => codeCols.map(c => c.toLowerCase()).includes(k.toLowerCase()));
          if (foundCodeKey) detectedCodeCol = foundCodeKey;
          
          keysDetected = true;
        }
      } catch (e) {
        console.warn('Could not read sample row keys:', e);
      }

      // Step 2b: Compose an optimized list of column pairs to try for verification
      const pairsToTry: Array<{ u: string; c: string }> = [];
      
      // If keys were detected, prioritize that pair
      if (keysDetected) {
        pairsToTry.push({ u: detectedUserCol, c: detectedCodeCol });
      }
      
      // Add standard combinations
      pairsToTry.push({ u: 'minecraft_name', c: 'code' });
      pairsToTry.push({ u: 'username', c: 'code' });
      pairsToTry.push({ u: 'user', c: 'code' });
      pairsToTry.push({ u: 'mc_username', c: 'code' });

      // Run queries for each pair and check if they match
      for (const { u, c } of pairsToTry) {
        try {
          // Attempt using ilike case-insensitive search
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .ilike(u, cleanUsername)
            .ilike(c, cleanCode);

          if (!error && data && data.length > 0) {
            return { success: true };
          }

          if (error) {
            databaseErrorDetail = error.message;
          }
        } catch (e: any) {
          // Fallback to strict comparison if ilike failed due to type constraints
          try {
            const { data, error } = await supabase
              .from(tableName)
              .select('*')
              .eq(u, cleanUsername)
              .eq(c, cleanCode);

            if (!error && data && data.length > 0) {
              return { success: true };
            }
          } catch (innerErr) {
            // Column may not exist, let the loop proceed
          }
        }
      }

      // Step 2c: Feedback check - see if user exists with any other code to provide smart warnings
      for (const u of ['minecraft_name', 'username', 'user']) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .ilike(u, cleanUsername);

          if (!error && data && data.length > 0) {
            return {
              success: false,
              message: `Username "${cleanUsername}" was found in table "${tableName}", but the verification code you typed did not match. Please verify the code generated by Discord and write it exactly (case sensitive).`
            };
          }
        } catch {}
      }
    }

    // Step 3: Precise diagnostic instructions for RLS or DB errors
    return {
      success: false,
      message: `No active match found for player "${cleanUsername}" with code "${cleanCode}". 

💡 Trouble-shooting Checklist:
1. Double-check that your Supabase table Row-Level Security (RLS) is either DISABLED or has a SELECT Policy. (If RLS is enabled without a SELECT policy, Supabase protects your table and returns 0 rows).
2. To fix: In Supabase table editor or database settings, either click "Disable RLS" on your table, or add an RLS policy: "Enable read access to everyone" so our client can fetch the matching row.`
    };

  } catch (err: any) {
    console.error("Supabase verification error:", err);
    return {
      success: false,
      message: `Supabase integration exception: ${err.message || 'Unknown network error'}`
    };
  }
}
