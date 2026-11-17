'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Desk } from '../../lib/mygo'
import { readableError } from '../../lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

const options = [
  { value: 'system', label: '跟随系统', icon: Monitor },
  { value: 'light', label: '浅色', icon: Sun },
  { value: 'dark', label: '暗色', icon: Moon },
]

export function AppearancePicker({ loaded, onError }: {
  loaded: boolean
  onError: (message: string) => void
}) {
  const [mode, setMode] = useState<string>()
  const [saving, setSaving] = useState(false)
  const selected = options.find(option => option.value === mode) ?? options[0]
  const Icon = selected.icon

  useEffect(() => {
    if (!loaded) return
    let ignore = false
    void Desk.appearance().then(value => {
      if (!ignore) setMode(value)
    }).catch(error => {
      if (!ignore) onError(`无法读取外观偏好：${readableError(error)}`)
    })
    return () => { ignore = true }
  }, [loaded, onError])

  async function changeMode(value: string): Promise<void> {
    if (!mode || saving || value === mode) return
    setSaving(true)
    onError('')
    try {
      await Desk.setAppearance(value)
      setMode(value)
    } catch (error) {
      onError(`无法保存外观偏好：${readableError(error)}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Select value={selected.value} disabled={!mode} onValueChange={value => void changeMode(value)}>
      <SelectTrigger size="sm" aria-label={`外观，${selected.label}`} aria-busy={saving} title="外观"
        className="gap-1.5 px-2">
        <SelectValue>
          <Icon aria-hidden="true" />
          <span className="max-[640px]:sr-only">{selected.label}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end" position="popper">
        {options.map(({ value, label, icon: OptionIcon }) => (
          <SelectItem key={value} value={value} disabled={saving} textValue={label}>
            <OptionIcon aria-hidden="true" />{label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
