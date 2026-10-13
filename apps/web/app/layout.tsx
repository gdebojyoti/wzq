import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import './globals.css'

export const metadata: Metadata = {
  title: 'WZQ',
  description: 'Wuziqi (Five in a row), played between friends.'
}

export default function RootLayout ({ children }: { children: ReactNode }) {
  return (
    <html lang='en'>
      <body className='min-h-screen bg-stone-50 text-stone-900 antialiased'>{children}</body>
    </html>
  )
}
