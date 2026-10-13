import { ServerStatus } from './ServerStatus'

export default function HomePage () {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-4 p-8'>
      <h1 className='text-4xl font-bold tracking-tight'>WZQ</h1>
      <ServerStatus />
    </main>
  )
}
