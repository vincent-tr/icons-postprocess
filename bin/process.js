const path  = require('path');
const fs    = require('fs');
const jimp  = require('jimp');
const async = require('async');

const validExtensions = new Set(['.jpg', '.png']);

const operationInfo = [
  { suffix : '-small',  size: 50 },
  { suffix : '-mobile', size: 80 }
];

const directory = path.resolve(process.argv[2]);

processDirectory(directory);

function processDirectory(directory) {
  const operations = [];
  console.log('processing directory', directory);

  for(const file of fs.readdirSync(directory)) {
    const filePath = path.resolve(directory, file);
    const fileInfo = path.parse(filePath);
    if(!validExtensions.has(fileInfo.ext)) {
      continue;
    }
    if(operationInfo.find(opi => fileInfo.name.endsWith(opi.suffix))) {
      continue;
    }

    for(const opi of operationInfo) {
      const operation = processFileOperation(filePath, fileInfo, opi);
      operation && operations.push(operation);
    }
  }

  async.series(operations, (err) => {
    err && console.error(err);
  });
}

function processFileOperation(filePath, fileInfo, operationInfo) {

  const targetFile = path.format({
    dir  : fileInfo.dir,
    name : fileInfo.name + operationInfo.suffix,
    ext  : fileInfo.ext
  });

  if(checkAccess(targetFile)) {
    return;
  }

  return (done) => {

    console.log('creating', targetFile);

    jimp.read(filePath, (err, source) => {
      if(err) { return done(err); }

      source
        .resize(operationInfo.size, operationInfo.size)
        .write(targetFile, done);
    });
  };
}

function checkAccess(path) {
  try {
    fs.accessSync(path);
    return true;
  } catch(err) {
    return false;
  }
}
