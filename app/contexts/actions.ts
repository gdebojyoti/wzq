import { setUserId } from '../store/slices/userSlice'

const USER_ID_KEY = 'userId'

// TODO: generate user ID from BE
export function checkAndSetUserId (dispatch) {
  try {
    let userId = window.localStorage.getItem(USER_ID_KEY)

    if (!userId) {
      const queryParam = window.location.search.substring(1).split('&').map(pair => pair.split('=')).find(([key]) => key === 'playerId')
      userId = queryParam && queryParam.length ? queryParam[1] : new Date().getTime().toString()
      window.localStorage.setItem(USER_ID_KEY, userId)
    }

    dispatch(setUserId(userId))
  } catch (e) {
    console.warn(e)
  }
}
