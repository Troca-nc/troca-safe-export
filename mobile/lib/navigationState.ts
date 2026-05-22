let currentPath = '/tabs/accueil'

export function setCurrentPath(path: string) {
  currentPath = path
}

export function getCurrentPath() {
  return currentPath
}
