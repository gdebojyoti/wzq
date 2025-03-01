import { createSlice } from '@reduxjs/toolkit'

import { GameData, GameScreen, GameStatus } from '../../types/entities'

const initialState: GameData = {
  screen: GameScreen.Landing,
  data: {
    id: '',
    code: '',
    rowSize: 16,
    colSize: 16,
    status: null,
    playerIds: [],
    hostPlayerId: '',
    winnerPlayerId: '',
    createdAt: 0,
    turns: []
  },
  error: {
    type: '',
    msg: ''
  }
}

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setGameData: (initialState, action) => {
      initialState.data = action.payload
    },
    updateScreen: (initialState, action) => {
      initialState.screen = action.payload
    },
    addTurn: (initialState, action) => {
      initialState.data.turns = [...initialState.data.turns, action.payload]
    },
    setError: (initialState, action) => {
      initialState.error = action.payload
    },
    gameOver: (initialState, action) => {
      initialState.data.status = GameStatus.Completed
      initialState.data.winnerPlayerId = action.payload.winnerPlayerId
    },
    resetGame: (initialState) => {
      initialState.data = {
        id: '',
        code: '',
        rowSize: 16,
        colSize: 16,
        status: null,
        playerIds: [],
        hostPlayerId: '',
        winnerPlayerId: '',
        createdAt: 0,
        turns: []
      }
    }
  }
})

export const { setGameData, updateScreen, addTurn, setError, gameOver, resetGame } = gameSlice.actions
export default gameSlice.reducer
