import { useAppStore } from '../store/StoreContext'
import { getToday, formatDate } from '../utils/date'
import { getLabels } from '../utils/lang'

interface Props {
  onContinue: () => void
}

export function Briefing({ onContinue }: Props) {
  const { getDay, getCategory, getTasksForDate, markBriefingSeen } = useAppStore()
  const today = getToday()
  const day = getDay(today)
  const category = day ? getCategory(day.categoryId) : undefined
  const tasks = getTasksForDate(today)

  if (!day || !category) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <p className="text-gray-500 mb-4">Сьогоднішній день ще не спланований.</p>
        <button
          onClick={onContinue}
          className="px-6 py-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition font-medium"
        >
          Перейти до трекера
        </button>
      </div>
    )
  }

  const labels = getLabels(category.baseType)

  function handleContinue() {
    markBriefingSeen(today)
    onContinue()
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <p className="text-sm text-gray-400 mb-1">{formatDate(today)}</p>
      <h1 className="text-2xl font-bold mb-2 text-center">{category.name}</h1>
      <p className="text-gray-600 mb-8 text-center">{labels.briefingSubtitle}</p>

      <div className="w-full max-w-sm space-y-2 mb-8">
        {tasks.length === 0 ? (
          <p className="text-gray-400 text-center">
            Немає {labels.taskGenitivePlural} на сьогодні
          </p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200"
            >
              <div className="w-5 h-5 rounded border-2 border-gray-300 flex-shrink-0" />
              <span>{task.title}</span>
            </div>
          ))
        )}
      </div>

      <button
        onClick={handleContinue}
        className="px-8 py-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition font-medium"
      >
        Почати день
      </button>
    </div>
  )
}
