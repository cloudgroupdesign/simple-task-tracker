import { useState } from 'react'
import { useAppStore } from '../store/StoreContext'
import type { BaseType } from '../types'
import { getToday } from '../utils/date'
import { getLabels } from '../utils/lang'
import { TaskItem } from '../components/TaskItem'

export function Tracker() {
  const { state, getTasksForDate, toggleTask, deleteTask, setActiveMode, addTask, addCategory } =
    useAppStore()
  const today = getToday()
  const [input, setInput] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const mode = state.activeMode
  const tasks = getTasksForDate(today, mode)
  const labels = getLabels(mode)

  const pending = tasks.filter((t) => !t.completed)
  const completed = tasks.filter((t) => t.completed)

  function handleAddTask() {
    const trimmed = input.trim()
    if (!trimmed) return
    let cat = state.categories.find((c) => c.baseType === mode)
    if (!cat) {
      cat = addCategory(mode === 'work' ? 'Робота' : 'Відпочинок', mode)
    }
    addTask(trimmed, cat.id, today)
    setInput('')
  }

  return (
    <div>
      {/* Mode switch */}
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['work', 'rest'] as BaseType[]).map((m) => (
            <button
              key={m}
              onClick={() => setActiveMode(m)}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${
                mode === m
                  ? m === 'work'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-green-500 text-white shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              {m === 'work' ? 'Робота' : 'Відпочинок'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Add task inline */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={labels.addPlaceholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleAddTask}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
          >
            +
          </button>
        </div>

        {/* Empty state */}
        {pending.length === 0 && completed.length === 0 && (
          <p className="text-gray-400 text-center py-8">
            Немає {labels.taskGenitivePlural} у цьому режимі
          </p>
        )}

        {/* Pending tasks */}
        {pending.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            completed={false}
            deleteConfirmId={deleteConfirmId}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onDeleteConfirm={setDeleteConfirmId}
          />
        ))}

        {/* Completed tasks */}
        {completed.length > 0 && (
          <>
            <p className="text-xs text-gray-400 uppercase tracking-wide pt-2">
              Виконано ({completed.length})
            </p>
            {completed.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                completed
                deleteConfirmId={deleteConfirmId}
                onToggle={toggleTask}
                onDelete={deleteTask}
                onDeleteConfirm={setDeleteConfirmId}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
