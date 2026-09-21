import { describe, expect, it } from 'vitest'
import ar from './locales/ar.json'
import en from './locales/en.json'
function leaves(value: unknown, prefix = ''): Record<string, string> {
  if (typeof value === 'string') return { [prefix]: value }
  return Object.assign({}, ...Object.entries(value as object).map(([key, child]) => leaves(child, `${prefix}.${key}`)))
}
describe('localization coverage', () => {
  it('has matching keys in both languages', () => {
    expect(Object.keys(leaves(ar)).sort()).toEqual(Object.keys(leaves(en)).sort())
  })
  it('contains no Arabic copy in the English locale', () => {
    for (const text of Object.values(leaves(en))) expect(text).not.toMatch(/[\u0600-\u06ff]/)
  })
  it('preserves interpolation variables in Arabic', () => {
    const english = leaves(en)
    for (const [key, text] of Object.entries(leaves(ar))) expect(text.match(/{{.*?}}/g) ?? []).toEqual(english[key].match(/{{.*?}}/g) ?? [])
  })
})
