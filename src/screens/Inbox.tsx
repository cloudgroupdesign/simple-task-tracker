import { useAppStore } from '../store/StoreContext'
import { getToday, getTomorrow } from '../utils/date'

interface Props {
  onBack: () => void
}

export function Inbox({ onBack }: Props) {
  const { getInboxTasks, assignInboxTask, deleteTask, getDay, state } = useAppStore()
  const tasks = getInboxTasks()
  const today = getToday()
  const tomorrow = getTomorrow()

  function handleAssign(taskId: string, date: string) {
    const day = getDay(date)
    if (day) {
      assignInboxTask(taskId, date, day.categoryId)
    } else {
      // If no day is set, use the first available category
      const cat = state.categories[0]
      if (cat) {
        assignInboxTask(taskId, date, cat.id)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-lg font-bold">Inbox</h1>
          <span className="text-sm text-gray-400">({tasks.length})</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-3">
        {tasks.length === 0 && (
          <p className="text-gray-400 text-center py-8">Inbox порожній</p>
        )}

        {tasks.map((task) => (
          <div
            key={task.id}
            className="p-4 rounded-xl bg-white border border-gray-200 space-y-3"
          >
            <p className="font-medium">{task.title}</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleAssign(task.id, today)}
                className="flex-1 py-2 text-sm rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
              >
                Сьогодні
              </button>
              <button
                onClick={() => handleAssign(task.id, tomorrow)}
                className="flex-1 py-2 text-sm rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition"
              >
                Завтра
              </button>
              <button
                onClick={() => deleteTask(task.id)}
                className="py-2 px-3 text-sm rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
              >
                Видалити
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
