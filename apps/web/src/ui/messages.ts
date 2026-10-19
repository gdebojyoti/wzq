import type { RejectionReason } from "@wzq/shared";
import type { ConnectionStatus } from "./useGameServer";

// Every piece of text the web app shows, in one place. Text written in sentence case here may be shown in capitals:
// the screens set that with CSS, so screen readers still read words, not letters.

export const connectionMessages: Record<ConnectionStatus, string> = {
  connecting: "Connecting to server…",
  connected: "Connected to server",
  disconnected: "Not connected to server · retrying",
};

export const rejectionMessages: Record<RejectionReason, string> = {
  alreadyInActiveGame: "You're already in a game.",
  gameCodeNotFound: "No game in the lobby has that code. Check it with your friend.",
  gameNotFound: "That game no longer exists.",
  gameNotOngoing: "The game isn't being played.",
  notYourTurn: "It's not your turn.",
  cellOffBoard: "That's not on the board.",
  cellOccupied: "There's already a stone there.",
};

export const commonMessages = {
  wordmark: "WZQ",
  leaveGame: "Leave game",
};

export const startMessages = {
  gameGone: "That game no longer exists. Start a new one, or join a friend's.",
  tagline: "Five in a row, played between friends. No sign-up.",
  sticker: "5 in a row",
  startGame: "Start a game",
  gameCodeLabel: "Got a code? Join in",
  gameCodePlaceholder: "000000",
  joinGame: "Join",
};

export const lobbyMessages = {
  gameCodeHeading: "Your game code",
  shareHint: "Send this code to your friend. The game starts the moment they join.",
  copyCode: "Copy code",
  copied: "Copied",
  waiting: "Waiting for your friend",
  waitingForScreenReaders: "Waiting for your friend to join",
};

export const gameMessages = {
  you: "You",
  opponent: "Opponent",
  versus: "VS",
  hostRole: "Host · plays first",
  joinerRole: "Joined · plays second",
  opponentOnline: "Online",
  opponentDisconnected: "Disconnected",
  // Shown before the opponent's connection status when the opponent is the Host.
  hostPrefix: "Host · ",
  opponentDisconnectedNotice:
    "Your opponent is disconnected. The game will wait for them to rejoin, with no time limit.",
  headlines: {
    yourTurn: "Your turn",
    theirTurn: "Their turn",
    won: "You won!",
    lost: "You lost",
    draw: "Draw",
    abandoned: "Game abandoned",
  },
  hints: {
    yourTurn: "Tap any empty cell to place your stone.",
    theirTurn: "Waiting for your opponent to play.",
    hostPlaysFirst: "The host places the first stone.",
    // Keep this to one line: it fills the hint's place once the Game has ended, so the Board doesn't move.
    gameOver: "Game over.",
  },
  results: {
    won: "Five in a row. The winning line is marked in pink.",
    lost: "Your opponent got five in a row. Their line is marked in blue.",
    draw: "The board is full and nobody got five in a row.",
    youLeft: "You left the game. There is no winner.",
    opponentLeft: "Your opponent left the game. There is no winner.",
  },
  backToStart: "Back to Home",
};

export const boardMessages = {
  board: "Board",
  cell: (row: number, column: number) => `Row ${row}, column ${column}`,
  yourStone: "your stone",
  opponentStone: "your opponent's stone",
  mostRecent: "the most recent",
  inWinningLine: "in the winning line",
};
