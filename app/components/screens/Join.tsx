import { useState } from 'react'
import { useSelector } from 'react-redux'

import Heading from '../common/Heading'
import BackButton from '../common/BackButton'
import Button from '../common/Button'
import { useSocket } from '../../contexts/SocketContext'

const Join = () => {
  const [text, setText] = useState('')
  const socket = useSocket()

  // @ts-expect-error TODO: replace standardjs with eslint
  const { type: errorType, msg: errorMsg } = useSelector(state => state.game.error)

  const onJoin = () => {
    socket.emit('JOIN_GAME', {
      gameCode: text
    })
  }

  const changeInput = e => {
    setText(e.target.value)
  }

  return (
    <div className='h-full flex flex-col justify-around items-center relative'>
      <Heading>Join Game</Heading>

      <BackButton />

      <div className='w-full flex flex-col items-center relative'>
        <div>Enter game code</div>
        <input type='text' placeholder='932110' onChange={changeInput} className='w-[200px] mt-5 border-b text-6xl text-center outline-none placeholder:opacity-30' />
        {errorType === 'JOIN_GAME' && errorMsg && (
          <div className='absolute top-full mt-5 text-center text-[#D93D3D]'>{errorMsg}</div>
        )}
      </div>

      <Button type='primary' onClick={onJoin}>Join Game</Button>
    </div>
  )
}

export default Join
