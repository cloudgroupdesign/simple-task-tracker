import { useState } from 'react'
import { useAppStore } from '../store/StoreContext'
import type { UserSettings } from '../types'

type SettingsTab = 'schedule'

interface Props {
  onClose: () => void
}

function clampHour(value: number): number {
  return Math.max(0, Math.min(23, Math.round(value)))
}

function ScheduleSettings({
  eveningStartHour,
  morningEndHour,
  onUpdate,
}: {
  eveningStartHour: number
  morningEndHour: number
  onUpdate: (partial: Partial<UserSettings>) => void
}) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">
        Час для вечірньої рефлексії та ранкового брифінгу.
      </p>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Вечірня рефлексія після
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={23}
            value={eveningStartHour}
            onChange={(e) => onUpdate({ eveningStartHour: clampHour(Number(e.target.value)) })}
            className="w-20 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 text-center"
          />
          <span className="text-sm text-gray-500">:00</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ранковий брифінг до
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={23}
            value={morningEndHour}
            onChange={(e) => onUpdate({ morningEndHour: clampHour(Number(e.target.value)) })}
            className="w-20 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 text-center"
          />
          <span className="text-sm text-gray-500">:00</span>
        </div>
      </div>
    </div>
  )
}

export function SettingsModal({ onClose }: Props) {
  const { settings, updateSettings } = useAppStore()
  const [activeTab, setActiveTab] = useState<SettingsTab>('schedule')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 flex overflow-hidden"
        style={{ minHeight: '320px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sidebar */}
        <div className="w-40 bg-gray-50 border-r border-gray-200 p-3 flex flex-col gap-1">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'schedule'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Розклад
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Налаштування</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {activeTab === 'schedule' && (
            <ScheduleSettings
              eveningStartHour={settings.eveningStartHour}
              morningEndHour={settings.morningEndHour}
              onUpdate={updateSettings}
            />
          )}
        </div>
      </div>
    </div>
  )
}
