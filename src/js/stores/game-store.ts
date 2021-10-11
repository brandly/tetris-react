import {
  GameBoard,
  PositionedPiece,
  Piece,
  buildGameBoard,
  addPieceToBoard,
  isEmptyPosition,
  flipClockwise,
  flipCounterclockwise,
  moveDown,
  moveLeft,
  moveRight,
  setPiece,
  hardDrop
} from './board-store';
import AppConstants from '../constants/app-constants';
import * as PieceQueue from '../modules/piece-queue';

type State = 'PAUSED' | 'PLAYING' | 'LOST';

export type Game = {
  state: State;
  board: GameBoard;
  piece: PositionedPiece;
  heldPiece: Piece | undefined;
  queue: PieceQueue.PieceQueue;
  points: number;
  lines: number;
};

type Action =
  | 'PAUSE'
  | 'RESUME'
  | 'TICK'
  | 'HOLD'
  | 'MOVE_DOWN'
  | 'MOVE_LEFT'
  | 'MOVE_RIGHT'
  | 'FLIP_CLOCKWISE'
  | 'FLIP_COUNTERCLOCKWISE';

export const update = (game: Game, action: Action): Game => {
  switch (action) {
    case 'PAUSE': {
      return game.state === 'PLAYING' ? { ...game, state: 'PAUSED' } : game;
    }
    case 'RESUME': {
      return game.state === 'PAUSED' ? { ...game, state: 'PLAYING' } : game;
    }
    // case 'HARD_DROP': {
    //   return applyMove(hardDrop, game);
    // }
    case 'TICK':
    case 'MOVE_DOWN': {
      const updated = applyMove(moveDown, game);
      if (game.piece && game.piece === updated.piece) {
        const [board, linesCleared] = setPiece(game.board, game.piece);
        const next = PieceQueue.getNext(game.queue);
        return {
          ...updated,
          board,
          piece: initializePiece(next.piece),
          queue: next.queue,
          lines: game.lines + linesCleared
        };
      } else {
        return updated;
      }
    }
    case 'MOVE_LEFT': {
      return applyMove(moveLeft, game);
    }
    case 'MOVE_RIGHT': {
      return applyMove(moveRight, game);
    }
    case 'FLIP_CLOCKWISE': {
      return applyMove(flipClockwise, game);
    }
    case 'FLIP_COUNTERCLOCKWISE': {
      return applyMove(flipCounterclockwise, game);
    }
    case 'HOLD': {
      // TODO:
      // if (_hasHeldPiece) return game;
      if (!game.piece) return game;

      // Ensure the held piece will fit on the board
      if (
        game.heldPiece &&
        // game.piece &&
        !isEmptyPosition(game.board, { ...game.piece, piece: game.heldPiece })
      ) {
        return game;
      }

      const next = PieceQueue.getNext(game.queue);
      const newPiece = game.heldPiece ?? next.piece;

      return {
        ...game,
        heldPiece: game.piece.piece, // hmm
        piece: { ...game.piece, piece: newPiece },
        queue: newPiece === next.piece ? next.queue : game.queue
      };
    }
  }
};

const initialPosition = {
  x: AppConstants.GAME_WIDTH / 2 - AppConstants.BLOCK_WIDTH / 2,
  y: 0
};

const initializePiece = (piece: Piece): PositionedPiece => {
  return {
    position: initialPosition,
    piece,
    rotation: 0
  };
};

const applyMove = (
  move: (
    board: GameBoard,
    piece: PositionedPiece
  ) => PositionedPiece | undefined,
  game: Game
): Game => {
  const afterFlip = game.piece ? move(game.board, game.piece) : game.piece;
  return afterFlip ? { ...game, piece: afterFlip } : game;
};

export const getInitialGame = (): Game => {
  const queue = PieceQueue.create(5);
  const next = PieceQueue.getNext(queue);
  return {
    state: 'PLAYING',
    points: 0,
    lines: 0,
    board: buildGameBoard(),
    piece: initializePiece(next.piece),
    heldPiece: undefined,
    queue: next.queue
  };
};

// Good display of merging piece + board
export function viewGameBoard(game: Game): GameBoard {
  if (game.state === 'LOST') {
    return game.board;
  }

  let gameBoard = game.board;

  // set the preview
  gameBoard = addPieceToBoard(gameBoard, hardDrop(gameBoard, game.piece), true);

  // set the actual piece
  gameBoard = addPieceToBoard(gameBoard, game.piece);

  return gameBoard;
}
