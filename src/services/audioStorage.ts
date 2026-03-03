// Temporary audio storage via Supabase Storage
// Files are uploaded to the "voice-recordings" bucket and cleaned up when the session ends.
// Prerequisites: create a PUBLIC bucket named "voice-recordings" in Supabase dashboard.

import { supabase } from '../lib/supabase'

const BUCKET = 'voice-recordings'

// Track current session file so we can clean it up
let currentSessionPath: string | null = null

export async function uploadAudio(blob: Blob, userId: string): Promise<string> {
  // Clean up previous recording if any
  await cleanupSessionAudio()

  const id = crypto.randomUUID()
  const filePath = `${userId}/${id}.webm`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, blob, {
      contentType: 'audio/webm',
      upsert: false,
    })

  if (error) {
    throw new Error(`Audio upload failed: ${error.message}`)
  }

  currentSessionPath = filePath

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath)

  return urlData.publicUrl
}

export async function cleanupSessionAudio(): Promise<void> {
  if (!currentSessionPath) return

  const pathToDelete = currentSessionPath
  currentSessionPath = null

  await supabase.storage
    .from(BUCKET)
    .remove([pathToDelete])
    .catch(() => {
      // Silent fail — file may already be gone
    })
}

// Auto-cleanup on page unload (tab close / refresh)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (!currentSessionPath) return
    // Use sendBeacon for reliable cleanup during page unload
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey || !currentSessionPath) return

    const url = `${supabaseUrl}/storage/v1/object/${BUCKET}/${currentSessionPath}`
    // sendBeacon doesn't support DELETE, so use fetch with keepalive
    fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        apikey: supabaseKey,
      },
      keepalive: true,
    }).catch(() => {})
  })
}
