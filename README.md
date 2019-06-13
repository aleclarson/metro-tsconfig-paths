# metro-tsconfig-paths

Load `tsconfig.json` modules from locally developed packages, and help Metro
resolve imports using their `paths` objects.

## Usage

Add the following to your `metro.config.js` module:

```js
const withTSConfig = require('metro-tsconfig-paths')

module.exports = withTSConfig({
  /* Metro configuration goes here */
})
```

## How it works

It uses [`get-dev-paths`][1] to find any locally developed packages. Then it uses
[`tsconfig-paths`][2] to load `tsconfig.json` modules and convert their `paths`
objects into "matcher functions". Then it hooks into your Metro config and applies
the relevant matcher function (if any) to whichever dependency is being resolved.

[1]: https://github.com/aleclarson/get-dev-paths
[2]: https://github.com/dividab/tsconfig-paths
