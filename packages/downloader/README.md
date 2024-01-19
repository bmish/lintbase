# @lintbase/downloader

The goal of this package is to help with bulk-downloading npm packages.

In order to download packages in such a way that they can be loaded and executed (for example, to get exported data), it currently uses npm to install them locally inside a `tmp/` folder.

This package needs a lot of work.

- The API needs to be cleaned up and fleshed out.
- Package names and search queries are currently hardcoded.
- Packages are installed locally in a potentially-unsafe manner. This needs to run in a sandbox in the case of untrusted packages.
- There are no tests yet.

## Usage

Currently, running the following command from inside this package will download packages.

```sh
npm run download
```

There's also an incomplete Node API for loading a package which is intended to work something like this:

```js
const { load } = require('@lintbase/downloader');

const pkg = await load<ESLintPlugin>('eslint-plugin-foo');
```
