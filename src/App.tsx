import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react'
import { AuthProvider, useAuth } from './store/AuthContext'
import { StoreContext } from './store/StoreContext'
import { useStore } from './store/useStore'
import { Auth } from './screens/Auth'
import { ReflectionStep1 } from './screens/ReflectionStep1'
import { ReflectionStep2 } from './screens/ReflectionStep2'
import { Briefing } from './screens/Briefing'
import { Tracker } from './screens/Tracker'
import { Inbox } from './screens/Inbox'
import { Archive } from './screens/Archive'
import { Categories } from './screens/Categories'
// Finance lazy-loaded — only fetched when user switches to it
import { Layout } from './components/Layout'
import { QuickCapture } from './components/QuickCapture'
import { SettingsModal } from './components/SettingsModal'
import { CategoryCreateModal } from './components/CategoryCreateModal'
import { IdleLock } from './components/IdleLock'
import { getToday, getTomorrow, isEvening, isMorning } from './utils/date'
import type { Category, AppModule } from './types'

const Admin = lazy(() => import('./screens/Admin'))
const Finance = lazy(() => import('./screens/Finance'))

type Screen =
  | 'reflection-1'
  | 'reflection-2'
  | 'briefing'
  | 'tracker'
  | 'inbox'
  | 'admin'
  | 'archive'
  | 'categories'

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
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [activeApp, setActiveApp] = useState<AppModule>('tracker')

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

  // Admin is always a separate full-screen, regardless of active app
  const isFullScreen = screen === 'admin' || screen === 'inbox' || screen === 'reflection-1' || screen === 'reflection-2' || screen === 'briefing'
  const layoutScreens = !isFullScreen && (activeApp !== 'tracker' || screen === 'tracker' || screen === 'archive' || screen === 'categories')

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

        {layoutScreens && (
          <Layout
            activeTab={screen === 'archive' ? 'archive' : screen === 'categories' ? 'categories' : 'tasks'}
            onTabChange={(tab) => {
              if (tab === 'archive') setScreen('archive')
              else if (tab === 'categories') setScreen('categories')
              else { setScreen('tracker'); setSelectedCategoryId(null) }
            }}
            onOpenAdmin={() => setScreen('admin')}
            onOpenSettings={() => setShowSettings(true)}
            activeApp={activeApp}
            onSwitchApp={(app) => { setActiveApp(app); if (app === 'tracker') setScreen('tracker') }}
            categories={store.state.categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={(id) => {
              setSelectedCategoryId(id)
              setScreen('tracker')
            }}
            onCreateCategory={() => setShowCreateCategory(true)}
            onDeleteCategory={store.deleteCategory}
          >
            {activeApp === 'tracker' && (
              <>
                {screen === 'tracker' && <Tracker selectedCategoryId={selectedCategoryId} />}
                {screen === 'archive' && <Archive />}
                {screen === 'categories' && (
                  <Categories
                    onSelectCategory={(id) => {
                      setSelectedCategoryId(id)
                      setScreen('tracker')
                    }}
                    onCreateCategory={() => setShowCreateCategory(true)}
                  />
                )}
              </>
            )}
            {activeApp === 'finance' && (
              <Suspense fallback={<div className="flex items-center justify-center py-20"><p className="text-gray-400">Завантаження...</p></div>}>
                <Finance />
              </Suspense>
            )}
          </Layout>
        )}

        {screen === 'admin' && (
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
              <p className="text-gray-400">Завантаження...</p>
            </div>
          }>
            <Admin onBack={() => setScreen('tracker')} />
          </Suspense>
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

        {showCreateCategory && (
          <CategoryCreateModal onClose={() => setShowCreateCategory(false)} />
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
