import config from '../../config.json'

export function checkForOngoingGames () {
  let previousGameData = null

  // get previous game data from local storage
  try {
    const gameDetailsString = window.localStorage.getItem(config.GAME_DETAILS_KEY)
    if (gameDetailsString) {
      previousGameData = JSON.parse(gameDetailsString)
    }
  } catch (e) {
    console.log(e)
    window.localStorage.removeItem(config.GAME_DETAILS_KEY)
  }

  // if previous game data is missing, exit
  if (!previousGameData) {
    return
  }

  // if previous game data is invalid, exit
  if (typeof previousGameData !== 'object') {
    return
  }

  console.log('still here', previousGameData)

  const {
    id
  } = previousGameData

  return id
}

export function saveGameInfoLocally (id) {
  const gameDetails = {
    id
  }
  window.localStorage.setItem(config.GAME_DETAILS_KEY, JSON.stringify(gameDetails))
}
