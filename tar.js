/**
 * 生成名字如 "时空数据管理平台-测试9-30v8" 的文件，便于发包
 */
const fs = require('fs');
const archiver = require('archiver');
const packageFile = require('./package.json');
const path = require('path');

console.log('zip dist folder start...');

const isProduction = process.env.NODE_ENV === 'production';
const {
  prefix = '',
  target = isProduction ? '正式' : '测试',
  versionPrefix = '',
  testVersion = 0,
  prodVersion = 0,
  suffix = 'zip',
  date = `${new Date().getMonth() + 1}-${new Date().getDate()}`,
} = packageFile.config.pack;

const version = isProduction ? prodVersion : testVersion;
const curVersion = parseInt(version, 10) + 1;
const output = fs.createWriteStream(`${__dirname}/${prefix}-${target}${date}${versionPrefix}${curVersion}.${suffix}`);
const archive = archiver('zip', {
  zlib: { level: 9 }
});

output.on('end', () => {
  console.log('Data has been drained');
});

archive.on('warning', (err) => {
  if (err.code === 'ENOENT') {
    console.log(err);
  } else {
    throw err;
  }
});

archive.on('error', (err) => {
  throw err;
});

archive.directory('dist/', false);
archive.pipe(output);

packageFile.config.pack[
  isProduction ? 'prodVersion' : 'testVersion'
] = curVersion;

fs.writeFileSync(
  path.join(__dirname, '/package.json'),
  `${JSON.stringify(packageFile, null, 2)}\n`
);

console.log('zip folder finished');
