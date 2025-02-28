export type GameData = {
  screen: GameScreen
  data: Game
  error: GameError
}

export type Game = {
  id: string
  code?: string // 6 digit code, treated as string; should be removed once status is no longer 'Lobby'
  rowSize: number
  colSize: number
  status: GameStatus
  playerIds: string[] // host player ID is always the 0th item
  hostPlayerId: string
  winnerPlayerId: string
  createdAt: number // timestamp
  turns: Turn[]
}

export enum GameScreen {
  Landing = 'LANDING',
  Lobby = 'LOBBY',
  JoinGame = 'JOIN_GAME',
  Game = 'GAME'
}

export enum GameStatus {
  Lobby = 'LOBBY',
  Ongoing = 'ONGOING',
  Completed = 'COMPLETED',
  Stalemate = 'STALEMATE' // all cells filled without any winner
}

export type Turn = {
  playerId: string
  cell: Cell
}

export type Cell = {
  rowId: number
  colId: number
}

export type GameError = {
  type: string
  msg: string
}

export enum CellStatus {
  Empty = 'EMPTY', // unoccupied
  Self = 'SELF', // occupied by current player
  Opponent = 'OPPONENT' // occupied by opponent player
}