import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const SUPER_ADMIN_EMAIL = 'hello.cloudgroup@gmail.com'

interface UserProfile {
  id: string
  email: string
  is_admin: boolean
  created_at: string
  categories_count: number
  tasks_count: number
  completed_tasks_count: number
  days_count: number
}

interface Props {
  onBack: () => void
}

export function Admin({ onBack }: Props) {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Add user form
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [addSuccess, setAddSuccess] = useState<string | null>(null)

  // Action loading per user
  const [actionId, setActionId] = useState<string | null>(null)

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_get_all_users')
    if (error) {
      setError(error.message)
    } else {
      setUsers(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault()
    const email = newEmail.trim()
    const password = newPassword.trim()
    if (!email || !password) return

    setAddLoading(true)
    setAddError(null)
    setAddSuccess(null)

    const { error } = await supabase.rpc('admin_create_user', {
      user_email: email,
      user_password: password,
    })

    setAddLoading(false)

    if (error) {
      setAddError(error.message)
    } else {
      setAddSuccess(`${email} додано`)
      setNewEmail('')
      setNewPassword('')
      fetchUsers()
      setTimeout(() => setAddSuccess(null), 3000)
    }
  }

  async function handleToggleAdmin(user: UserProfile) {
    setActionId(user.id)

    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: !user.is_admin })
      .eq('id', user.id)

    if (error) {
      setError(error.message)
    } else {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_admin: !u.is_admin } : u,
        ),
      )
    }

    setActionId(null)
  }

  async function handleDeleteUser(user: UserProfile) {
    setActionId(user.id)
    setDeleteConfirmId(null)

    const { error } = await supabase.rpc('admin_delete_user', {
      target_user_id: user.id,
    })

    if (error) {
      setError(error.message)
    } else {
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
    }

    setActionId(null)
  }

  const isSuperAdmin = (email: string) => email === SUPER_ADMIN_EMAIL

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 3.6 4 8 4s8-2 8-4V7" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12c0 2 3.6 4 8 4s8-2 8-4" />
            <ellipse cx="12" cy="7" rx="8" ry="4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
          </svg>
          <h1 className="text-lg font-bold">Адмін-панель</h1>
          <span className="text-sm text-gray-400">({users.length})</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Add user form */}
        <form
          onSubmit={handleAddUser}
          className="p-4 rounded-xl bg-white border border-gray-200 space-y-3"
        >
          <p className="text-sm font-medium text-gray-700">Додати користувача</p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-purple-500 text-sm"
            />
            <input
              type="text"
              placeholder="Пароль"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-purple-500 text-sm"
            />
            <button
              type="submit"
              disabled={addLoading}
              className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition disabled:opacity-50"
            >
              {addLoading ? '...' : 'Додати'}
            </button>
          </div>
          {addError && (
            <p className="text-sm text-red-500">{addError}</p>
          )}
          {addSuccess && (
            <p className="text-sm text-green-600">{addSuccess}</p>
          )}
        </form>

        {/* Loading */}
        {loading && (
          <p className="text-gray-400 text-center py-8">Завантаження...</p>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-sm">
              ×
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && users.length === 0 && (
          <p className="text-gray-400 text-center py-8">Немає користувачів</p>
        )}

        {/* User list */}
        {users.map((user) => (
          <div
            key={user.id}
            className="p-4 rounded-xl bg-white border border-gray-200 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{user.email}</p>
                  {isSuperAdmin(user.email) && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-yellow-100 text-yellow-700 flex-shrink-0">
                      OWNER
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 font-mono truncate">{user.id}</p>
              </div>
            </div>

            <div className="flex gap-4 text-sm text-gray-500 flex-wrap">
              <span>Категорій: <strong className="text-gray-700">{user.categories_count}</strong></span>
              <span>Задач: <strong className="text-gray-700">{user.tasks_count}</strong></span>
              <span>Виконано: <strong className="text-green-600">{user.completed_tasks_count}</strong></span>
              <span>Днів: <strong className="text-gray-700">{user.days_count}</strong></span>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {new Date(user.created_at).toLocaleDateString('uk-UA', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>

              <div className="flex items-center gap-2">
                {/* Admin switch */}
                {!isSuperAdmin(user.email) && (
                  <button
                    onClick={() => handleToggleAdmin(user)}
                    disabled={actionId === user.id}
                    className="flex items-center gap-2 text-xs disabled:opacity-50"
                  >
                    <span className={user.is_admin ? 'text-purple-600 font-medium' : 'text-gray-400'}>
                      {actionId === user.id ? '...' : user.is_admin ? 'Admin' : 'User'}
                    </span>
                    <div className={`w-8 h-4.5 rounded-full relative transition ${user.is_admin ? 'bg-purple-500' : 'bg-gray-300'}`}>
                      <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all ${user.is_admin ? 'left-4' : 'left-0.5'}`} />
                    </div>
                  </button>
                )}
                {isSuperAdmin(user.email) && (
                  <span className="text-xs text-purple-600 font-medium">Admin</span>
                )}

                {/* Delete button */}
                {!isSuperAdmin(user.email) && (
                  <>
                    {deleteConfirmId === user.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDeleteUser(user)}
                          disabled={actionId === user.id}
                          className="px-2 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-50"
                        >
                          {actionId === user.id ? '...' : 'Так'}
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
                        onClick={() => setDeleteConfirmId(user.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                        title="Видалити"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
