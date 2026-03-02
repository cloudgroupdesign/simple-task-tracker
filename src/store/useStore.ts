import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import type { AppState, Category, Task, Day, BaseType, UserSettings } from '../types'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

// Supabase row types
interface CategoryRow {
  id: string
  name: string
  base_type: BaseType
  user_id: string
}

interface TaskRow {
  id: string
  title: string
  category_id: string | null
  date: string | null
  completed: boolean
  created_at: string
  is_inbox: boolean
  is_archived: boolean
  user_id: string
}

interface DayRow {
  date: string
  category_id: string
  reflection_done: boolean
  briefing_seen: boolean
  user_id: string
}

interface UserSettingsRow {
  user_id: string
  evening_start_hour: number
  morning_end_hour: number
}

const defaultState: AppState = {
  categories: [],
  tasks: [],
  days: [],
  activeMode: 'work',
}

const defaultSettings: UserSettings = {
  eveningStartHour: 20,
  morningEndHour: 7,
}

// Silently ignore fire-and-forget DB errors (optimistic UI)
function fireAndForget(promise: PromiseLike<unknown>) {
  promise.then(null, () => {})
}

// DB row → app type mappers
function rowToCategory(row: CategoryRow): Category {
  return { id: row.id, name: row.name, baseType: row.base_type }
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    categoryId: row.category_id ?? '',
    date: row.date ?? '',
    completed: row.completed,
    createdAt: row.created_at,
    isInbox: row.is_inbox,
    isArchived: row.is_archived ?? false,
  }
}

function rowToDay(row: DayRow): Day {
  return {
    date: row.date,
    categoryId: row.category_id,
    reflectionDone: row.reflection_done,
    briefingSeen: row.briefing_seen,
  }
}

function rowToUserSettings(row: UserSettingsRow): UserSettings {
  return {
    eveningStartHour: row.evening_start_hour,
    morningEndHour: row.morning_end_hour,
  }
}

// Generic realtime handler to deduplicate INSERT/UPDATE/DELETE logic
function handleRealtimeEvent<T>(
  items: T[],
  payload: { eventType: string; new: unknown; old: unknown },
  getId: (item: T) => string,
  mapper: (row: never) => T,
): T[] | null {
  if (payload.eventType === 'INSERT') {
    const mapped = mapper(payload.new as never)
    if (items.some((item) => getId(item) === getId(mapped))) return null
    return [...items, mapped]
  }
  if (payload.eventType === 'UPDATE') {
    const mapped = mapper(payload.new as never)
    const id = getId(mapped)
    return items.map((item) => (getId(item) === id ? mapped : item))
  }
  if (payload.eventType === 'DELETE') {
    const oldId = getId(mapper(payload.old as never))
    return items.filter((item) => getId(item) !== oldId)
  }
  return null
}

