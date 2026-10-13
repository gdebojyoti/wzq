import { useEffect, useState } from 'react'

import { connectToServer } from './socket'

type Status = 'connecting' | 'connected' | 'disconnected'

const display: Record<Status, { label: string, dotColour: string }> = {
  connecting: { label: 'Connecting to the server…', dotColour: 'bg-amber-400' },
  connected: { label: 'Connected to the server', dotColour: 'bg-emerald-500' },
  disconnected: { label: 'Not connected to the server', dotColour: 'bg-rose-500' }
}

export function ServerStatus () {
  const [status, setStatus] = useState<Status>('connecting')

  useEffect(() => {
    const socket = connectToServer()
    socket.on('connect', () => {
      socket.emit('ping', () => setStatus('connected'))
    })
    socket.on('disconnect', () => setStatus('disconnected'))
    socket.on('connect_error', () => setStatus('disconnected'))
    return () => {
      socket.disconnect()
    }
  }, [])

  return (
    <p className='flex items-center gap-2 text-sm text-stone-600' role='status'>
      <span className={`size-2.5 rounded-full ${display[status].dotColour}`} aria-hidden />
      {display[status].label}
    </p>
  )
}
