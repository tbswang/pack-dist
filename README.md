# pack-pack

打包文件夹便于发包

## How to use
1. 在package中添加config字段，用于记录版本号，文件名字等等
2. 在package的scripts中设置NODE_ENV，注意不要加空格，可以参照目前的package.json文件,例如`vue-cli-service build && SET NODE_ENV=production && node ./tar.js`

## TODO
打包成一个webpack插件或者npm包