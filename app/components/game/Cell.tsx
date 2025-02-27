import config from '../../config.json'

const Cell = ({ children, onClick }) => {
  const size = Math.floor(config.GRID_WIDTH / config.CELL_COUNT)
  return (
    <div
      onClick={onClick}
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

export default Cell
