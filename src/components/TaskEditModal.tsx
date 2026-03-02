import { useState, useContext } from 'react'
import { StoreContext } from '../store/StoreContext'
import type { Task } from '../types'

interface Props {
  task: Task
  onClose: () => void
}

export function TaskEditModal({ task, onClose }: Props) {
  const store = useContext(StoreContext)!
  const [title, setTitle] = useState(task.title)
  const [categoryId, setCategoryId] = useState(task.categoryId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    store.updateTask(task.id, { title: trimmed, categoryId })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-sm mx-4 p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold">Редагувати завдання</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Назва</label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Категорія</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-blue-500 text-sm"
            >
              <option value="">Без категорії</option>
              {store.state.categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-2 text-sm rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition disabled:opacity-50"
            >
              Зберегти
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
