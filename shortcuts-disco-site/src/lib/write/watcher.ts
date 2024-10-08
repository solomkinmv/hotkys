// Uses https://github.com/paulmillr/chokidar to watch for changes
// during development
import chokidar from 'chokidar'
import { dataFolder } from '../utils'
import path, { basename } from 'path'
import { loadApp } from '../load/app-loader'
import { prettifyApp } from './prettify'
import { combineApps, writeAppShortcut } from './app-writer'
import Validator from '../load/validator'
import { parseKeyCodes } from '../../../__tests__/helpers'

/**
 * The scripts called on shortcut file modifications write to those same files.
 * This can lead to an endless loop if the resulting writes aren't ignored.
 * This lock helps to ignore these events.
 */
const locks: { [key: string]: boolean } = {}

// TODO: also watch the keyCodes for changes
const keyCodes = parseKeyCodes()
const validator = new Validator(keyCodes)

/**
 * Processes additions and updates, but not deletions. Attempts to prettify and validate shortcuts.
 * Does not write changes in case there were validation or loading errors.
 */
function processWrite(filePath: string) {
  const fileName = basename(filePath)
  // Ignore call resulting from the write
  if (locks[filePath] === true) {
    // Reset lock
    locks[filePath] = false
    return;
  }

  let app
  try {
    app = loadApp(filePath)
    if (!app) {
      // The file not existing shouldn't happen,
      // if the watcher just reported the file being updated/created
      return
    }
  } catch (e) {
    console.warn(`Couldn't load ${fileName}, the JSON is probably invalid`)
    return
  }
  prettifyApp(app)
  // Validate after attempting to fix using prettify
  try {
    validator.validate([app])
  } catch (e) {
    console.warn(`Validation error in ${fileName}: ${e instanceof Error ? e.message : e}.\nNot writing prettified file.`,)
    return
  }
  console.log("Writing", basename(filePath))
  // Acquire file write lock
  locks[filePath] = true
  writeAppShortcut(app)
  combineApps()
}

function processDeletion(filePath: string) {
  // In this case, we just need to recreate the distribution file
  // so the app is removed there too.
  console.log(`Recombining apps after deletion of ${basename(filePath)}`)
  combineApps()
}

function watchDataFolder() {
  const watcher = chokidar.watch(dataFolder, { ignored: path.resolve(dataFolder, 'schema') })
  watcher.on('add', processWrite).on('change', processWrite)
  watcher.on('unlink', processDeletion)
}


// If run directly via the CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  watchDataFolder()
}
