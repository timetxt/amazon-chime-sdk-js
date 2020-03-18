## Education Electron Demo

We will automate some steps before merging this branch into master.

## Getting started

```bash
# Copy and paste the Chime SDK "build" folder.
cd /path/to/amazon-chime-sdk-js
npm run build # Bug: This command generates the wrong "build" folder now. Run it after removing "./guides/docs.ts" from tsconfig.json to mitigate the issue.
cd demos/edu-demo
cp -r ../../build amazon-chime-sdk-js

# Install dependencies
yarn
```

## Building

```bash
# The "edu-demo" uses server.js at http://127.0.0.1:8080
cd ../browser
npm run start
```

```bash
yarn dev
```

## Packaging

```
yarn package
```
