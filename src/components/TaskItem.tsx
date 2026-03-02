import { memo } from 'react'
import type { Task } from '../types'

interface Props {
  task: Task
  completed: boolean
  deleteConfirmId: string | null
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onDeleteConfirm: (id: string | null) => void
}

export const TaskItem = memo(function TaskItem({ task, completed, deleteConfirmId, onToggle, onDelete, onDeleteConfirm }: Props) {
  const isConfirming = deleteConfirmId === task.id

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border transition ${
        completed
          ? 'bg-gray-50 border-gray-100 hover:bg-gray-100'
          : 'bg-white border-gray-200 hover:bg-gray-50'
      }`}
    >
      {/* Checkbox */}
      <div
        onClick={() => onToggle(task.id)}
        className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center cursor-pointer ${
          completed ? 'border-green-400 bg-green-400' : 'border-gray-300'
        }`}
      >
        {completed && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      {/* Title */}
      <span
        onClick={() => onToggle(task.id)}
        className={`flex-1 cursor-pointer ${completed ? 'line-through text-gray-400' : ''}`}
      >
        {task.title}
      </span>

      {/* Delete / Confirm */}
      {isConfirming ? (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => { onDelete(task.id); onDeleteConfirm(null) }}
            className="px-2 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600 transition"
          >
            Так
          </button>
          <button
            onClick={() => onDeleteConfirm(null)}
            className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
          >
            Ні
          </button>
        </div>
      ) : (
        <button
          onClick={() => onDeleteConfirm(task.id)}
          className="p-1 rounded text-gray-300 hover:text-red-500 transition flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
})
