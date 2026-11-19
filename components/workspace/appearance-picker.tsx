'use client'

import { Dropdown } from '@heroui/react/dropdown'
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Desk } from '../../lib/mygo'
import { readableError } from '../../lib/utils'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent } from '../ui/tooltip'

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
  const label = `外观，${selected.label}`

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
    <Dropdown>
      <Tooltip>
        <Button type="button" variant="ghost" size="icon-sm" disabled={!mode} aria-label={label} aria-busy={saving}>
          <Icon aria-hidden="true" />
        </Button>
        <TooltipContent side="bottom">{label}</TooltipContent>
      </Tooltip>
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu aria-label="外观" selectionMode="single" selectedKeys={[selected.value]}
          onAction={key => void changeMode(String(key))}>
          {options.map(({ value, label }) => (
            <Dropdown.Item key={value} id={value} isDisabled={saving} textValue={label}>
              {label}
              <Dropdown.ItemIndicator>
                {({ isSelected }) => isSelected ? <Check aria-hidden="true" className="size-3.5" /> : null}
              </Dropdown.ItemIndicator>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}
