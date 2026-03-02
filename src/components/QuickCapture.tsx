import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../store/StoreContext'

interface Props {
  onClose: () => void
}

export function QuickCapture({ onClose }: Props) {
  const { addInboxTask } = useAppStore()
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSubmit() {
    const trimmed = input.trim()
    if (!trimmed) return
    addInboxTask(trimmed)
    setInput('')
    onClose()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl p-4 w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-gray-500 mb-2">Швидкий захват в Inbox</p>
        <input
          ref={inputRef}
          type="text"
          placeholder="Що зафіксувати?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
        />
        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
          >
            Скасувати
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
          >
            Зберегти
          </button>
        </div>
      </div>
    </div>
  )
}
