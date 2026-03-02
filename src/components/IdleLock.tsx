import { useState, useEffect, useRef, useCallback } from 'react'

const IDLE_TIMEOUT_MS = 60 * 60 * 1000 // 60 minutes

export function IdleLock() {
  const [locked, setLocked] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setLocked(true), IDLE_TIMEOUT_MS)
  }, [])

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'] as const

    function handleActivity() {
      if (!locked) resetTimer()
    }

    for (const event of events) {
      document.addEventListener(event, handleActivity, { passive: true })
    }

    resetTimer()

    return () => {
      for (const event of events) {
        document.removeEventListener(event, handleActivity)
      }
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [locked, resetTimer])

  if (!locked) return null

  function handleContinue() {
    setLocked(false)
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm mx-4 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m5-7V7a5 5 0 00-10 0v4a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">
          Сесію призупинено
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Через неактивність
        </p>
        <button
          onClick={handleContinue}
          className="w-full py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition"
        >
          Продовжити
        </button>
      </div>
    </div>
  )
}
