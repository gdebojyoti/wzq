import Button from "../Button"

const Landing = () => {
  return (
    <div className="h-full flex flex-col justify-around items-center">
      <h1 className="text-4xl">WZQ</h1>

      <div className="flex flex-col items-center">
        <Button type='primary'>Host Game</Button>
        <Button type='secondary' className="mt-5">Join Game</Button>
      </div>

      <div className="p-1 border-b border-dashed">What is Wuziqi?</div>
    </div>
  )
}

export default Landing