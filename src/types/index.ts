export type BaseType = 'work' | 'rest'
export type AppModule = 'tracker' | 'finance'

export interface Category {
  id: string
  name: string
  baseType: BaseType
}

export interface Task {
  id: string
  title: string
  categoryId: string
  date: string // ISO date YYYY-MM-DD
  completed: boolean
  createdAt: string
  isInbox: boolean
  isArchived: boolean
}

export interface Day {
  date: string // ISO date YYYY-MM-DD
  categoryId: string
  reflectionDone: boolean
  briefingSeen: boolean
}

export interface UserSettings {
  eveningStartHour: number  // 0-23, default 20
  morningEndHour: number    // 0-23, default 7
}

export interface AppState {
  categories: Category[]
  tasks: Task[]
  days: Day[]
  activeMode: BaseType
}
