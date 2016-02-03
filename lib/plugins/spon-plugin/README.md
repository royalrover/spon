# spon-plugin

## 说明

用于 spon 插件管理，包括安装、升级等功能

- 此为内置插件，安装 spon 时默认安装 spon-plugin
- 安装一个插件时，会自动安装该插件所依赖的所有插件
- 移除一个插件时，依赖此插件的其它插件在运行时，会自动再装回来


## 用法

### install

安装一个或者多个插件

__语法__：

```bash
spon plugin install <name>[ <name>[ <name>...]]
```

__参数__：

- name: 插件名称

__示例__：

```bash
spon plugin install spon-scm spon-tbc # 安装 scm 和 tbc
```

### remove

移除一个或者多个插件
 
__语法__：

```bash
spon plugin remove <name>[ <name>[ <name>...]]
```

__参数__：

- name: 插件名称

__示例__：

```bash
spon plugin remove spon-test # 移除 test 插件
```

### update

更新一个、多个或所有插件

__语法__：

```bash
spon plugin update [<name>[ <name>[ <name>...]]]
```

__参数__：

- name: 插件名称

__示例__：

```bash
spon plugin update spon-a spon-b # 更新 scm 和 tbc 插件
spon plugin update # 更新所有插件
```

### list

列出已装插件详情

__语法__：

```bash
spon plugin list
```

__参数__：

无

__示例__：

无


## plugin编写规范
### 实例参考
spon-test插件是一个说明性插件。在spon中，任何一个插件都是npm模块，因此编写一个插件首先需要初始化为一个npm模块；

以下为spon-test/index.js中源码

```
/**
 * Created by showjoy on 16/2/2.
 */
module.exports = function(spon){
  spon.cli
    .command('_abc')
    .description('test _abc')
    .action(function(){
      console.log("_abc work!");
    });

  spon.publish('isTest', function(data,cb){
    console.log('is testing...');
    // 执行回调函数，其中data为传入参数，cb为回调函数
    cb(data);
  });

  spon.publish('noTest', function(data,cb){
    cb();
  });
}
```
这样，我们在spon-test插件中注册了一个`spon _abc`命令，并且暴露了“isTest”和“noTest”接口，可以让其他的
插件使用接口：

```
spon.consume('isTest',{data: 'is nothing'},function(data){
    ...
})
```

package.json：

```
{
  "name": "spon-test",
  "version": "1.0.0",
  "description": "test",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": {
    "name": "yuxiu"
  },
  "license": "ISC",
  "_id": "spon-test@1.0.0",
  "_shasum": "244676d281cbda2528fa6e68c78c30a18a95631e",
  "_from": "spon-test@latest",
  "_npmVersion": "2.14.2",
  "_nodeVersion": "4.0.0",
  "_npmUser": {
    "name": "yuxiu",
    "email": "tanchengyl@126.com"
  },
  "dist": {
    "shasum": "244676d281cbda2528fa6e68c78c30a18a95631e",
    "tarball": "http://registry.npmjs.org/spon-test/-/spon-test-1.0.0.tgz"
  },
  "maintainers": [
    {
      "name": "yuxiu",
      "email": "tanchengyl@126.com"
    }
  ],
  "_npmOperationalInternal": {
    "host": "packages-9-west.internal.npmjs.com",
    "tmp": "tmp/spon-test-1.0.0.tgz_1454391126440_0.1255379538051784"
  },
  "directories": {},
  "_resolved": "http://registry.npmjs.org/spon-test/-/spon-test-1.0.0.tgz",
  "readme": "ERROR: No README data found!"
}
```

### 插件sdk
通过index.js，可以看到exports的函数注入了一个spon参数，这是spon runtime，它会解析所有本地spon的所有
插件，并且通过publish暴露插件接口，可以给其他插件使用。

注入到插件的spon常用接口如下：

```
  spon.publish(apiName,function(data,cb){}) // 发布接口，第二个参数为接口实现，该函数接受两个参数，分别为“传入数据”和“回调”
  spon.cli.command() // 发布命令行接口，具体命令行编写规范按照npm模块 “cj/commander” 使用
  spon.log.info() // 输出调试信息
  spon.log.warn() // 输出警告信息
  spon.log.error() // 输出错误信息

```


# spon-alias
## 别名
为了防止命令全局污染，在spon中默认集成了spon-alias插件，alias插件会在代码层面进行优化，减小命令重复的可能性；

## 使用
`spon alias` --> 本地所有的别名配置
`spon set <command> <origin command>` --> 设置别名

## 实例
run: `spon alias`
output:

```
install <= plugin install
i <= plugin install
remove <= plugin remove
rm <= plugin remove
list <= plugin list
ls <= plugin list
update <= plugin update
up <= plugin update
```

run: `spon set 'ttt' 'plugin test'`
output:

```
install <= plugin install
i <= plugin install
remove <= plugin remove
rm <= plugin remove
list <= plugin list
ls <= plugin list
update <= plugin update
up <= plugin update
ttt <= plugin test
```


