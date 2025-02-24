'use client'

import React, { useState } from 'react'

import Landing from './Landing'
import Lobby from './Lobby'
import Join from './Join'
import Game from './Game'

const ScreenComponent = () => {
  const [screen, setScreen] = useState('LANDING')
  
  let Component = null

  switch (screen) {
    case 'LANDING':
      Component = Landing
      break
    case 'LOBBY':
      Component = Lobby
      break
    case 'JOIN_GAME':
      Component = Join
      break
    case 'GAME':
      Component = Game
      break
  }
  
  return <Component setScreen={setScreen} />
}

export default ScreenComponent