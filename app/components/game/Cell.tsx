import config from '../../config.json'
import { CellStatus } from '../../types/entities'

const Cell = ({ children, cellStatus, onClick }: CellType) => {
  const size = Math.floor(config.GRID_WIDTH / config.CELL_COUNT)

  let decorator = null
  switch (cellStatus) {
    case CellStatus.Self: {
      decorator = 'X'
      break
    }
    case CellStatus.Opponent: {
      decorator = 'O'
      break
    }
  }

  return (
    <div
      onClick={onClick}
      className='flex justify-center items-center text-[8px] text-[#777] border-[.5px] border-[#5F5F5F] cursor-pointer hover:bg-[#6f6f6f] transition-colors'
      style={{
        width: `${size}px`,
        height: `${size}px`
      }}
    >
      {decorator}
      {children}
    </div>
  )
}

type CellType = {
  children?: React.ReactNode
  cellStatus: CellStatus
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void
}

export default Cell
