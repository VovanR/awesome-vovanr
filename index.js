const apiAddress = 'https://api.github.com'
const username = 'vovanr'
const token = 'd150a08e4743e6d2bcea56d8c2ed3635d6cee501'
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

fetchUserRepos().then(buildRepos)

function fetchUserData() {
    return fetch(`${apiAddress}/users/${username}?access_token=${token}`)
        .then(x => x.json())
}

function fetchUserRepos() {
    return fetch(`${apiAddress}/users/${username}/repos?access_token=${token}`)
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
    return fetch(`${apiAddress}/repos/${username}/${repo}/contents/package.json?access_token=${token}`)
        .then(x => x.json())
}

function buildRepos(repos) {
    const block = buildBlock('ul')
    repos.forEach(repo => {
        block.appendChild(buildRepo(repo))
    })
    appBlock.appendChild(block)
}

function buildRepo(repo) {
    const block = buildBlock('li')

    const code = buildBlock('code')

    const button = buildBlock('button', '', '+')
    button.setAttribute('type', 'button')
    button.addEventListener('click', () => {
        fetchUserRepoContents(repo.name)
            .then(x => x.content)
            .then(base64ToJSON)
            .then(x => x.devDependencies)
            .then(buildDeps)
            .then(x => {
                code.appendChild(x)
            })
    })
    block.appendChild(button)

    const link = buildBlock('a')
    link.setAttribute('href', repo.html_url)
    block.appendChild(link)

    const name = buildBlock('span', '', repo.name)
    link.appendChild(name)

    const shield = buildBlock('img')
    shield.setAttribute('src', `https://david-dm.org/${username}/${repo.name}/dev-status.svg?style=flat-square`)
    link.appendChild(shield)

    const pre = buildBlock('pre')
    block.appendChild(pre)

    pre.appendChild(code)

    return block
}

function buildDeps(deps) {
    const block = buildBlock('ul')
    Object.keys(deps).forEach(name => {
        const item = buildBlock('li', '', `${name}: "${deps[name]}"`)
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

	if (className) {
		block.setAttribute('class', className)
	}

	if (text) {
		block.innerHTML = String(text)
	}

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
