import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

import { useSocket } from '../../contexts/SocketContext'
import config from '../../config.json'

import Cell from './Cell'
import { CellStatus } from '../../types/entities'

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
      {(new Array(config.CELL_COUNT).fill('').map((_, rowIndex) => {
        return (
          <div key={rowIndex} className='flex'>
            {(new Array(config.CELL_COUNT).fill('').map((_, colIndex) => {
              const cellStatus = getCellStatus(turns, rowIndex, colIndex, playerId)
              return (
                <Cell key={colIndex} cellStatus={cellStatus} onClick={() => takeTurn(rowIndex, colIndex)}>
                  {/* {rowIndex} : {rowIndex * config.CELL_COUNT + colIndex + 1} */}
                </Cell>
              )
            }))}
          </div>
        )
      }))}
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

function getCellStatus (turns, rowIndex, colIndex, currentPlayerId) {
  const cell = turns.find(({ cell: { rowId, colId } }) => (rowId === rowIndex && colId === colIndex))
  if (!cell) {
    return CellStatus.Empty
  }

  const { playerId } = cell
  return playerId === currentPlayerId ? CellStatus.Self : CellStatus.Opponent
}

export default Grid
