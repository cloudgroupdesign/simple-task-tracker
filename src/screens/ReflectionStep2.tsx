import { useState } from 'react'
import { useAppStore } from '../store/StoreContext'
import type { Category } from '../types'
import { getTomorrow } from '../utils/date'
import { getLabels } from '../utils/lang'

interface Props {
  category: Category
  onDone: () => void
}

export function ReflectionStep2({ category, onDone }: Props) {
  const { addTask, setDay } = useAppStore()
  const [input, setInput] = useState('')
  const [tasks, setTasks] = useState<string[]>([])
  const labels = getLabels(category.baseType)
  const tomorrow = getTomorrow()

  function handleAdd() {
    const trimmed = input.trim()
    if (!trimmed) return
    setTasks((prev) => [...prev, trimmed])
    setInput('')
  }

  function handleDone() {
    const tomorrow = getTomorrow()
    for (const title of tasks) {
      addTask(title, category.id, tomorrow)
    }
    setDay(tomorrow, category.id)
    onDone()
  }

  function handleSkip() {
    setDay(tomorrow, category.id)
    onDone()
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-2 text-center">{labels.newQuestion}</h1>
      <p className="text-sm text-gray-500 mb-6">
        Завтра: <span className="font-medium">{category.name}</span>
      </p>

      <div className="w-full max-w-sm space-y-4">
        <div className="flex gap-2">
          <input
            autoFocus
            type="text"
            placeholder={labels.addPlaceholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
          >
            +
          </button>
        </div>

        {tasks.length > 0 && (
          <ul className="space-y-2">
            {tasks.map((t, i) => (
              <li
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200"
              >
                <span className="text-gray-400 text-sm">{i + 1}.</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2 pt-4">
          <button
            onClick={handleSkip}
            className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition font-medium"
          >
            Скіп
          </button>
          {tasks.length > 0 && (
            <button
              onClick={handleDone}
              className="flex-1 py-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition font-medium"
            >
              Готово
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
