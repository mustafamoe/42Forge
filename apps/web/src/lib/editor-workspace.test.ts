import { describe, expect, it } from 'vitest'
import { buildTreeRows } from './editor-workspace'

describe('editor workspace tree', () => {
  it('orders rows as a depth-first file tree', () => {
    const rows = buildTreeRows(
      [
        { path: 'Makefile', content: '' },
        { path: 'src/main.c', content: '' },
        { path: 'includes/push_swap.h', content: '' },
        { path: 'src/cleanup.c', content: '' },
      ],
      [{ path: 'src' }, { path: 'includes' }],
    )

    expect(rows.map((row) => row.path)).toEqual([
      'includes',
      'includes/push_swap.h',
      'src',
      'src/cleanup.c',
      'src/main.c',
      'Makefile',
    ])
  })

  it('adds missing parent folders for nested empty folders', () => {
    const rows = buildTreeRows([], [{ path: 'tests/unit' }])

    expect(rows.map((row) => row.path)).toEqual(['tests', 'tests/unit'])
  })
})
