import config from '../../config.json'
import { CellStatus } from '../../types/entities'

// import sun from '../../../assets/sun.png'
// import moon from '../../../assets/moon.png'
import mars from '../../../assets/mars.png'
import neptune from '../../../assets/neptune.png'

const Cell = ({ children, cellStatus, onClick }: CellType) => {
  const size = Math.floor(config.GRID_WIDTH / config.CELL_COUNT)

  let decorator = null
  const imgClass = 'w-[75%] h-[75%] object-contain'
  switch (cellStatus) {
    case CellStatus.Self: {
      decorator = <img src={mars.src} className={imgClass} />
      break
    }
    case CellStatus.Opponent: {
      decorator = <img src={neptune.src} className={imgClass} />
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
