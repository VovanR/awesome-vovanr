const GH_API_URL = 'https://api.github.com'
const USERNAME = 'VovanR'
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
buildHeader()

function buildHeader() {
    const block = buildBlock('h1')
    const label = buildBlock('label', '', 'Awesome ')
    const input = buildBlock('input')

    let username = localStorage.getItem('username') || USERNAME
    username = username.trim()
    input.value = username
    input.addEventListener('blur', function () {
        if (this.value === username) return
        localStorage.setItem('username', username = this.value.trim())
        rebuildDeps(username)
    })

    label.appendChild(input)
    block.appendChild(label)
    appBlock.appendChild(block)

    rebuildDeps(username)
}

function rebuildDeps(username) {
    fetchUserRepos(username)
        .then(repos => buildRepos(username, repos))
}

function fetchUserData(username) {
    return fetch(`${GH_API_URL}/users/${username}?access_token=${TOKEN}`)
        .then(x => x.json())
}

function fetchUserRepos(username) {
    return fetch(`${GH_API_URL}/users/${username}/repos?access_token=${TOKEN}`)
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

function fetchUserRepoContents(username, repo) {
    return fetch(`${GH_API_URL}/repos/${username}/${repo}/contents/package.json?access_token=${TOKEN}`)
        .then(x => x.json())
}

function buildRepos(username, repos) {
    const block = buildBlock('ul', 'repos')
    repos.forEach(repo => block.appendChild(buildRepo(username, repo)))
    appBlock.appendChild(block)
}

function buildRepo(username, repo) {
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
        fetchUserRepoContents(username, repo.name)
            .then(x => x.content)
            .then(base64ToJSON)
            .then(buildDeps)
            .then(x => pre.appendChild(x))
    })
    block.appendChild(button)

    const link = buildBlock('a', '', repo.name)
    link.setAttribute('href', repo.html_url)
    block.appendChild(link)

    // David Dependencies Shields
    block.appendChild(buildShield(username, repo.name))
    block.appendChild(buildShield(username, repo.name, true))

    block.appendChild(pre)

    return block
}

function buildShield(username, repo, isDev) {
    const DAVID_URL = 'https://david-dm.org'
    const link = buildBlock('a')
    link.setAttribute('href', `${DAVID_URL}/${username}/${repo}${isDev ? '?type=dev' : ''}`)

    const shield = buildBlock('img')
    shield.setAttribute('src', `${DAVID_URL}/${username}/${repo}${isDev ? '/dev-status' : ''}.svg?style=flat-square`)
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

function buildDeps(package) {
    const {dependencies, devDependencies} = package
    const block = document.createDocumentFragment()

    if (dependencies && Object.keys(dependencies).length) {
        block.appendChild(buildBlock('small', '', 'dependencies'))
        block.appendChild(buildDepsList(dependencies))
    }
    block.appendChild(buildBlock('small', '', 'devDependencies'))
    block.appendChild(buildDepsList(devDependencies))

    return block
}

function buildDepsList(deps) {
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
