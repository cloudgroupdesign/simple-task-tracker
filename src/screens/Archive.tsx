import { useState } from 'react'
import { useAppStore } from '../store/StoreContext'

export function Archive() {
  const { getArchivedTasks, restoreTask, permanentDeleteTask, getCategory } = useAppStore()
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const archived = getArchivedTasks()

  return (
    <div className="max-w-lg mx-auto p-4 space-y-3">
      {archived.length === 0 && (
        <p className="text-gray-400 text-center py-12">
          Архів порожній
        </p>
      )}

      {archived.map((task) => {
        const category = task.categoryId ? getCategory(task.categoryId) : undefined
        return (
          <div
            key={task.id}
            className="p-3 rounded-lg bg-white border border-gray-200 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className={`${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                  {task.title}
                </p>
                <div className="flex gap-2 mt-1 text-xs text-gray-400">
                  {task.date && <span>{task.date}</span>}
                  {category && <span>{category.name}</span>}
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => restoreTask(task.id)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                >
                  Відновити
                </button>

                {deleteConfirmId === task.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { permanentDeleteTask(task.id); setDeleteConfirmId(null) }}
                      className="px-2 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600 transition"
                    >
                      Так
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                    >
                      Ні
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmId(task.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                    title="Видалити назавжди"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
