import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

import { useSocket } from '../../contexts/SocketContext'

const CELL_COUNT = 16
const GRID_WIDTH = 380

const Grid = () => {
  // @ts-expect-error TODO: replace standardjs with eslint
  const playerId = useSelector(state => state.user.id)
  // @ts-expect-error TODO: replace standardjs with eslint
  const { id, hostPlayerId, turns } = useSelector(state => state.game.data)

  const socket = useSocket()

  const [turnsLocal, setTurnsLocal] = useState([])

  useEffect(() => {
    setTurnsLocal([...turns])
  }, [turns])

  const isPlayersTurn = checkIfPlayersTurn(turnsLocal, playerId, hostPlayerId)

  // when player clicks on a cell
  const takeTurn = (rowId, colId) => {
    if (!isPlayersTurn) {
      return
    }

    const turn = {
      cell: {
        rowId,
        colId
      },
      playerId
    }

    setTurnsLocal([
      ...turnsLocal,
      turn
    ])

    socket.emit('TAKE_TURN', {
      ...turn,
      gameId: id
    })
  }

  return (
    <div className={`border-[.5px] border-[#5F5F5F] ${!isPlayersTurn && 'pointer-events-none'}`}>
      {(new Array(CELL_COUNT).fill('').map((_, rowIndex) => {
        return (
          <div key={rowIndex} className='flex'>
            {(new Array(CELL_COUNT).fill('').map((_, colIndex) => {
              return (
                <Cell key={colIndex} onClick={() => takeTurn(rowIndex, colIndex)}>
                  {rowIndex} : {rowIndex * CELL_COUNT + colIndex + 1}
                </Cell>
              )
            }))}
          </div>
        )
      }))}
    </div>
  )
}

const Cell = ({ children, onClick }) => {
  const size = Math.floor(GRID_WIDTH / CELL_COUNT)
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

function checkIfPlayersTurn (turns, playerId, hostPlayerId) {
  // if no turns have been taken host player takes the first turn
  if (!turns.length) {
    return playerId === hostPlayerId
  }

  // check player id from most recent turn; current turn belongs to the other player
  const mostRecentTurn = turns[turns.length - 1]
  return mostRecentTurn.playerId !== playerId
}

export default Grid
