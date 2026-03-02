import { useState, useEffect, useCallback, useRef } from 'react'
import { AuthProvider, useAuth } from './store/AuthContext'
import { StoreContext } from './store/StoreContext'
import { useStore } from './store/useStore'
import { Auth } from './screens/Auth'
import { ReflectionStep1 } from './screens/ReflectionStep1'
import { ReflectionStep2 } from './screens/ReflectionStep2'
import { Briefing } from './screens/Briefing'
import { Tracker } from './screens/Tracker'
import { Inbox } from './screens/Inbox'
import { Admin } from './screens/Admin'
import { Archive } from './screens/Archive'
import { Layout } from './components/Layout'
import { QuickCapture } from './components/QuickCapture'
import { SettingsModal } from './components/SettingsModal'
import { IdleLock } from './components/IdleLock'
import { getToday, getTomorrow, isEvening, isMorning } from './utils/date'
import type { Category } from './types'

type Screen =
  | 'reflection-1'
  | 'reflection-2'
  | 'briefing'
  | 'tracker'
  | 'inbox'
  | 'admin'
  | 'archive'

function getInitialScreen(
  store: ReturnType<typeof useStore>,
): Screen {
  const today = getToday()
  const tomorrow = getTomorrow()
  const todayDay = store.getDay(today)
  const tomorrowDay = store.getDay(tomorrow)

  if (isEvening(store.settings.eveningStartHour) && !tomorrowDay?.reflectionDone) {
    return 'reflection-1'
  }

  if (isMorning(store.settings.morningEndHour) && todayDay && !todayDay.briefingSeen) {
    return 'briefing'
  }

  return 'tracker'
}

function AppContent() {
  const { user, loading: authLoading } = useAuth()
  const store = useStore()
  const storeRef = useRef(store)
  storeRef.current = store
  const [screen, setScreen] = useState<Screen>('tracker')
  const [screenInitialized, setScreenInitialized] = useState(false)
  const [reflectionCategory, setReflectionCategory] = useState<Category | null>(null)
  const [showGlobalCapture, setShowGlobalCapture] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Set initial screen once data is loaded
  useEffect(() => {
    if (store.loaded && !screenInitialized) {
      setScreen(getInitialScreen(storeRef.current))
      setScreenInitialized(true)
    }
  }, [store.loaded, screenInitialized])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.code === 'Space') {
      e.preventDefault()
      setShowGlobalCapture((prev) => !prev)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-400">Завантаження...</p>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  if (!store.loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-400">Завантаження даних...</p>
      </div>
    )
  }

  return (
    <StoreContext.Provider value={store}>
      <div className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {screen === 'reflection-1' && (
          <ReflectionStep1
            onSelect={(cat) => {
              setReflectionCategory(cat)
              setScreen('reflection-2')
            }}
          />
        )}

        {screen === 'reflection-2' && reflectionCategory && (
          <ReflectionStep2
            category={reflectionCategory}
            onDone={() => setScreen('tracker')}
          />
        )}

        {screen === 'briefing' && (
          <Briefing onContinue={() => setScreen('tracker')} />
        )}

        {(screen === 'tracker' || screen === 'archive') && (
          <Layout
            activeTab={screen === 'archive' ? 'archive' : 'tasks'}
            onTabChange={(tab) => setScreen(tab === 'archive' ? 'archive' : 'tracker')}
            onOpenInbox={() => setScreen('inbox')}
            onOpenAdmin={() => setScreen('admin')}
            onOpenCapture={() => setShowGlobalCapture(true)}
            onOpenSettings={() => setShowSettings(true)}
          >
            {screen === 'tracker' && <Tracker />}
            {screen === 'archive' && <Archive />}
          </Layout>
        )}

        {screen === 'admin' && (
          <Admin onBack={() => setScreen('tracker')} />
        )}

        {screen === 'inbox' && (
          <Inbox onBack={() => setScreen('tracker')} />
        )}

        {showGlobalCapture && screen !== 'reflection-1' && screen !== 'reflection-2' && (
          <QuickCapture onClose={() => setShowGlobalCapture(false)} />
        )}

        {showSettings && (
          <SettingsModal onClose={() => setShowSettings(false)} />
        )}

        <IdleLock />
      </div>
    </StoreContext.Provider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
