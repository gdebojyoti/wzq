import { useDispatch, useSelector } from 'react-redux'

import Button from '../common/Button'
import { resetGame, updateScreen } from '../../store/slices/gameSlice'
import config from '../../config.json'
import { GameScreen } from '../../types/entities'

const GameOver = () => {
  // @ts-expect-error TODO: replace standardjs with eslint
  const playerId = useSelector(state => state.user.id)
  // @ts-expect-error TODO: replace standardjs with eslint
  const winnerPlayerId = useSelector(state => state.game.data.winnerPlayerId)

  const dispatch = useDispatch()

  const didWin = playerId === winnerPlayerId

  const emoji = didWin ? '🍻' : '😿'
  const h2 = didWin ? 'Congratulations!' : 'Tough luck!'
  const h3 = <>You have <strong>{didWin ? 'won' : 'lost'}</strong></>

  const goHome = () => {
    // clear local storage
    window.localStorage.removeItem(config.GAME_DETAILS_KEY)

    // reset game data in redux store
    dispatch(resetGame())

    // set screen to home
    dispatch(updateScreen(GameScreen.Landing))
  }

  return (
    <div className='fixed flex justify-center items-center w-full h-full bg-[#0009]'>
      <div className='absolute flex flex-col items-center w-fit h-fit px-15 py-20 rounded-xl bg-[#222]'>
        <span className='text-6xl'>{emoji}</span>

        <h2 className='mt-10 text-lg'>{h2}</h2>
        <h3 className='mt-2 mb-10'>{h3}</h3>

        <Button type='primary' onClick={goHome}>Back to Home</Button>
      </div>
    </div>
  )
}

export default GameOver
