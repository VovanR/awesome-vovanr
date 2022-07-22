/**
 * @param {string} str
 * @returns {Object}
 */
function base64ToJSON(str) {
  return JSON.parse(base64DecodeUnicode(str))
}

/**
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#Solution_1_–_escaping_the_string_before_encoding_it}
 *
 * @param {string} str
 * @returns {string}
 */
function base64DecodeUnicode(str) {
  return decodeURIComponent(Array.prototype.map.call(atob(str), c => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  }).join(''))
}

export {
  base64ToJSON
}
