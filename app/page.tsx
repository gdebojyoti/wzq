import React from 'react'

import ScreenComponent from './components/screens/ScreenComponent'
import SocketProvider from './contexts/SocketContext'

const Page = () => {
  return (
    <SocketProvider>
      <main className='h-screen bg-[#222] text-white'>
        <div className='w-full max-w-md h-full mx-auto bg-[#333]'>
          <ScreenComponent />
        </div>
      </main>
    </SocketProvider>
  )
}

export default Page
