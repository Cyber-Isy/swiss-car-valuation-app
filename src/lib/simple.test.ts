import { test, expect } from 'vitest'

test('simple math', () => {
  expect(1 + 1).toBe(2)
})

test('string concat', () => {
  expect('hello' + ' ' + 'world').toBe('hello world')
})
