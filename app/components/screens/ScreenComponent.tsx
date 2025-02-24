import React from 'react'
import { useSelector } from 'react-redux'

import Landing from './Landing'
import Lobby from './Lobby'
import Join from './Join'
import Game from './Game'

const ScreenComponent = () => {
  // @ts-expect-error TODO: replace standardjs with eslint
  const screen = useSelector(state => state.game.screen)

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

  return (
    <Component />
  )
}

export default ScreenComponent
