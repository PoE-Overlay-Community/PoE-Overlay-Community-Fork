# PoE-Overlay Developer Documentation

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

First, join the [Developer Discord](https://discord.gg/sb5mUsWpdg). There are channels
here for both end users and developers. We can help you get set up.

## Prerequisites

Your editor of choice for a node project - like [vscode](https://code.visualstudio.com/).

The first thing to install is [nodejs](https://nodejs.org/en/). We use Node LTS,
which is currently v12.18.0. Download your matching executable (**be sure to get the 64-bit version**) and follow the instructions.

Then you need to install the [windows-build-tools](https://github.com/felixrieseberg/windows-build-tools) from an elevated PowerShell or CMD.exe. This may take a while (10-15min).

```
npm install --global --production windows-build-tools
```

## Installing

1. Clone the repository.
1. Open up the folder with your editor.
1. Run `npm install` to install all required npm packages.
1. Run `npm run electron:rebuild` to generate a executable [robotjs](https://github.com/octalmage/robotjs) version.

That's it. Your Project should now be ready to run:

```
npm run start
```

## Running the tests

These are used to test for eg. the external APIs (poe.ninja, etc.). To run those:

```
npm run ng:test
```

## And coding style tests

These will run certain linters to keep the project in a clean state.

```
npm run ng:lint
```

## Building

A electron executable can be generate by calling:

```
npm run electron:windows
# Under the hood:
# tsc -p tsconfig.serve.json       # Compile Typescript
# ng build -c production           # Build Angular app
# electron-builder build --windows # Create Windows EXE with Electron
```

When you reach this point, you've finished the developer setup! Let us know on
Discord and we'll give you a role to chat in developer channels.

## Built With

- [Electron](https://electronjs.org/) - The desktop app framework
- [Angular](https://angular.io/) - A component framework

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/PoE-Overlay-Community/PoE-Overlay-Community-Fork/tags).

In order to avoid version confusion with the official version, we should do the following:

1. Any changes from the point of divergence should begin with version v0.7.0
1. Major releases may continue to v0.10.0 and beyond
1. Version should never reach or exceed v1.0.0 to avoid conflicts