import React from 'react'
import { useSelector } from 'react-redux'

import { GameScreen } from '../../types/entities'
import Landing from './Landing'
import Lobby from './Lobby'
import Join from './Join'
import Game from './Game'

const ScreenComponent = () => {
  // @ts-expect-error TODO: replace standardjs with eslint
  const screen = useSelector(state => state.game.screen)

  let Component = () => null

  switch (screen) {
    case GameScreen.Landing:
      Component = Landing
      break
    case GameScreen.Lobby:
      Component = Lobby
      break
    case GameScreen.JoinGame:
      Component = Join
      break
    case GameScreen.Game:
      Component = Game
      break
  }

  return (
    <Component />
  )
}

export default ScreenComponent
