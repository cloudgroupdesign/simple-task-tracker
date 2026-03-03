import { useState, useEffect, useCallback, useRef } from 'react'
import { useVoiceRecorder } from '../hooks/useVoiceRecorder'
import { uploadAudio, cleanupSessionAudio } from '../services/audioStorage'
import { sendAudioToGumloop } from '../services/gumloop'
import { useAppStore } from '../store/StoreContext'
import { useAuth } from '../store/AuthContext'
import { getToday } from '../utils/date'

type Stage = 'recording' | 'uploading' | 'processing' | 'result'

interface Props {
  onClose: () => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function VoiceTaskModal({ onClose }: Props) {
  const { state, addTask } = useAppStore()
  const { user } = useAuth()
  const recorder = useVoiceRecorder()
  const cleanedUpRef = useRef(false)

  const [stage, setStage] = useState<Stage>('recording')
  const [taskTitle, setTaskTitle] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Cleanup audio from storage when modal unmounts
  useEffect(() => {
    return () => {
      if (!cleanedUpRef.current) {
        cleanupSessionAudio()
      }
    }
  }, [])

  // Auto-start recording when modal opens
  useEffect(() => {
    recorder.start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When recording stops and we have a blob, move to uploading
  useEffect(() => {
    if (!recorder.isRecording && recorder.audioBlob && stage === 'recording') {
      setStage('uploading')
      processAudio(recorder.audioBlob)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder.isRecording, recorder.audioBlob, stage])

  const processAudio = useCallback(async (blob: Blob) => {
    try {
      setError(null)

      // Step 1: Upload to Supabase Storage
      const audioUrl = await uploadAudio(blob, user!.id)

      // Step 2: Send URL to Gumloop
      setStage('processing')
      const result = await sendAudioToGumloop(audioUrl)
      setTaskTitle(result.title)
      setStage('result')
    } catch (err) {
      console.error('Voice processing error:', err)
      setError('Помилка обробки аудіо. Спробуйте ще раз.')
      setStage('result')
    }
  }, [user])

  function handleCancel() {
    recorder.cancel()
    cleanedUpRef.current = true
    cleanupSessionAudio()
    onClose()
  }

  function handleStopRecording() {
    recorder.stop()
  }

  function handleSelectCategory(categoryId: string) {
    setSelectedCategoryId(categoryId)
  }

  function handleSaveTask() {
    if (!taskTitle.trim()) return
    const today = getToday()
    addTask(taskTitle.trim(), selectedCategoryId || '', today)
    setSaved(true)
    cleanedUpRef.current = true
    cleanupSessionAudio()
    setTimeout(() => onClose(), 600)
  }

  function handleRetry() {
    setStage('recording')
    setTaskTitle('')
    setSelectedCategoryId(null)
    setError(null)
    recorder.start()
  }

  // Permission denied state
  if (recorder.permissionState === 'denied') {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
        <div
          className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md mx-0 sm:mx-4 p-6 space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Доступ до мікрофона</h3>
              <p className="text-sm text-gray-500">Надайте доступ до мікрофона в налаштуваннях браузера</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition text-sm"
          >
            Закрити
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md mx-0 sm:mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">
            {stage === 'recording' && 'Голосовий запис'}
            {stage === 'uploading' && 'Завантаження запису'}
            {stage === 'processing' && 'Обробка запису'}
            {stage === 'result' && 'Нове завдання'}
          </h3>
          <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* ===== RECORDING STAGE ===== */}
          {stage === 'recording' && (
            <div className="flex flex-col items-center space-y-6 py-4">
              {/* Pulsing mic indicator */}
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-25" />
                <div className="relative w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
              </div>

              {/* Timer */}
              <div className="text-2xl font-mono text-gray-800 tabular-nums">
                {formatTime(recorder.elapsedSeconds)}
              </div>

              <p className="text-sm text-gray-500">Записую...</p>

              {/* Actions */}
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition text-sm"
                >
                  Скасувати
                </button>
                <button
                  onClick={handleStopRecording}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition text-sm flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                  Зупинити
                </button>
              </div>
            </div>
          )}

          {/* ===== UPLOADING STAGE (chat-like) ===== */}
          {stage === 'uploading' && (
            <div className="space-y-4 py-2">
              {/* Audio file "message" */}
              <div className="flex justify-end">
                <div className="bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-3 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <span className="text-sm font-medium">Голосовий запис</span>
                    <span className="text-xs opacity-75">{formatTime(recorder.elapsedSeconds)}</span>
                  </div>
                </div>
              </div>

              {/* Uploading indicator */}
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-gray-500">Завантажую запис...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== PROCESSING STAGE (chat-like) ===== */}
          {stage === 'processing' && (
            <div className="space-y-4 py-2">
              {/* Audio file "message" */}
              <div className="flex justify-end">
                <div className="bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-3 max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <span className="text-sm font-medium">Голосовий запис</span>
                    <span className="text-xs opacity-75">{formatTime(recorder.elapsedSeconds)}</span>
                  </div>
                </div>
              </div>

              {/* Loading response */}
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-gray-500">Обробляю запис...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== RESULT STAGE ===== */}
          {stage === 'result' && (
            <div className="space-y-4 py-2">
              {error ? (
                /* Error state */
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition text-sm"
                    >
                      Скасувати
                    </button>
                    <button
                      onClick={handleRetry}
                      className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition text-sm"
                    >
                      Спробувати знову
                    </button>
                  </div>
                </div>
              ) : (
                /* Task card with category selection */
                <div className="space-y-4">
                  {/* Task card */}
                  <div className={`border rounded-xl p-4 transition ${saved ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'}`}>
                    {saved ? (
                      <div className="flex items-center gap-2 text-green-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium text-sm">Збережено!</span>
                      </div>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={taskTitle}
                          onChange={(e) => setTaskTitle(e.target.value)}
                          className="w-full text-sm font-medium text-gray-900 bg-transparent border-0 p-0 focus:outline-none focus:ring-0 placeholder-gray-400"
                          placeholder="Назва завдання"
                        />

                        {/* Category buttons */}
                        <div className="mt-3">
                          <p className="text-xs text-gray-400 mb-2">Категорія</p>
                          <div className="flex flex-wrap gap-2">
                            {state.categories.map((cat) => (
                              <button
                                key={cat.id}
                                onClick={() => handleSelectCategory(cat.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                                  selectedCategoryId === cat.id
                                    ? 'bg-blue-500 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {cat.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Save button */}
                  {!saved && (
                    <button
                      onClick={handleSaveTask}
                      disabled={!taskTitle.trim()}
                      className="w-full py-2.5 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Зберегти завдання
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
