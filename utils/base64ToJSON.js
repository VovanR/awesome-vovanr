/**
 * @param {String} string
 * @returns {Object}
 */
export default function base64ToJSON(string) {
  return JSON.parse(base64DecodeUnicode(string))
}

/**
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#Solution_1_–_escaping_the_string_before_encoding_it}
 *
 * @param {String} string
 * @returns {String}
 */
function base64DecodeUnicode(string) {
  return decodeURIComponent(Array.prototype.map.call(atob(string), c => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  }).join(''))
}
