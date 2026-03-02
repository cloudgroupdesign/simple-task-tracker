import type { BaseType } from '../types'

const labels = {
  work: {
    taskSingular: 'задача',
    taskPlural: 'задачі',
    taskGenitivePlural: 'задач',
    newQuestion: "З'явились нові задачі?",
    briefingSubtitle: 'Сьогодні робочий день. Твої задачі:',
    addPlaceholder: 'Нова задача...',
  },
  rest: {
    taskSingular: 'справа',
    taskPlural: 'справи',
    taskGenitivePlural: 'справ',
    newQuestion: "З'явились нові справи?",
    briefingSubtitle: 'Сьогодні день відпочинку. Твої справи:',
    addPlaceholder: 'Нова справа...',
  },
} as const

export function getLabels(baseType: BaseType) {
  return labels[baseType]
}
