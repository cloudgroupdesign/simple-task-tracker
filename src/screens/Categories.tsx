import { useState } from 'react'
import { useAppStore } from '../store/StoreContext'

interface Props {
  onSelectCategory: (id: string) => void
  onCreateCategory: () => void
}

export function Categories({ onSelectCategory, onCreateCategory }: Props) {
  const { state, deleteCategory } = useAppStore()
  const [deleteCatConfirmId, setDeleteCatConfirmId] = useState<string | null>(null)

  const categoriesWithCounts = state.categories.map((cat) => ({
    ...cat,
    taskCount: state.tasks.filter((t) => t.categoryId === cat.id && !t.isArchived && !t.isInbox).length,
  }))

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      {/* Create button */}
      <button
        onClick={onCreateCategory}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Нова категорія
      </button>

      {/* Empty state */}
      {categoriesWithCounts.length === 0 && (
        <p className="text-gray-400 text-center py-8">Немає категорій</p>
      )}

      {/* Categories list */}
      {categoriesWithCounts.map((cat) => (
        <div
          key={cat.id}
          className="w-full flex items-center justify-between p-4 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition group"
        >
          {deleteCatConfirmId === cat.id ? (
            <div className="flex items-center gap-2 w-full">
              <span className="text-sm text-gray-500 flex-1">Видалити «{cat.name}»?</span>
              <button
                onClick={() => { deleteCategory(cat.id); setDeleteCatConfirmId(null) }}
                className="px-3 py-1 text-xs rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition font-medium"
              >
                Так
              </button>
              <button
                onClick={() => setDeleteCatConfirmId(null)}
                className="px-3 py-1 text-xs rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
              >
                Ні
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => onSelectCategory(cat.id)}
                className="flex-1 flex items-center gap-3 text-left"
              >
                <span className="w-3 h-3 rounded-full bg-blue-400 flex-shrink-0" />
                <span className="font-medium">{cat.name}</span>
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">{cat.taskCount} завд.</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteCatConfirmId(cat.id) }}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
