#now runs PP field
#8-8 this runs ULtimate Goal-ready for PP
 # vFTC-Local

## Usage

To clone and run this repository you'll need [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Go into the repository directory
cd vFTC-Local
# Install dependencies
npm install
# Run the app
npm start
```

## Packaging

Here are the list of commands needed to package the app for Windows.

```bash
# Go into the repository directory
cd vFTC-Local
# Invoke windows packager script (may take a while)
npm run package-win
# Go into release-builds
cd release-builds
# Run build script to generate Windows Installer (may take a while)
node build.js

## PHONTON id
PUN ID is : 494f38b9-e53b-49ae-8729-465f6a4d566b
