import Heading from "../common/Heading"
import BackButton from "../common/BackButton"
import Button from "../common/Button"

const Join = () => {
  const onJoin = () => {}

  return (
    <div className="h-full flex flex-col justify-around items-center relative">
      <Heading>Join Game</Heading>

      <BackButton />

      <div className="w-full flex flex-col items-center relative">
        <div>Enter game code</div>
        <input type='text' placeholder="932110" className="w-[200px] mt-5 border-b text-6xl text-center outline-none placeholder:opacity-30" />
        <div className="absolute top-full mt-5 text-center text-[#D93D3D]">Incorrect code. Please try again</div>
      </div>

      <Button type='primary' onClick={onJoin}>Join Game</Button>
    </div>
  )
}

export default Join