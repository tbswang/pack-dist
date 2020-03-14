#! /usr/bin/env node
/**
 * 基于https://github.com/archiverjs/node-archiver/blob/master/examples/progress.js进行修改
 * 场景：有时候需要将前端的打包文件进行发布或者部署，需要自己压缩，然后重命名。现在通过该文件可以实现自动化。
 * TODO：在windows平台下还没有进行测试。
 * 使用：运行`node ./tar.js`, 在同级目录下生成文件. 第一次使用会在package.json文件中的`config`字段中添加`pack`配置.
 */

const archiver = require('archiver');
const async = require('async');
const fs = require('fs');
const cliProgress = require('cli-progress');
const path = require('path');

const projectPath = process.cwd();

const packageFile = require(path.join(projectPath, 'package.json'));
const { version, name } = packageFile;
/**
 * You can use a nodejs module to do this, this function is really straightforward and will fail on error
 * Note that when computing a directory size you may want to skip some errors (like ENOENT)
 * That said, this is for demonstration purpose and may not suit a production environnment
 */
function directorySize(dirPath, cb, s) {
  let size = s;
  if (size === undefined) {
    size = 0;
  }

  fs.stat(dirPath, (err, stat) => {
    if (err) {
      cb(err);
      return;
    }

    size += stat.size;

    if (!stat.isDirectory()) {
      cb(null, size);
      return;
    }

    fs.readdir(dirPath, (readdirErr, paths) => {
      if (readdirErr) {
        cb(readdirErr);
        return;
      }

      async.map(paths.map(p => `${dirPath}/${p}`), directorySize, (pathErr, sizes) => {
        size += sizes.reduce((a, b) => a + b, 0);
        cb(pathErr, size);
      });
    });
  });
}

/**
 * https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript#18650828
 */
function bytesToSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Byte';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 20);
  return `${Number.prototype.toFixed.call(bytes / (1024 ** i), 1)} ${sizes[i]}`;
}

// You can change this by something bigger!
const directory = path.join(projectPath, 'dist');
const destination = path.join(projectPath,`${name}@${version}.zip`);
const destinationStream = fs.createWriteStream(destination);

console.log('Zipping %s to %s', directory, destination);

// To find out the progression, we may prefer to first calculate the size of the zip's future content
// For this, we need to recursivly `readDir` and get the size from a `stat` call on every file.
// Note that Archiver is also computing the total size, but it's done asynchronously and may not be accurate
directorySize(directory, (err, totalSize) => {
  const archive = archiver('zip');

  archive.on('error', (archiveErr) => {
    console.error('Error while zipping', archiveErr);
  });

  const bar = new cliProgress.SingleBar();
  bar.start(totalSize, 0);

  archive.on('progress', (progress) => {
    bar.update(progress.fs.processedBytes);
  });

  // on stream closed we can end the request
  archive.on('end', () => {
    const archiveSize = archive.pointer();

    bar.stop();

    console.log('Archiver wrote %s bytes', bytesToSize(archiveSize));
  });

  archive.pipe(destinationStream);

  archive.directory(directory);

  archive.finalize();
});
