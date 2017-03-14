const GH_API_URL = 'https://api.github.com'
const PER_PAGE = 100
const DAVID_URL = 'https://david-dm.org'

const appBlock = document.body

const _storeData = [
	{
		name: 'username',
		defaultValue: 'vovanr'
	},
	{
		name: 'ignore',
		defaultValue: [
			'awesome-vovanr',
			'backbone-learning',
			'django-404-500-scaffold',
			'django-amd-requirejs-scaffold',
			'dotfiles',
			'frontend-elements-dictionary',
			'generator-django-js-module',
			'isometric-map',
			'MoonShine_Cursors',
			'notes',
			'show-me-which',
			'userscripts',
			'v-addhost',
			'v-dummyimage',
			'v-pomodoro-alert',
			'v-xfce-random-wallpaper',
			'VovanR.github.io',
		]
	},
	{
		name: 'token',
		defaultValue: ''
	},
]

const _store = _storeData.reduce((a, b) => {
	const {name, defaultValue} = b
	const item = localStorage.getItem(name)
	let value = defaultValue

	if (item !== null && item !== undefined) {
		try {
			value = JSON.parse(item)
		} catch (err) {
			value = item
		}
	}

	a[name] = value

	return a
}, {})

const store = {
	getItem(name) {
		return _store[name]
	},

	setItem(name, value) {
		localStorage.setItem(name, JSON.stringify(value))
		_store[name] = value
	}
}

// Initialize
buildHeader()
buildSubheader()
rebuildDeps()

function buildHeader() {
	const block = buildBlock('h1')
	const label = buildBlock('label', '', 'Awesome')
	const input = buildBlock('input')

	let username = store.getItem('username')
	input.value = username
	input.addEventListener('blur', function () {
		if (this.value === username) {
			return
		}

		store.setItem('username', username = this.value.trim())
		rebuildDeps()
	})

	label.appendChild(input)
	block.appendChild(label)
	appBlock.appendChild(block)
}

function buildSubheader() {
	const block = buildBlock('h3')
	const label = buildBlock('label', '', 'Token')
	const input = buildBlock('input', 'token__input')
	const help = buildBlock('sup')
	help.setAttribute('title', 'GitHub OAuth2 Token')
	const link = buildBlock('a', '', '?')
	link.setAttribute('href', 'https://help.github.com/articles/creating-an-access-token-for-command-line-use/')
	help.appendChild(link)

	let token = store.getItem('token')
	input.value = token
	input.addEventListener('blur', function () {
		if (this.value === token) {
			return
		}
		store.setItem('token', token = this.value.trim())
		rebuildDeps()
	})

	label.appendChild(help)
	label.appendChild(input)
	block.appendChild(label)
	appBlock.appendChild(block)
}

function rebuildDeps() {
	const repos = document.querySelector('.repos')

	if (repos) {
		repos.remove()
	}

	fetchUserRepos()
		.then(buildRepos)
}

function fetchUserData() {
	const username = store.getItem('username')
	const token = store.getItem('token')

	return fetch(`${GH_API_URL}/users/${username}${token ? '?access_token=' + token : ''}`)
		.then(x => x.json())
}

function fetchUserRepos() {
	const username = store.getItem('username')
	const token = store.getItem('token')

	return fetch(`${GH_API_URL}/users/${username}/repos?per_page=${PER_PAGE}${token ? '&access_token=' + token : ''}`)
		.then(x => x.json())
		.then(filterForks)
		.then(filterIgnored)
}

function filterForks(repos) {
	return repos.filter(repo => !repo.fork)
}

function filterIgnored(repos) {
	const ignore = store.getItem('ignore')

	if (!ignore || !ignore.length) {
		return repos
	}

	return repos.filter(repo => !ignore.includes(repo.name))
}

function fetchUserRepoContents(repo) {
	const username = store.getItem('username')
	const token = store.getItem('token')

	return fetch(`${GH_API_URL}/repos/${username}/${repo}/contents/package.json${token ? '?access_token=' + token : ''}`)
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

		if (isFetched) {
			return
		}

		isFetched = true
		fetchUserRepoContents(repo.name)
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
	block.appendChild(buildShield(repo.name))
	block.appendChild(buildShield(repo.name, true))

	block.appendChild(pre)

	return block
}

function buildShield(repo, isDev) {
	const username = store.getItem('username')
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

function buildDeps(pkg) {
	const {dependencies, devDependencies} = pkg
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
