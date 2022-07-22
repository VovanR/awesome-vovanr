import {createElement} from './utils/create-element.js'
import {buildBlock} from './utils/build-block.js'
import {base64ToJSON} from './utils/base64-to-json.js'
import {
  GH_API_URL,
  PER_PAGE,
  DAVID_URL
} from './constants.js'

// TODO: Toggle All
// TODO: Reset statistics
// TODO: Sort dep versions

// TODO: Filter
// TODO: Filter by depend package
// TODO: Filter by depend package versions
// TODO: Make clickable filters "Name", "Version"
// TODO: Make clickable statistics filters

// Settings
// TODO: Add settings control panel
// Token
// TODO: Hide token input. Show change token button
// TODO: Don't save token in `localStorage`. Or hash it
// Show/Hide shields
// Ignore list

// Later
// TODO: Add "Ignore package" button
// TODO: Manage ignored packages list
// TODO: Rename to `avesome-username`


const appBlock = document.body

const _storeData = [
  {
    name: 'username',
    defaultValue: 'vovanr'
  },
  {
    name: 'showShields',
    defaultValue: true
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
      'test-rebase',
      'userscripts',
      'v-addhost',
      'v-dummyimage',
      'v-pomodoro-alert',
      'v-xfce-random-wallpaper',
      'VovanR.github.io'
    ]
  },
  {
    name: 'token',
    defaultValue: ''
  }
]

const statistics = {}

function addStatisticsPackage(name, version) {
  if (typeof statistics[name] === 'undefined') {
    statistics[name] = []
  }

  if (statistics[name].includes(version)) {
    return
  }

  statistics[name].push(version)
}

window.getStatistics = function () {
  return statistics
}

window.buildStatistics = function () {
  appBlock.append(buildDepsList(getStatistics()))
}

const _store = _storeData.reduce((a, b) => {
  const {name, defaultValue} = b
  const item = localStorage.getItem(name)
  let value = defaultValue

  if (item !== null && item !== undefined) {
    try {
      value = JSON.parse(item)
    } catch (error) {
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

  label.append(input)
  block.append(label)
  appBlock.append(block)
}

function buildSubheader() {
  const block = buildBlock('h3')
  const label = buildBlock('label', '', 'Token')
  const input = buildBlock('input', 'token__input')

  const help = buildBlock('sup')
  help.setAttribute('title', 'GitHub OAuth2 Token')

  const link = createElement({
    type: 'a',
    text: '?',
    attributes: {
      href: 'https://help.github.com/articles/creating-an-access-token-for-command-line-use/',
      target: '_blank'
    }
  })
  help.append(link)

  let token = store.getItem('token')
  input.value = token
  input.addEventListener('blur', function () {
    if (this.value === token) {
      return
    }

    store.setItem('token', token = this.value.trim())
    rebuildDeps()
  })

  label.append(help)
  label.append(input)
  block.append(label)
  appBlock.append(block)
}

function rebuildDeps() {
  const repos = document.querySelector('.repos')

  if (repos) {
    repos.remove()
  }

  fetchUserRepos()
    .then(filterForks)
    .then(filterIgnored)
    .then(buildRepos)
}

function fetchUserData() {
  const username = store.getItem('username')
  const token = store.getItem('token')

  return fetch(`${GH_API_URL}/users/${username}${token ? '?access_token=' + token : ''}`)
    .then(x => x.json())
}

function fetchUserRepos(page = 1, data = []) {
  const username = store.getItem('username')
  const token = store.getItem('token')

  return fetch(`${GH_API_URL}/users/${username}/repos?page=${page}&per_page=${PER_PAGE}${token ? '&access_token=' + token : ''}`)
    .then(x => x.json())
    .then(x => {
      if (x.length === PER_PAGE) {
        return fetchUserRepos(page + 1, data.concat(x))
      }

      return data.concat(x)
    })
}

function filterForks(repos) {
  return repos.filter(repo => !repo.fork)
}

function filterIgnored(repos) {
  const ignore = store.getItem('ignore')

  if (!ignore || ignore.length === 0) {
    return repos
  }

  return repos.filter(repo => !ignore.includes(repo.name))
}

function fetchUserRepoContents(repo) {
  const username = store.getItem('username')
  const token = store.getItem('token')

  return fetch(`${GH_API_URL}/repos/${username}/${repo}/contents/package.json${token ? '?access_token=' + token : ''}`)
    .then(x => x.json())
    .then(x => x.content)
    .then(base64ToJSON)
}

function buildRepos(repos) {
  const block = buildBlock('ul', 'repos')
  repos.forEach(repo => block.append(buildRepo(repo)))
  appBlock.append(block)
}

function buildRepo(repo) {
  const block = buildBlock('li', 'repos__item')

  const pre = buildBlock('pre')
  pre.style.display = 'none'

  const button = createElement({
    type: 'button',
    text: '+',
    attributes: {
      type: 'button'
    }
  })

  let isFetched = false
  button.addEventListener('click', () => {
    toggleDeps(button, pre)

    if (isFetched) {
      return
    }

    isFetched = true
    fetchUserRepoContents(repo.name)
      .then(buildDeps)
      .then(x => pre.append(x))
  })

  block.append(button)

  const link = createElement({
    type: 'a',
    text: repo.name,
    attributes: {
      href: repo.html_url,
      target: '_blank'
    }
  })

  block.append(link)

  // David Dependencies Shields
  if (store.getItem('showShields')) {
    block.append(buildShield(repo.name))
    block.append(buildShield(repo.name, true))
  }

  block.append(pre)

  return block
}

function buildShield(repo, isDev) {
  const username = store.getItem('username')

  return createElement({
    type: 'a',
    attributes: {
      href: `${DAVID_URL}/${username}/${repo}${isDev ? '?type=dev' : ''}`
    },
    children: [
      createElement({
        type: 'img',
        attributes: {
          src: `${DAVID_URL}/${username}/${repo}${isDev ? '/dev-status' : ''}.svg?style=flat-square`
        }
      })
    ]
  })
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

  if (dependencies && Object.keys(dependencies).length > 0) {
    block.append(buildBlock('small', '', 'dependencies'))
    block.append(buildDepsList(dependencies))
  }

  block.append(buildBlock('small', '', 'devDependencies'))
  block.append(buildDepsList(devDependencies))

  return block
}

function buildDepsList(deps) {
  const block = buildBlock('ul', 'deps')

  Object.entries(deps)
    .sort((a, b) => {
      return a[0].localeCompare(b[0], 'en', {sensitivity: 'base'})
    })
    .forEach(([name, value]) => {
      if (typeof value === 'string') {
        addStatisticsPackage(name, value)
      }

      const item = buildBlock('li', 'deps__item')

      const label = buildBlock('span', 'deps__label', name)
      item.append(label)

      const sep = document.createTextNode(': "')
      item.append(sep)

      if (Array.isArray(value)) {
        item.append(document.createTextNode('['))
      }

      const valueText = Array.isArray(value) ? value.join(', ') : value
      const valueElement = buildBlock('span', 'deps__value', valueText)
      item.append(valueElement)

      if (Array.isArray(value)) {
        item.append(document.createTextNode(']'))
      }

      const sep2 = document.createTextNode('"')
      item.append(sep2)

      block.append(item)
    })

  return block
}
