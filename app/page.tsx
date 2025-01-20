import React from 'react'

import Landing from './components/screens/Landing'
import Lobby from './components/screens/Lobby'
import Join from './components/screens/Join'

const Page = () => {
  const screen: string = 'JOIN_GAME'

  let ScreenComponent = null

  switch (screen) {
    case 'LANDING':
      ScreenComponent = Landing
      break
    case 'LOBBY':
      ScreenComponent = Lobby
      break
    case 'JOIN_GAME':
      ScreenComponent = Join
      break
  }
  
  return <main className='h-screen bg-[#222] text-white'>
    <div className='w-full max-w-md h-full mx-auto bg-[#333]'>
      <ScreenComponent />
    </div>
  </main>
}

export default Page