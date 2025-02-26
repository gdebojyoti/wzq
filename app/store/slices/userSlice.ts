import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  id: ''
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserId: (initialState, action) => {
      initialState.id = action.payload
    }
  }
})

export const { setUserId } = userSlice.actions
export default userSlice.reducer
