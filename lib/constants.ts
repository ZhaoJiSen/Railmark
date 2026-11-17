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

export const REQUIREMENT_CATEGORIES = [
  { value: 'business', label: '业务需求' },
  { value: 'technical', label: '技术项目' },
  { value: 'uncategorized', label: '未分类' },
] as const

export function requirementCategoryLabel(category: string) {
  return REQUIREMENT_CATEGORIES.find(option => option.value === category)?.label ?? '未分类'
}
