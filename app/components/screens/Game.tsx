import { useSelector } from 'react-redux'

import Heading from '../common/Heading'
import BackButton from '../common/BackButton'
import Grid from '../game/Grid'
import Users from '../game/Users'
import GameOver from '../game/GameOver'
import { GameStatus } from '../../types/entities'

const Game = () => {
  // @ts-expect-error TODO: replace standardjs with eslint
  const status = useSelector(state => state.game.data.status)

  return (
    <div className='h-full flex flex-col justify-around items-center relative'>
      <Heading>It&apos;s <strong>your</strong> turn</Heading>

      <BackButton />

      <Grid />

      <Users />

      {status === GameStatus.Completed && <GameOver />}
    </div>
  )
}

export default Game
