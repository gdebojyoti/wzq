import Heading from "../common/Heading"
import BackButton from "../common/BackButton"
import Grid from "../game/Grid"
import Users from "../game/Users"

const Game = () => {
  return (
    <div className="h-full flex flex-col justify-around items-center relative">
      <Heading>It&apos;s <strong>your</strong> turn</Heading>

      <BackButton />

      <Grid />

      <Users />
    </div>
  )
}

export default Game