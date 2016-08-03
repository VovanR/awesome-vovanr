const GH_API_URL = 'https://api.github.com'
const USERNAME = 'vovanr'
const TOKEN = 'd150a08e4743e6d2bcea56d8c2ed3635d6cee501'

const blackList = [
    'awesome-vovanr',
    'backbone-learning',
    'django-404-500-scaffold',
    'django-amd-requirejs-scaffold',
    'dotfiles',
    'frontend-elements-dictionary',
    'generator-django-js-module',
]
const appBlock = document.body

// Initialize
fetchUserRepos().then(buildRepos)

function fetchUserData() {
    return fetch(`${GH_API_URL}/users/${USERNAME}?access_token=${TOKEN}`)
        .then(x => x.json())
}

function fetchUserRepos() {
    return fetch(`${GH_API_URL}/users/${USERNAME}/repos?access_token=${TOKEN}`)
        .then(x => x.json())
        .then(filterForks)
        .then(filterBlackList)
}

function filterForks(repos) {
    return repos.filter(repo => !repo.fork)
}

function filterBlackList(repos) {
    return repos.filter(repo => !blackList.includes(repo.name))
}

function fetchUserRepoContents(repo) {
    return fetch(`${GH_API_URL}/repos/${USERNAME}/${repo}/contents/package.json?access_token=${TOKEN}`)
        .then(x => x.json())
}

function buildRepos(repos) {
    const block = buildBlock('ul', 'repos')
    repos.forEach(repo => block.appendChild(buildRepo(repo)))
    appBlock.appendChild(block)
}

function buildRepo(repo) {
    const block = buildBlock('li', 'repos__item')

    const pre = buildBlock('pre')
    pre.style.display = 'none'

    const button = buildBlock('button', '', '+')
    button.setAttribute('type', 'button')
    let isFetched = false
    button.addEventListener('click', () => {
        toggleDeps(button, pre)
        if (isFetched) return
        isFetched = true
        fetchUserRepoContents(repo.name)
            .then(x => x.content)
            .then(base64ToJSON)
            .then(x => x.devDependencies)
            .then(buildDeps)
            .then(x => pre.appendChild(x))
    })
    block.appendChild(button)

    const link = buildBlock('a', '', repo.name)
    link.setAttribute('href', repo.html_url)
    block.appendChild(link)

    const shield = buildShield(repo.name)
    block.appendChild(shield)

    block.appendChild(pre)

    return block
}

function buildShield(repo) {
    const DAVID_URL = 'https://david-dm.org'
    const link = buildBlock('a')
    link.setAttribute('href', `${DAVID_URL}/${USERNAME}/${repo}?type=dev`)

    const shield = buildBlock('img')
    shield.setAttribute('src', `${DAVID_URL}/${USERNAME}/${repo}/dev-status.svg?style=flat-square`)
    link.appendChild(shield)

    return link
}

function toggleDeps(button, deps) {
    const collapsed = '+'
    const expanded = '−'

    if (button.innerHTML === collapsed) {
        deps.style.display = ''
        button.innerHTML = expanded
    } else {
        deps.style.display = 'none'
        button.innerHTML = collapsed
    }
}

function buildDeps(deps) {
    const block = buildBlock('ul', 'deps')
    Object.keys(deps).forEach(name => {
        const item = buildBlock('li', 'deps__item')

        const label = buildBlock('span', 'deps__label', name)
        item.appendChild(label)

        const sep = document.createTextNode(': "')
        item.appendChild(sep)

        const value = buildBlock('span', 'deps__value', deps[name])
        item.appendChild(value)

        const sep2 = document.createTextNode('"')
        item.appendChild(sep2)

        block.appendChild(item)
    })
    return block
}

/**
 * Build block
 *
 * @param {String} tagName
 * @param {String} className
 * @param {String} [text]
 * @returns {Node}
 */
function buildBlock(tagName, className, text) {
	const block = document.createElement(tagName)

	if (className) block.setAttribute('class', className)

	if (text) block.innerHTML = String(text)

	return block
}

/**
 * @param {String} str
 * @returns {Object}
 */
function base64ToJSON(str) {
    return JSON.parse(base64DecodeUnicode(str))
}

/**
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#Solution_1_–_escaping_the_string_before_encoding_it}
 *
 * @param {String} str
 * @returns {String}
 */
function base64DecodeUnicode(str) {
    return decodeURIComponent(Array.prototype.map.call(atob(str), c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
}
