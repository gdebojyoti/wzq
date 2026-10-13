import { ServerStatus } from './ServerStatus'

import './wzq.css'

// The whole game, as one component: run standalone by bootstrap.tsx, and exposed to a host as `wzq/Wzq`.
export default function Wzq () {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-4 bg-stone-50 p-8 text-stone-900 antialiased'>
      <h1 className='text-4xl font-bold tracking-tight'>WZQ</h1>
      <ServerStatus />
    </main>
  )
}
