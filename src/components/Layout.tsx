import { useState } from 'react'
import { useAuth } from '../store/AuthContext'
import type { Category } from '../types'

type Tab = 'tasks' | 'archive' | 'categories'

interface Props {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  onOpenAdmin?: () => void
  onOpenSettings: () => void
  categories: Category[]
  selectedCategoryId: string | null
  onSelectCategory: (id: string | null) => void
  onCreateCategory: () => void
  onDeleteCategory: (id: string) => void
  children: React.ReactNode
}

export function Layout({
  activeTab,
  onTabChange,
  onOpenAdmin,
  onOpenSettings,
  categories,
  selectedCategoryId,
  onSelectCategory,
  children,
  onCreateCategory,
  onDeleteCategory,
}: Props) {
  const { user, isAdmin, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [categoriesExpanded, setCategoriesExpanded] = useState(true)
  const [deleteCatConfirmId, setDeleteCatConfirmId] = useState<string | null>(null)

  const headerTitle = (() => {
    if (activeTab === 'archive') return 'Архів'
    if (activeTab === 'categories') return 'Категорії'
    if (selectedCategoryId) {
      const cat = categories.find((c) => c.id === selectedCategoryId)
      return cat?.name ?? 'Завдання'
    }
    return 'Завдання'
  })()

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-60 bg-white border-r border-gray-200 flex flex-col transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-4 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Simple Tracker</h2>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {/* Завдання */}
          <button
            onClick={() => { onSelectCategory(null); onTabChange('tasks'); setSidebarOpen(false) }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'tasks' && !selectedCategoryId
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Завдання
          </button>

          {/* Категорії — розкривна секція */}
          <div>
            <div className={`flex items-center rounded-lg text-sm font-medium transition ${
              activeTab === 'categories' || (activeTab === 'tasks' && selectedCategoryId)
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}>
              <button
                onClick={() => { onTabChange('categories'); setSidebarOpen(false) }}
                className="flex-1 flex items-center gap-3 px-3 py-2.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Категорії
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setCategoriesExpanded(!categoriesExpanded) }}
                className="p-2 rounded-lg hover:bg-black/5 transition"
              >
                <svg className={`w-4 h-4 transition-transform ${categoriesExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {categoriesExpanded && (
              <div className="ml-4 mt-1 space-y-0.5">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center group">
                    {deleteCatConfirmId === cat.id ? (
                      <div className="flex items-center gap-1 w-full px-3 py-1.5">
                        <span className="text-xs text-gray-500 truncate flex-1">Видалити?</span>
                        <button
                          onClick={() => { onDeleteCategory(cat.id); setDeleteCatConfirmId(null) }}
                          className="px-2 py-0.5 text-xs rounded bg-red-100 text-red-600 hover:bg-red-200 transition"
                        >
                          Так
                        </button>
                        <button
                          onClick={() => setDeleteCatConfirmId(null)}
                          className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
                        >
                          Ні
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => { onSelectCategory(cat.id); setSidebarOpen(false) }}
                          className={`flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition ${
                            selectedCategoryId === cat.id
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                          <span className="truncate">{cat.name}</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteCatConfirmId(cat.id) }}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => { onCreateCategory(); setSidebarOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Нова категорія
                </button>
              </div>
            )}
          </div>

          {/* Архів */}
          <button
            onClick={() => { onTabChange('archive'); setSidebarOpen(false) }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'archive'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            Архів
          </button>
        </nav>

        {/* Sidebar bottom: user info */}
        <div className="p-3 border-t border-gray-100 space-y-2">
          <p className="text-xs text-gray-400 truncate px-3">{user?.email}</p>
          <button
            onClick={() => { onOpenSettings(); setSidebarOpen(false) }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Налаштування
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Hamburger for mobile */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition lg:hidden"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg font-bold">{headerTitle}</h1>
            </div>

            <div className="flex items-center gap-1">
              {isAdmin && onOpenAdmin && (
                <button
                  onClick={onOpenAdmin}
                  className="p-2 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition"
                  title="Адмін-панель"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 3.6 4 8 4s8-2 8-4V7" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12c0 2 3.6 4 8 4s8-2 8-4" />
                    <ellipse cx="12" cy="7" rx="8" ry="4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                  </svg>
                </button>
              )}
              <button
                onClick={signOut}
                className="px-3 py-1.5 text-sm rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
              >
                Вийти
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