export function useStore() {
  const { user } = useAuth()
  const [state, setState] = useState<AppState>(defaultState)
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [loaded, setLoaded] = useState(false)
  const mountedRef = useRef(true)

  // Load all data from Supabase on mount / user change
  useEffect(() => {
    mountedRef.current = true
    if (!user) {
      setState(defaultState)
      setLoaded(false)
      return
    }

    async function fetchAll() {
      const [catRes, taskRes, dayRes, settingsRes] = await Promise.all([
        supabase.from('categories').select('*').eq('user_id', user!.id),
        supabase.from('tasks').select('*').eq('user_id', user!.id),
        supabase.from('days').select('*').eq('user_id', user!.id),
        supabase.from('user_settings').select('*').eq('user_id', user!.id).maybeSingle(),
      ])

      if (!mountedRef.current) return

      let categories = (catRes.data as CategoryRow[] ?? []).map(rowToCategory)

      // Create default categories for new users
      if (categories.length === 0) {
        const workId = crypto.randomUUID()
        const restId = crypto.randomUUID()
        const defaultCats: Category[] = [
          { id: workId, name: 'Робота', baseType: 'work' },
          { id: restId, name: 'Відпочинок', baseType: 'rest' },
        ]
        categories = defaultCats
        fireAndForget(
          supabase.from('categories').insert([
            { id: workId, user_id: user!.id, name: 'Робота', base_type: 'work' },
            { id: restId, user_id: user!.id, name: 'Відпочинок', base_type: 'rest' },
          ]),
        )
      }

      setState({
        categories,
        tasks: (taskRes.data as TaskRow[] ?? []).map(rowToTask),
        days: (dayRes.data as DayRow[] ?? []).map(rowToDay),
        activeMode: 'work',
      })
      if (settingsRes.data) {
        setSettings(rowToUserSettings(settingsRes.data as UserSettingsRow))
      } else {
        setSettings(defaultSettings)
      }
      setLoaded(true)
    }

    fetchAll()
    return () => { mountedRef.current = false }
  }, [user])

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setState((prev) => {
            const result = handleRealtimeEvent(prev.categories, payload, (c) => c.id, rowToCategory as (row: never) => Category)
            return result ? { ...prev, categories: result } : prev
          })
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setState((prev) => {
            const result = handleRealtimeEvent(prev.tasks, payload, (t) => t.id, rowToTask as (row: never) => Task)
            return result ? { ...prev, tasks: result } : prev
          })
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'days', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setState((prev) => {
            const result = handleRealtimeEvent(prev.days, payload, (d) => d.date, rowToDay as (row: never) => Day)
            return result ? { ...prev, days: result } : prev
          })
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_settings', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setSettings(defaultSettings)
          } else {
            setSettings(rowToUserSettings(payload.new as UserSettingsRow))
          }
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  // Categories
  const addCategory = useCallback(
    (name: string, baseType: BaseType): Category => {
      const id = crypto.randomUUID()
      const category: Category = { id, name, baseType }
      setState((prev) => ({ ...prev, categories: [...prev.categories, category] }))
      fireAndForget(supabase.from('categories').insert({ id, user_id: user!.id, name, base_type: baseType }))
      return category
    },
    [user],
  )

  // Days
  const setDay = useCallback(
    (date: string, categoryId: string) => {
      const day: Day = { date, categoryId, reflectionDone: true, briefingSeen: false }
      setState((prev) => {
        const idx = prev.days.findIndex((d) => d.date === date)
        const days = [...prev.days]
        if (idx >= 0) days[idx] = day
        else days.push(day)
        return { ...prev, days }
      })
      fireAndForget(
        supabase.from('days').upsert(
          { user_id: user!.id, date, category_id: categoryId, reflection_done: true, briefing_seen: false },
          { onConflict: 'user_id,date' },
        ),
      )
    },
    [user],
  )

  const markBriefingSeen = useCallback(
    (date: string) => {
      setState((prev) => ({
        ...prev,
        days: prev.days.map((d) => (d.date === date ? { ...d, briefingSeen: true } : d)),
      }))
      fireAndForget(supabase.from('days').update({ briefing_seen: true }).eq('user_id', user!.id).eq('date', date))
    },
    [user],
  )

  const getDay = useCallback(
    (date: string): Day | undefined => state.days.find((d) => d.date === date),
    [state.days],
  )

  const getCategory = useCallback(
    (id: string): Category | undefined => state.categories.find((c) => c.id === id),
    [state.categories],
  )

  // Tasks
  const addTask = useCallback(
    (title: string, categoryId: string, date: string): Task => {
      const id = crypto.randomUUID()
      const task: Task = { id, title, categoryId, date, completed: false, createdAt: new Date().toISOString(), isInbox: false, isArchived: false }
      setState((prev) => ({ ...prev, tasks: [...prev.tasks, task] }))
      fireAndForget(supabase.from('tasks').insert({ id, user_id: user!.id, title, category_id: categoryId, date, completed: false, is_inbox: false }))
      return task
    },
    [user],
  )

  const addInboxTask = useCallback(
    (title: string): Task => {
      const id = crypto.randomUUID()
      const task: Task = { id, title, categoryId: '', date: '', completed: false, createdAt: new Date().toISOString(), isInbox: true, isArchived: false }
      setState((prev) => ({ ...prev, tasks: [...prev.tasks, task] }))
      fireAndForget(supabase.from('tasks').insert({ id, user_id: user!.id, title, category_id: null, date: null, completed: false, is_inbox: true }))
      return task
    },
    [user],
  )

  const toggleTask = useCallback(
    (taskId: string) => {
      setState((prev) => {
        const task = prev.tasks.find((t) => t.id === taskId)
        if (!task) return prev
        const newCompleted = !task.completed
        fireAndForget(supabase.from('tasks').update({ completed: newCompleted }).eq('id', taskId))
        return { ...prev, tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, completed: newCompleted } : t)) }
      })
    },
    [],
  )

  const deleteTask = useCallback(
    (taskId: string) => {
      setState((prev) => ({ ...prev, tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, isArchived: true } : t)) }))
      fireAndForget(supabase.from('tasks').update({ is_archived: true }).eq('id', taskId))
    },
    [],
  )

  const restoreTask = useCallback(
    (taskId: string) => {
      setState((prev) => ({ ...prev, tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, isArchived: false } : t)) }))
      fireAndForget(supabase.from('tasks').update({ is_archived: false }).eq('id', taskId))
    },
    [],
  )

  const permanentDeleteTask = useCallback(
    (taskId: string) => {
      setState((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== taskId) }))
      fireAndForget(supabase.from('tasks').delete().eq('id', taskId))
    },
    [],
  )

  const assignInboxTask = useCallback(
    (taskId: string, date: string, categoryId: string) => {
      setState((prev) => ({ ...prev, tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, date, categoryId, isInbox: false } : t)) }))
      fireAndForget(supabase.from('tasks').update({ date, category_id: categoryId, is_inbox: false }).eq('id', taskId))
    },
    [],
  )

  const updateTask = useCallback(
    (taskId: string, updates: { title?: string; categoryId?: string }) => {
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
      }))
      const dbUpdates: Record<string, unknown> = {}
      if (updates.title !== undefined) dbUpdates.title = updates.title
      if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId || null
      fireAndForget(supabase.from('tasks').update(dbUpdates).eq('id', taskId))
    },
    [],
  )

  // Derived data — memoized to avoid recalculation on unrelated state changes
  const inboxTasks = useMemo(() => state.tasks.filter((t) => t.isInbox && !t.isArchived), [state.tasks])
  const archivedTasks = useMemo(() => state.tasks.filter((t) => t.isArchived), [state.tasks])

  const getTasksForDate = useCallback(
    (date: string, filter?: { baseType?: BaseType; categoryId?: string }): Task[] => {
      return state.tasks.filter((t) => {
        if (t.isArchived || t.isInbox || t.date !== date) return false
        if (!filter) return true
        if (filter.categoryId) return t.categoryId === filter.categoryId
        if (filter.baseType) {
          const cat = state.categories.find((c) => c.id === t.categoryId)
          return cat?.baseType === filter.baseType
        }
        return true
      })
    },
    [state.tasks, state.categories],
  )

  const getInboxTasks = useCallback((): Task[] => inboxTasks, [inboxTasks])
  const getArchivedTasks = useCallback((): Task[] => archivedTasks, [archivedTasks])

  const setActiveMode = useCallback(
    (mode: BaseType) => { setState((prev) => ({ ...prev, activeMode: mode })) },
    [],
  )

  const updateSettings = useCallback(
    (partial: Partial<UserSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...partial }
        fireAndForget(
          supabase.from('user_settings').upsert(
            { user_id: user!.id, evening_start_hour: next.eveningStartHour, morning_end_hour: next.morningEndHour },
            { onConflict: 'user_id' },
          ),
        )
        return next
      })
    },
    [user],
  )

  const deleteCategory = useCallback(
    (categoryId: string) => {
      setState((prev) => ({ ...prev, categories: prev.categories.filter((c) => c.id !== categoryId) }))
      fireAndForget(supabase.from('categories').delete().eq('id', categoryId))
    },
    [],
  )

  return {
    state,
    loaded,
    settings,
    updateSettings,
    addCategory,
    deleteCategory,
    setDay,
    markBriefingSeen,
    getDay,
    getCategory,
    addTask,
    addInboxTask,
    toggleTask,
    deleteTask,
    updateTask,
    restoreTask,
    permanentDeleteTask,
    assignInboxTask,
    getTasksForDate,
    getInboxTasks,
    getArchivedTasks,
    setActiveMode,
  }
}
