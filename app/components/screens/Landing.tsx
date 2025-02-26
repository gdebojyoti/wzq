import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import Logo from '../common/Logo'
import Button from '../common/Button'
import { useSocket } from '../../contexts/SocketContext'
import { updateScreen } from '../../store/slices/gameSlice'

import { checkForOngoingGames } from './actions'

const Landing = () => {
  // @ts-expect-error TODO: replace standardjs with eslint
  const playerId = useSelector(state => state.user.id)

  const socket = useSocket()
  const dispatch = useDispatch()

  // check if game code already exists; if so, trigger Lobby
  useEffect(() => {
    // exit if required entities are missing
    if (!socket || !playerId) {
      return
    }

    const previousGameId = checkForOngoingGames()
    if (previousGameId) {
      socket.emit('SYNC_CLIENT', {
        playerId,
        gameId: previousGameId
      })
    }
  }, [playerId, socket])

  const hostGame = () => {
    if (!playerId) {
      console.error('User ID not found')
      return
    }

    socket.emit('HOST_GAME', {
      playerId
    })
  }

  const joinGame = () => {
    dispatch(updateScreen('JOIN_GAME'))
  }

  return (
    <div className='h-full flex flex-col justify-around items-center'>
      <Logo />

      <div className='flex flex-col items-center'>
        <Button type='primary' onClick={hostGame}>Host Game</Button>
        <Button type='secondary' onClick={joinGame} className='mt-5'>Join Game</Button>
      </div>

      <div className='p-1 border-b border-dashed'>What is Wuziqi?</div>
    </div>
  )
}

export default Landing
