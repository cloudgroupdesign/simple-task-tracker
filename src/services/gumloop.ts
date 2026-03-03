// Gumloop API integration for voice-to-task processing
// Receives a public audio URL (Supabase Storage) and returns a parsed task

export interface GumloopTaskResult {
  title: string
  suggestedCategories?: string[]
}

const GUMLOOP_API_URL = import.meta.env.VITE_GUMLOOP_API_URL || ''
const GUMLOOP_API_KEY = import.meta.env.VITE_GUMLOOP_API_KEY || ''

export async function sendAudioToGumloop(audioUrl: string): Promise<GumloopTaskResult> {
  if (!GUMLOOP_API_URL) {
    // Placeholder: simulate API call for development
    return simulateGumloopResponse(audioUrl)
  }

  const response = await fetch(GUMLOOP_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(GUMLOOP_API_KEY ? { Authorization: `Bearer ${GUMLOOP_API_KEY}` } : {}),
    },
    body: JSON.stringify({ audio_url: audioUrl }),
  })

  if (!response.ok) {
    throw new Error(`Gumloop API error: ${response.status}`)
  }

  const data = await response.json()
  return {
    title: data.title || data.task_name || '',
    suggestedCategories: data.suggested_categories || data.categories || [],
  }
}

// Development placeholder — simulates a 2-second API delay
function simulateGumloopResponse(audioUrl: string): Promise<GumloopTaskResult> {
  console.log('[Gumloop dev] Would send audio URL:', audioUrl)
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        title: 'Завдання з голосового запису',
        suggestedCategories: [],
      })
    }, 2000)
  })
}
