import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  screen: 'LANDING',
  data: {}
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
    }
  }
})

export const { setGameData, updateScreen } = gameSlice.actions
export default gameSlice.reducer
