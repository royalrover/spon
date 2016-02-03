# 如何编写一个 DEF 插件

## 起名

插件名同时也是命令名， 起名的原则是简短，易识别。 DEF插件名需要添加 `def-` 前缀。

示例

- def-plugin
- def-alias
- def-yo
- def-grunt
- def-xcake

## 新建NPM模块
那么假定我要创建的插件名为 `def-foo`, 创建一个插件目录  `def-foo`, 执行 `npm init` 初始化一个 `package.json`

```json
{
  "name": "def-foo",
  "version": "0.0.0",
  "description": "a def sample plugin",
  "main": "index.js",
  "scripts": {
    "test": "mocha"
  },
  "author": "wenlong <wenlong@taobao.com>",
  "license": "BSD-2-Clause",
  "dependencies": {
  }
}
```

创建入口文件 `index.js`

```js
module.exports = function(def) {
    
};

```

这里的 def 是插件的Runtime对象， DEF与插件的集成主要用过这个runtime完成的。


## 添加一个命令
注册完插件后可用

```js
def.cli
    .command('echo [name]')
    .description('echo the args')
    .action(function(name){
        console.log('you say '+name);
    });
```

执行 `def foo echo bar`试试？

## 请求其他插件的数据

你可以调用所有其他插件的公开接口。这是一个promise 风格的接口，调用方式示例：

```js
def.request('pluginName:method', data).then(
    function(result){
        // 成功的回调
    }, 
    function(err){
        //失败的回调
    }
);
```

## 发布一个接口

```js
def.publish('uppercase', function(data, info, callback){
    callback(null, {
        result: 'foo:'+data
    });
});
```
当其他插件请求这个接口时，回调就会执行. data 是接口的参数，可以是任何类型。

info 是这次请求的信息。比如 info.from 会指出这个请求的发起方。

返回数据时，或报错时, 执行回调函数，第一个参数是 JS错误， 第二个是返回的数据。

## 完善文档

我们约定了一些插件 markdown 的规则，符合规则的文档可以在 def 的官网上呈现，详见《[开发文档规则](http://def.taobao.net/?doc/#site/the-doc-rules)》

## 调试插件

1. 安装 def, 你可以使用 `npm install -g def`
2. 其次在插件目录下执行 `npm link`
3. 在 {HOME}/.def 目录下面，执行 `npm link def-foo`

## 其他资源

- 《[DEF Runtime API](http://def.taobao.net/?doc/#def/def-runtime-api)》