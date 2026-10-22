import { describe, it, expect, beforeEach } from 'vitest'
import { store, addToCompare, moveInCompare } from '../src/store.js'

describe('compare order', () => {
  beforeEach(() => {
    store.compare.splice(0)
    for (const id of ['a', 'b', 'c', 'd']) addToCompare({ id, title: id, lyrics: 'x' })
  })
  const ids = () => store.compare.map((s) => s.id).join('')

  it('moves a song forward and backward', () => {
    moveInCompare(0, 2)
    expect(ids()).toBe('bcad')
    moveInCompare(3, 0)
    expect(ids()).toBe('dbca')
  })

  it('ignores out-of-range moves', () => {
    moveInCompare(0, -1)
    moveInCompare(3, 4)
    expect(ids()).toBe('abcd')
  })
})
