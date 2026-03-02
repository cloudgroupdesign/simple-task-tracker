import { useState } from 'react'
import { useAppStore } from '../store/StoreContext'
import type { Category, BaseType } from '../types'

interface Props {
  onSelect: (category: Category) => void
}

export function ReflectionStep1({ onSelect }: Props) {
  const { state, addCategory } = useAppStore()
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<BaseType>('work')

  function handleCreate() {
    const trimmed = newName.trim()
    if (!trimmed) return
    const cat = addCategory(trimmed, newType)
    setCreating(false)
    setNewName('')
    onSelect(cat)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-2 text-center">Вечірня рефлексія</h1>
      <p className="text-lg text-gray-600 mb-8 text-center">Який завтра день?</p>

      <div className="w-full max-w-sm space-y-3">
        {state.categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat)}
            className="w-full p-4 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition text-left"
          >
            <span className="font-medium">{cat.name}</span>
            <span className="text-sm text-gray-400 ml-2">
              {cat.baseType === 'work' ? 'робота' : 'відпочинок'}
            </span>
          </button>
        ))}

        {!creating ? (
          <button
            onClick={() => setCreating(true)}
            className="w-full p-4 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-500 transition"
          >
            + Створити нову категорію
          </button>
        ) : (
          <div className="p-4 rounded-xl border border-blue-300 bg-blue-50 space-y-3">
            <input
              autoFocus
              type="text"
              placeholder="Назва категорії"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setNewType('work')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                  newType === 'work'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border border-gray-300 text-gray-600'
                }`}
              >
                Робота
              </button>
              <button
                onClick={() => setNewType('rest')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                  newType === 'rest'
                    ? 'bg-green-500 text-white'
                    : 'bg-white border border-gray-300 text-gray-600'
                }`}
              >
                Відпочинок
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCreating(false)}
                className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
              >
                Скасувати
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
              >
                Зберегти
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
