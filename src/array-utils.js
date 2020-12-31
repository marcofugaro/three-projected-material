// returns an array of numbers that go from 0 to n - 1
// a simpler version of https://lodash.com/docs/4.17.15#range
export function range(n) {
  return [...Array(n).keys()]
}
