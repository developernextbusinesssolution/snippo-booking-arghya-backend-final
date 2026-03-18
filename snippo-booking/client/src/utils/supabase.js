import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Lazy initialization — only creates the client when first needed.
// This prevents the app from crashing on startup if env vars are not set.
let _supabase = null;
function getSupabase() {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Supabase credentials not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to client/.env"
      );
    }
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

export { getSupabase as supabase };

/**
 * Uploads an image file to the `staff-avatars` bucket and returns the public URL.
 * @param {File} file - The image file to upload.
 * @param {string} staffId - Unique identifier for the staff member (used as filename prefix).
 * @returns {Promise<string>} Public URL of the uploaded image.
 */
export async function uploadStaffAvatar(file, staffId) {
  const client = getSupabase();

  const ext = file.name.split(".").pop();
  const path = `avatars/${staffId}_${Date.now()}.${ext}`;

  const { error } = await client.storage
    .from("staff-avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const { data } = client.storage.from("staff-avatars").getPublicUrl(path);
  return data.publicUrl;
}
