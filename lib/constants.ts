export const GROUPS = [
  { id: 'frontend', label: '前端' },
  { id: 'backend', label: '后端' },
] as const

export const STATES = [
  { id: 'todo', label: '待开始' },
  { id: 'in_progress', label: '开发中' },
  { id: 'testing', label: '待联调' },
  { id: 'done', label: '已完成' },
] as const
