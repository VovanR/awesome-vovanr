/**
 * Build block
 *
 * @param {string} tagName
 * @param {string} className
 * @param {string} [text]
 * @returns {HTMLElement}
 */
function buildBlock(tagName, className, text) {
  const block = document.createElement(tagName)

  if (className) {
    block.setAttribute('class', className)
  }

  if (text) {
    block.innerHTML = String(text)
  }

  return block
}

export {
  buildBlock
}
