import { GameScreen, GameStatus } from '../types/entities'

export default function getScreenFromStatus (status: GameStatus) {
  switch (status) {
    case (GameStatus.Lobby): {
      return GameScreen.Lobby
    }
    case (GameStatus.Ongoing): {
      return GameScreen.Game
    }
    // case (GameStatus.Stalemate):
    case (GameStatus.Completed): {
      return GameScreen.Game
    }
    default: {
      return GameScreen.Landing
    }
  }
}
