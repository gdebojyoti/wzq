import React from 'react'

import Landing from './components/screens/Landing'
import Lobby from './components/screens/Lobby'
import JoinGame from './components/screens/JoinGame'

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
      ScreenComponent = JoinGame
      break
  }
  
  return <main className='h-screen bg-gray-900 text-gray-50'>
    <div className='w-full max-w-md h-full mx-auto bg-gray-800'>
      <ScreenComponent />
    </div>
  </main>
}

export default Page