export const enum PuzzleKnotType {
    ENTRY = 0,
    SINGLE = 1,
    REGROW = 2,
    TOGGLE = 3
}

export const enum PuzzleKnotState {
    ENABLED = 0,
    CLOSED = -1,
    OPENED = 1
}

export const enum PuzzleKnotAnimation {
    OPEN = 'open',
    OPENED = 'opened',
    CLOSE = 'close',
    ENABLE = 'enable',
    ENABLED = 'enabled',
    HIGHLIGHT = 'highlight'
}