import { useSelector } from 'react-redux'

import Heading from '../common/Heading'
import BackButton from '../common/BackButton'
import Button from '../common/Button'

const Lobby = () => {
  // @ts-expect-error TODO: replace standardjs with eslint
  const code = useSelector(state => state.game.data.code)

  const onShare = () => {}

  return (
    <div className='h-full flex flex-col justify-around items-center relative'>
      <Heading>Lobby</Heading>

      <BackButton />

      <div className='flex flex-col items-center'>
        <div>Your game code is</div>
        <div className='mt-5 text-6xl'>{code}</div>
      </div>

      <div className='flex flex-col items-center'>
        <Button type='secondary' onClick={onShare}>Share Code</Button>
        <div className='mt-5'>Waiting for opponent...</div>
      </div>
    </div>
  )
}

export default Lobby
