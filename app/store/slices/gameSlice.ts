import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  screen: 'LANDING',
  data: {},
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
    setError: (initialState, action) => {
      initialState.error = action.payload
    }
  }
})

export const { setGameData, updateScreen, setError } = gameSlice.actions
export default gameSlice.reducer
