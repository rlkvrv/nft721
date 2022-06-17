# Hardhat starter kit

Project is based on hardhat framework. Under hood you will have typescript for tests, customized solidity and typescript linters, vscode project settings.

You can try running some hardhat standart of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
node scripts/sample-script.js
npx hardhat help
```

Or you can running some npm tasks:
```shell
npm run compile
npm run clean
npm run test
npm run test-coverage
npm run lint
npm run lint:fix
```

## Getting started
1. Set up editor config for vscode.
 - install extension [EditorConfig for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)
 - npm install -g editorconfig
2. `npm ci`
3. `npm run compile`

If you want, you can use Mocha test explorer extension for Visual Studio Code.

## Testing
1. You must have compiled contracts. If you doesn't have compiled, you will need to run npm command `npm run compile`.
2. Next, run `npm run test`.

If you want, you can run test coverage task.

## Linting

For checking of linting, run npm task `npm run lint`.
For auto fixing, run npm task `npm run lint:fix`.
You can linting only ts file or solidity. Run one of them task:
```shell
npm run lint:ts
npm run lint:ts:fix
npm run lint:sol
npm run lint:sol:fix
```
