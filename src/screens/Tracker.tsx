import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../store/StoreContext'
import { getToday } from '../utils/date'
import { TaskItem } from '../components/TaskItem'
import { TaskEditModal } from '../components/TaskEditModal'
import type { Task } from '../types'

interface Props {
  selectedCategoryId?: string | null
}

export function Tracker({ selectedCategoryId }: Props) {
  const { state, getTasksForDate, toggleTask, deleteTask, addTask } = useAppStore()
  const today = getToday()
  const [showForm, setShowForm] = useState(false)
  const [input, setInput] = useState('')
  const [taskCategoryId, setTaskCategoryId] = useState(selectedCategoryId || '')
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Update default category when selectedCategoryId changes
  useEffect(() => {
    setTaskCategoryId(selectedCategoryId || '')
  }, [selectedCategoryId])

  // Focus input when form opens
  useEffect(() => {
    if (showForm) inputRef.current?.focus()
  }, [showForm])

  // Close category picker on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowCategoryPicker(false)
      }
    }
    if (showCategoryPicker) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [showCategoryPicker])

  const filter = selectedCategoryId ? { categoryId: selectedCategoryId } : undefined
  const tasks = getTasksForDate(today, filter)

  const pending = tasks.filter((t) => !t.completed)
  const completed = tasks.filter((t) => t.completed)

  const selectedCat = state.categories.find((c) => c.id === taskCategoryId)

  function handleAddTask() {
    const trimmed = input.trim()
    if (!trimmed) return
    addTask(trimmed, taskCategoryId, today)
    setInput('')
    setShowForm(false)
    if (!selectedCategoryId) setTaskCategoryId('')
  }

  function handleCancel() {
    setInput('')
    setShowForm(false)
    setShowCategoryPicker(false)
    if (!selectedCategoryId) setTaskCategoryId('')
  }

  return (
    <div>
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Add task button / form */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Додати завдання
          </button>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 shadow-sm">
            <input
              ref={inputRef}
              type="text"
              placeholder="Назва завдання"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTask()
                if (e.key === 'Escape') handleCancel()
              }}
              className="w-full px-0 py-1 text-sm border-0 bg-transparent focus:outline-none placeholder-gray-400"
            />

            <div className="flex items-center justify-between">
              {/* Category picker */}
              <div className="relative" ref={pickerRef}>
                <button
                  onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition ${
                    selectedCat
                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {selectedCat ? selectedCat.name : 'Категорія'}
                </button>

                {showCategoryPicker && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                    {taskCategoryId && (
                      <button
                        onClick={() => { setTaskCategoryId(''); setShowCategoryPicker(false) }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-400 hover:bg-gray-50 transition"
                      >
                        Без категорії
                      </button>
                    )}
                    {state.categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => { setTaskCategoryId(cat.id); setShowCategoryPicker(false) }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition ${
                          taskCategoryId === cat.id
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-xs rounded-lg text-gray-500 hover:bg-gray-100 transition"
                >
                  Скасувати
                </button>
                <button
                  onClick={handleAddTask}
                  disabled={!input.trim()}
                  className="px-3 py-1.5 text-xs rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition disabled:opacity-50"
                >
                  Додати
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {pending.length === 0 && completed.length === 0 && (
          <p className="text-gray-400 text-center py-8">
            Немає завдань
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
            onEdit={setEditingTask}
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
                onEdit={setEditingTask}
              />
            ))}
          </>
        )}
      </div>

      {editingTask && (
        <TaskEditModal task={editingTask} onClose={() => setEditingTask(null)} />
      )}
    </div>
  )
}
