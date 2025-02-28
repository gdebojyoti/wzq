import { useSelector } from 'react-redux'

import Button from '../common/Button'

const GameOver = () => {
  // @ts-expect-error TODO: replace standardjs with eslint
  const playerId = useSelector(state => state.user.id)
  // @ts-expect-error TODO: replace standardjs with eslint
  const winnerPlayerId = useSelector(state => state.game.data.winnerPlayerId)

  const didWin = playerId === winnerPlayerId

  const emoji = didWin ? '🍻' : '😿'
  const h2 = didWin ? 'Congratulations!' : 'Tough luck!'
  const h3 = <>You have <strong>{didWin ? 'won' : 'lost'}</strong></>

  const goHome = () => {}

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
