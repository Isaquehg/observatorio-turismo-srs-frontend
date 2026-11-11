import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useFavoritos } from './favoritos'

describe('useFavoritos hook unit tests', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with empty array and toggle favorite IDs in state and localStorage', () => {
    const { result } = renderHook(() => useFavoritos())

    expect(result.current.ids).toEqual([])

    // Add favorite ID
    act(() => {
      result.current.alternar('ponto-1')
    })
    expect(result.current.ids).toEqual(['ponto-1'])
    expect(JSON.parse(localStorage.getItem('ot-srs:favoritos'))).toEqual(['ponto-1'])

    // Add a second favorite ID
    act(() => {
      result.current.alternar('ponto-2')
    })
    expect(result.current.ids).toEqual(['ponto-1', 'ponto-2'])

    // Remove the first favorite ID by toggling it again
    act(() => {
      result.current.alternar('ponto-1')
    })
    expect(result.current.ids).toEqual(['ponto-2'])
    expect(JSON.parse(localStorage.getItem('ot-srs:favoritos'))).toEqual(['ponto-2'])
  })
})
