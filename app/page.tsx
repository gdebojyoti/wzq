import React from 'react'

import ScreenComponent from './components/screens/ScreenComponent'
import SocketClient from './components/SocketClient'

const Page = () => {
  
  return <main className='h-screen bg-[#222] text-white'>
    <div className='w-full max-w-md h-full mx-auto bg-[#333]'>
      <ScreenComponent />
      <SocketClient />
    </div>
  </main>
}

export default Page