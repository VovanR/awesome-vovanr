import base64ToJSON from './base64ToJSON.js'

test('parse content to JSON', () => {
  const content = 'W3siaWQiOjF9LHsiaWQiOjJ9XQ=='
  expect(base64ToJSON(content)).toEqual([{id: 1}, {id: 2}])
})
