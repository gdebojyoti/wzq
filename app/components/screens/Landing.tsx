import Logo from '../common/Logo'
import Button from '../common/Button'
import { useSocket } from '../../contexts/SocketContext'

const Landing = ({ setScreen }) => {
  const socket = useSocket()

  const hostGame = () => {
    socket.emit('HOST_GAME', {
      name: 'Deb',
      gridSize: 16
    })
    setScreen('LOBBY')
  }

  const joinGame = () => {
    setScreen('JOIN_GAME')
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
