import Logo from "../common/Logo"
import Button from "../common/Button"

const Landing = ({ setScreen }) => {
  const hostGame = () => {
    setScreen('LOBBY')
  }

  const joinGame = () => {
    setScreen('JOIN_GAME')
  }

  return (
    <div className="h-full flex flex-col justify-around items-center">
      <Logo />

      <div className="flex flex-col items-center">
        <Button type='primary' onClick={hostGame}>Host Game</Button>
        <Button type='secondary' onClick={joinGame} className="mt-5">Join Game</Button>
      </div>

      <div className="p-1 border-b border-dashed">What is Wuziqi?</div>
    </div>
  )
}

export default Landing