import { describe, expect, it } from 'vitest'
import { simulatePushSwapOutput } from './push-swap-simulator'

describe('push_swap output simulator', () => {
  it('accepts a valid operation stream that sorts a and empties b', () => {
    const result = simulatePushSwapOutput({
      input: '3 2 1\n',
      output: 'ra\nsa\n',
    })

    expect(result.ok).toBe(true)
    expect(result.moves).toBe(2)
  })

  it('rejects unknown operations', () => {
    const result = simulatePushSwapOutput({
      input: '2 1\n',
      output: 'flip\n',
    })

    expect(result.ok).toBe(false)
    expect(result.message).toContain('Unknown operation')
  })

  it('rejects streams that do not leave a sorted with b empty', () => {
    const result = simulatePushSwapOutput({
      input: '3 2 1\n',
      output: 'sa\n',
    })

    expect(result.ok).toBe(false)
    expect(result.message).toContain('Checker failed')
  })

  it('enforces optional move caps', () => {
    const result = simulatePushSwapOutput({
      input: '2 1\n',
      output: 'sa\n',
      maxMoves: 0,
    })

    expect(result.ok).toBe(false)
    expect(result.message).toContain('expected at most 0')
  })
})
