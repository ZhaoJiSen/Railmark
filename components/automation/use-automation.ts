import { Channel } from 'mygo-runtime'
import { useEffect, useRef, useState } from 'react'
import { readableError } from '../../lib/utils'

export function useAutomationRun() {
  const active = useRef<Channel<string> | null>(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => () => { active.current?.close(); active.current = null }, [])

  async function run<T>(start: (channel: Channel<string>) => Promise<T>, initial: string): Promise<T | undefined> {
    if (active.current) return
    setError('')
    setNotice('')
    let channel: Channel<string> | undefined
    try {
      channel = new Channel<string>(value => { if (active.current === channel) setStatus(value) })
      active.current = channel
      setStatus(initial)
      const result = await start(channel)
      if (active.current === channel) return result
    } catch (error) {
      if (!channel || active.current === channel) setError(readableError(error))
    } finally {
      if (active.current === channel) {
        active.current = null
        channel?.close()
        setStatus('')
      }
    }
  }

  function cancel(): void {
    const channel = active.current
    active.current = null
    channel?.close()
    setStatus('')
    if (channel) setNotice('任务已停止')
  }

  function clearFeedback(): void {
    setError('')
    setNotice('')
  }

  return { status, error, notice, clearFeedback, run, cancel }
}
