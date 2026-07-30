# Shortcuts Search RayCast extension

Allows to list, search and run shortcuts for different applications.

By selecting shortcut extension actually runs the shortcut using AppleScript.

Data is taken from: https://hotkys.com.

Please see contribution guide for adding new shortcuts [here](https://github.com/solomkinmv/hotkys/blob/main/README.md#shortcuts-contribution).

## Commands

### List All Shortcuts

Show shortcuts for all available desktop or web applications. When signed in,
the public catalog is merged with custom applications and shortcut changes from
your Hotkys account. Use the app filter to switch between All Apps, My Apps,
and favorite applications.

### List Current Shortcuts

Show shortcuts for the frontmost desktop application. Command will exit if no desktop application
is detected or if it is missing in the Hotkys database. Signed-in custom
shortcuts are merged into the public shortcuts automatically.

### List Current Web Shortcuts

Show shortcuts for the frontmost web application. Command will exit if no web application
is detected or if it is missing in the Hotkys database. Signed-in custom
shortcuts are merged into the public shortcuts automatically.

- Supported browsers: Safari, Chrome, Arc.
- Not supported browsers: Firefox.

### Copy Current App's Bundle ID

Saves current app's bundle id in the clipboard. Useful for contributing new shortcuts.

Selecting My Apps or Favorites, or adding an application or shortcut to
Favorites, starts Hotkys sign-in when needed. Custom shortcut authoring remains
available on [hotkys.com](https://hotkys.com).

## Screenshots

![list of all applications](metadata/shortcuts-search-1.png)
![search of applications](metadata/shortcuts-search-2.png)
![list of all shortcuts for safari](metadata/shortcuts-search-3.png)
![search of shortcuts for safari](metadata/shortcuts-search-4.png)
