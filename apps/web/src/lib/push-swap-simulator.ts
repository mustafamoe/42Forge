export type PushSwapSimulation = {
  ok: boolean
  message: string
  moves: number
}

function isSorted(values: Array<number>) {
  for (let index = 1; index < values.length; index += 1) {
    if (values[index - 1] > values[index]) return false
  }
  return true
}

function parseInput(input: string) {
  const tokens = input.trim() ? input.trim().split(/\s+/) : []
  const values: Array<number> = []
  const seen = new Set<number>()

  for (const token of tokens) {
    if (!/^[+-]?\d+$/.test(token)) throw new Error(`Invalid number: ${token}`)
    const value = Number(token)
    if (!Number.isInteger(value) || value < -2147483648 || value > 2147483647) {
      throw new Error(`Out of int range: ${token}`)
    }
    if (seen.has(value)) throw new Error(`Duplicate number: ${token}`)
    seen.add(value)
    values.push(value)
  }

  return values
}

function swap(values: Array<number>) {
  if (values.length < 2) return
  const first = values[0]
  values[0] = values[1]
  values[1] = first
}

function push(from: Array<number>, to: Array<number>) {
  if (!from.length) return
  to.unshift(from.shift()!)
}

function rotate(values: Array<number>) {
  if (values.length < 2) return
  values.push(values.shift()!)
}

function reverseRotate(values: Array<number>) {
  if (values.length < 2) return
  values.unshift(values.pop()!)
}

export function simulatePushSwapOutput({
  input,
  output,
  maxMoves,
}: {
  input: string
  output: string
  maxMoves?: number
}): PushSwapSimulation {
  let a: Array<number>

  try {
    a = parseInput(input)
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Invalid input.',
      moves: 0,
    }
  }

  const b: Array<number> = []
  const moves = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (maxMoves !== undefined && moves.length > maxMoves) {
    return {
      ok: false,
      message: `Used ${moves.length} moves, expected at most ${maxMoves}.`,
      moves: moves.length,
    }
  }

  for (const move of moves) {
    if (move === 'sa') swap(a)
    else if (move === 'sb') swap(b)
    else if (move === 'ss') {
      swap(a)
      swap(b)
    } else if (move === 'pa') push(b, a)
    else if (move === 'pb') push(a, b)
    else if (move === 'ra') rotate(a)
    else if (move === 'rb') rotate(b)
    else if (move === 'rr') {
      rotate(a)
      rotate(b)
    } else if (move === 'rra') reverseRotate(a)
    else if (move === 'rrb') reverseRotate(b)
    else if (move === 'rrr') {
      reverseRotate(a)
      reverseRotate(b)
    } else {
      return {
        ok: false,
        message: `Unknown operation: ${move}`,
        moves: moves.length,
      }
    }
  }

  if (!isSorted(a) || b.length !== 0) {
    return {
      ok: false,
      message: 'Checker failed: stack a is not sorted with stack b empty.',
      moves: moves.length,
    }
  }

  return {
    ok: true,
    message: `Checker OK in ${moves.length} moves.`,
    moves: moves.length,
  }
}
