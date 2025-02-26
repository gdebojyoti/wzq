const CELL_COUNT = 16
const GRID_WIDTH = 380

const Grid = () => {
  return (
    <div className='border-[.5px] border-[#5F5F5F]'>
      {(new Array(CELL_COUNT).fill('').map((_, i) => <Row key={i} index={i} />))}
    </div>
  )
}

const Row = ({ index }) => {
  return (
    <div className='flex'>
      {(new Array(CELL_COUNT).fill('').map((_, i) => <Cell key={i}>{index * CELL_COUNT + i + 1}</Cell>))}
    </div>
  )
}

const Cell = ({ children }) => {
  const size = Math.floor(GRID_WIDTH / CELL_COUNT)
  return (
    <div
      className='flex justify-center items-center text-[8px] text-[#777] border-[.5px] border-[#5F5F5F] cursor-pointer hover:bg-[#6f6f6f] transition-colors'
      style={{
        width: `${size}px`,
        height: `${size}px`
      }}
    >
      {children}
    </div>
  )
}

export default Grid
