# 安装cnpm和spon
尚妆前端开发的套件名称是spon，目前已发布在npm模块库中，由于npm的源在海外，因此安装相关插件的速度比较慢，所以，针对spon，非常建议你使用淘宝的第三方镜像源，cnpm。
安装cnpm之后，执行`sudo cnpm i -g spon`，等待2min，spon就安装到系统上了。
# spon初始化
spon安装完成之后，可以执行命令`spon`查看相关的命令说明。在使用具体功能之前，先初始化spon的执行环境，它会检测当前系统有没有安装yeoman和gulp命令，以及copy相关的npm组件。这一切，通过`spon init`运行。

# mobi的使用
spon初始化完成之后，我们就可以使用针对移动端开发的spon的插件－`mobi`了。执行`spon mobi`，可以看到相关的子命令，这些命令与尚妆前端的开发流程以及规范密不可分，在下文中会着重讲解。
### 神马是mobi工程
  mobi工程是mobi管理的工程，在mobi工程的当前路径下，我们可以看到一些配置文件，这些文件根据mobi工程的类型不同而不同。那么，mobi工程有哪些类型呢:  

1.  page工程
2.  component工程
3.  ReactNative工程  

以上。
   page工程就是页面工程，对应着一个java工程。一个page工程中可以有多个页面，每个页面根据名称区分；
   component工程就是一个组件，它复用可充用的逻辑，我们可以在page工程的js文件中引用它；
   ReactNative工程就是一个ReactNative组件，目前并没有对其进行开发，暂且不表。

   以上三种类型的mobi工程，都是一个git本地仓库。也就是说，我们的mobi工程必然是被git托管的，因此，在gitlab上必须对应一个远程仓库，我们根据项目的需要，在`group:showjoy-assets,ggl-assets,fecomponent`中进行创建项目，命名规则同时也需要遵循规范：  

   "针对尚妆的页面工程，根据是否是移动端或者pc端，在工程名后面加后缀"-m" or "-p",如对于交易工程，我们在组 showjoy-assets中创建trade-m的移动端工程，trade-p的pc端工程"  
   "针对够给力的页面工程，同理"  
   "针对组件工程，在gitlab的fecomponent组中进行创建工程，工程名为组件名称，并且在创建仓库时，需要确保该工程是可见的，即为public权限"

#### 再次强调，针对component工程，必须在创建gitlab仓库时确保工程可见，即public权限，否则在构建过程中肯定会报错！！
## 初始化工程
 该命令的作用是初始化一个工程为mobi项目（mobi管控的工程）。
    1，spon mb init （初始化page工程）
    2，spon mb init －c （初始化component工程）
    3，spon mb init －r （初始化RN工程）
执行该命令，会出现一系列的交互，需要用户填入“对应gitlab的组”，“开发者”，“相关依赖”等，据实填写，如果有不明白的地方，请联系**欲休**。
## spon mb add
add命令仅仅针对page工程而言，在实际的page工程中，肯定会有多个页面的情况，因此添加第二个页面或者更多页面的情况下，需要执行spon mb add命令，输入需要添加的页面的名称即可。
#### add命令只针对page工程。
## 调试模式 
dev命令则在本地开启服务器，默认实现了livereload功能，在开发page工程的时候可以在本地进行调试。
dev命令可以手动指定tcp端口号和livereload端口号，如 spon  mb dev -p 8080 -r 29909
#### dev命令只针对page工程
## 本地构建和测试
针对移动端项目开发，采用commonJS规范，编写的格式完全按照npm模块的方式书写，这样不管在以后node模块复用还是进行后端（node端）模板渲染的情况下，更方便的迁移。但是commonJS规范是针对服务端的规范，而前端的代码都是通过网络加载，因此如果仅仅在浏览器端采用原始的commonJS肯定会出现“undefined”错误，所以，有了这步的build。当然，build并不仅仅是引入依赖，还有完成代码的相关检查，如js的书写规范，less的编译等。
本地build的作用就是将js中引用的其他模块合并到当前js的数组中，依次加载所有的依赖数组中的项即可完成依赖的加载。
命令很简单，就是执行`spon mb build`即可。需要注意的是，在调试情况下，每次修改源码之后，都需要进行build，build之后再开启本地服务器进行浏览器端的测试。这样做的原因很简单，就是源码一旦改变，必须重新构建出新的代码进行测试，否则并没有更新。
#### build命令只针对page工程，对于component而言，没有必要进行构建，因为我们会在page工程中的js文件引用component，这样在page工程中构建就完全将component工程的代码引入并压缩了。
## 测试
编写的代码不仅仅逻辑上需要打通，更需要高可靠性。所谓的单元测试往往针对后端的代码，如java的jUnit测试框架，保证接口的可靠性，以及高覆盖率。而针对前端的代码，我们也需要进行单元测试，前端的测试可以通过通过自己debug完成，但是更为规范的仍是采用测试框架来完成。目前已着手开始开发前端代码测试模块，未来可以通过`spon mb test`的命令完成某个模块的测试。
## 发布
构建并测试完毕之后发布：  
   1，spon mb publish （发布当前mb工程之测试环境，地址为 assets.showjoy.net/${groups}/${project}/${path}）  
   2，spon mb publish －o （发布之线上环境）
#### 执行publish操作，会默认先执行build操作，build完成之后，会需要开发者输入相关的信息和发布的标签号，在这里信息需要输入有实际意义的信息，而标签号则须遵循规范，如果发布至线上环境，格式为`publish/x.x.x`；发布至测试环境，格式为`dev/x.x.x`。一旦格式正确，则会进入服务端的发布流程，完成最终的发布。
## 升级
在page工程的根目录，可以看到一个mobi.json文件，该文件作用就是记录了在初始化（spon mb init）该page工程时的所有的线上模块版本号，该文件保存在服务端。一旦有新的模块发布或者原有的模块发生改动，服务端的文件会更新，而我们当前的page工程的mobi.json并不会更新，意味着在该工程下，我们无法require新的模块。解决这种情况的方式有两种：  
1.  手动修改添加变动的模块及依赖  
2.  通过`spon mb upgrade`更新mobi.json
这样，完成了模块的版本控制，也实现了在原有的工程使用更新的模块。

## FAQ
### 1. 命令行spon的调用，必须在工程的根目录。
ex: gitlab上创建一个新的仓库abc，在客户端执行git clone git@git.showjoy.net:showjoy-assets/abc-m.git,会出现一个空的abc-m目录，
然后`cd abc-m`，在这里，就是所谓的工程的根目录。所有的命令行必须在根目录执行，否则会出现file not found等错误。
### 2. 组件的引用方式require('fecomponent/mobi-${name}')
有不少同学和我提到了为什么在引用组件时，非得在组件名称前加上`mobi-`这个前缀，原因就是为了以后的兼容性。目前仅仅针对移动端的工程做迁移，因此fecomponent组中的组件自然都是移动端的组件，而在未来pc的工程肯定也会进行拆分，这样我们在js文件中仅仅require
### 3. component的修改
ex:我刚刚接到一个需求，即"针对fecomponent组的jswebview组件做一次升级：原来的jswebview中require了两个模块，即zepto-callbacks和zepto-deferred。但是由于去全局化的需要，针对mobile段的global.js做拆分，将UA判断的逻辑拿出来放在了一个新的模块下，即detect-ua组件。而jswebview组件也依赖detect-ua组件，因此我们再在代码中require（fecomponent/detect-ua），认为这样就大功告成了。这样是错误的，在构建引入jswebview组件的page工程中会出现错误，原因是找不到'fecomponent/detect-ua'组件。"
#### 解决方案：这是由于服务端的mobi.json并没有更新jswebview组件的依赖。在初始化jswebview组件的时候，我们输入了该组件的依赖，即zepto-callbacks和zepto-deferred。服务端的mobi.json记录了这两个依赖，而当我们手动添加了另一个依赖fecomponent/detect-ua的情况下，jswebview根目录的package.json的dependencies属性并没有改变，因此服务端的mobi.json也就没有更新。所以我们仅需在根目录的package.json中添加正确格式和版本的detect-ua，在执行publish操作，就完成了服务端配置文件的更新！
### 4. .DS_Store文件夹（文件）造成的spon mb build失败
同学们在使用spon mb build进行本地构建的过程中，有可能会出现错误，错误信息中提到了由于src/pages／.DS_Store的存在，导致无法解析该目录的文件。.DS_Store文件时Mac os中用于记录文件夹现实属性的隐藏文件，对于我们的spon而言，这个隐藏目录的存在是不必要的，因此执行 `rm －rf .DS_Store`命令即可。  
### 5. less共用组件的修改
mobile工程的有些页面的less中可能会引入除mixins.less之外的less模块，建议在src/mixins/${name}/${name}.less引用。注意，less模块的路径引用不要出错。
### 6. 引用带有版本号的组件（确保spon的版本号为0.1.3）
ex: 仍以fecomponent/mobi-jswebview组件为例，当前最新的版本为0.0.5，暴露了$.JSBridge的相关接口；而我们的项目却依赖0.0.1版本的jswebview组件，该版本组件并没有$.JSBridge，而是$.Operate接口，此时该如何做呢？
#### 解决方案：由于服务端的mobi.json中记录的jswebview的版本号为最新的0.0.5，因此在业务逻辑的js中以`require('fecomponent/mobi-jswebview')`方式引入会默认引入最新版本，可以通过附加版本号的方式－`require('fecomponent/mobi-jswebview/0.0.1')`引入制定版本号的模块，引入的格式一定要规范！
### 7. spon版本升级到0.1.2后build之前创建的工程出错
##### 方案：是由于版本升级后，对根目录下spon.json做了些扩展。为了保证build旧工程成功，请在根目录下重新执行`spon mb init`，更新spon.json配置文件即可。
### 8. fecomponent模块进阶（确保spon的版本号为0.1.3）
#### 回顾：之前针对组件的开发，主要逻辑都在index.js文件中，而且针对有css（less）引用的组件无能为力。为了保证软件工程中的“单一功能”作用，我们可以将单一的功能拆分成诸多功能模块，放在某个文件夹下，如lib，而在index.js中以相对路径方式引用，这样在组件内部解耦，容易分工开发组件。具体的复杂组件编写模式，可以查看线上实例：fecomponent/mobi-withcss
#### 要点：关于在组件中以引用css（less）和模块，必须以相对路径方式引用，即“./sth.less”的方式。
### 9. 异步渲染模板的功能
#### 针对移动端，目前h5页面并为采用模版异步渲染的机制，这对于开发长列表展示页的性能很不友好。现在在page工程中，集成了模板功能，模板的书写语法就是大家在用的art－template简单语法，这样每次build之后我们就可以在页面上看到引用的模板。

#### 在spon中，规定模板的后缀为`.tmpl`，也就是说spon会对src目录下的所有.tmpl文件进行解析，并生成对应的js文件。建议每个目录下只有一个tmpl文件，这样做到模板的模块化。
在js中，可以这样引用模板：

showjoy模板:
```
<h1>{{title}}</h1>
<p>{{titleDesc}}</p>
```

```
var tmpl = require('./showjoy');
$('main').html(tmpl({
  title: 'this is the art-template example',
  titleDesc: 'nothing to say!'
}));
```
### 10. spon集成showjoy-assets/portal的发布功能
#### 简介： spon在0.1.6版本提供了portal的发布功能，命令如下：
`spon pc publish (-o)` 对应 `发布至测试（线上）`

### 11. 本地营销页面spon工程
#### 营销页面目前没有统一的远程仓库地址，在本地执行`spon mb init`命令创建工程时会出现错误。正确方式是先去自己的gitlab创建一个仓库，再讲仓库`clone`下来。本地进入这个仓库就可执行`spon mb init`命令创建工程。

### 12. rem布局规范
#### 0.1.10版本的spon添加了rem插件，该插件作用可以让rem的大小自适应。rem插件必须与flexible.js文件匹配（http://cdn1.showjoy.com/assets/f2e/joyf2e/vendor/0.0.6/flexible/flexible-min.js），目前公司使用的flexible是将设计稿插件针对的750px的设计稿，因此，在设计稿上一个banner的宽度是750px，可以在less中这样定义：
`
.banner{
  width: 750px;
  font-size: 16px;
}
`
这样，使用spon mb rem之后，会计算成
`
.banner{
  width: 10rem;
  font-size: 16px;
}
`
当然，现实情况中不回有这么简单的情况，举个例子：
设计师往往给我们视觉稿中有1px的边框要求，如果还是简单的采用rem放缩，那么肯定最终在终端的呈现效果很有可能不是1px。那么，如何避免呢？有些同学可能有了解决方案，如高分屏下设置0.5px，或者使用tramsform进行scale缩小，但这都是基于px为前提的。因此我们需要针对某些属性放弃使用rem变换，当然也有可能需要我们手动添加某些属性使用rem变换，这取决于项目的具体需求。
目前，spon工具默认针对以下css属性做rem判断：

'font','font-size','line-height', 'letter-spacing','text-indent','word-spacing','width','height','max-height','max-width','min-height','min-width','left','top','right','bottom','margin','margin-left','margin-top','margin-right','margin-bottom','padding','padding-left','padding-top','padding-right','padding-bottom','background','background-position',
'vertical-align'

如果想针对某个属性放弃使用rem变换，spon已实现黑名单机制，我们可以使用`spon mb rem -b 'height border font-size line-height'`命令，“height，border，font-size，line-height”几个属性就不会进行rem变换；
同理，如果有些css属性需要进行rem变换，但是spon默认并未针对该属性做rem变换，需要我们手动将这些属性加入白名单中，如`spon mb rem -w "margin padding-top"`；
#### 另外，spon工程可能会有多个页面，而每个页面可能由于历史遗留问题并未采用rem布局，为了避免不可预知的变换问题，因此十分建议`在page工程中，只针对单一工程进行rem变换`，正如下面命令：
`spon mb rem -n 'abc'`,只针对abc页面的相关less做变换，安全有效。
最后，对于如下的css样式：

.abc {
  width: 750px;
  font-size: 16px;
  line-height: 16px;
  height: 50px;
  border: 1px solid red;
  margin: 10px 5px 5px 10px;
  padding-top: 20px;
}

使用` spon mb rem -n art-tmpl -w "margin padding-top" -b 'height border font-size line-height' `,就可以按照自定义设置完成转换，转换后的结果如下：

.abc {
  width: 10rem;
  font-size: 16px;
  line-height: 16px;
  height: 50px;
  border: 1px solid red;
  margin: 0.1333rem 0.0667rem 0.0667rem 0.1333rem;
  padding-top: 0.2667rem;
}

最后的最后哦，在使用rem插件时，每当我们执行spon mb rem后会有交互，在此确认可能的后果，以免造成不必要的损失！！！！

### 13. pc端工具链打通
#### 命令一览：
####   spon pc init (-c);
####   spon pc add;
####   spon pc build
####   spon pc dev -p 8888 -l 12334;
####   spon pc publish (-o);
####   spon pc upgrade;

# CHANGELOG

- v0.1.3
  添加了版本号引用组件；
  

- v0.1.4
  增加模版渲染引擎，针对src/pages下的所有`.tmpl`文件进行预编译
  可创建ui组件，并相对路径引用模块

- v0.1.5
  针对src下的less文件进行watcher，方便开发时调试样式

- v0.1.6
  针对尚未重构的showjoy-assets/portal 工程添加发布功能

- v0.1.7
  针对pages工程，添加了src/components中的模块引用线上组件的功能
  内部实现了线上组件缓存功能

- v0.1.8
  针对fecomponent组件中的less，可以循环引用，即less中可通过@import递归加载

- v0.1.9
  完成部分重构，集成rem插件（待修改，做过渡使用，建议不要采用该版本的rem插件）

- v0.1.10
  丰富了rem插件，集成许多复杂功能

- v0.1.11
  修改了rem插件的小问题，并完美适配当前前端切图规范（在使用rem插件时，必须修改引用的flexibal.js，使用新的布局脚本）

- v0.1.12（不要使用该版本，作为过渡）
  bug修复，task顺序重新调整

- v0.1.13
  bug修复

- v0.1.14
  pc端工具链打通，针对pc端的操作和mobile端对应

- v0.2.0
  spon彻底重构，添加插件选项，并且配置别名服务，另外，该版本下的发布publish操作默认取消了build选项，这意味着每次发布之前需要手动进行构建page工程，不要疏忽！ 另外，spon插件规范及别名使用!!!

- v0.2.1
  添加相关依赖

- v0.2.2
  解决模块解析遗留问题（注释删除）

- v0.2.3
  解决js解析时的AST构建问题（注释模块）

- v0.2.4
  增加维护者“南洋”

- v0.2.5
  增加对指定页面进行build工程

- v0.2.6
  针对rem插件做了diff对比，目前仍在测试阶段，欢迎找bug 修改重构后的遗留问题，spon主目录创建问题

- v0.2.7
  1、添加js，less文件代码规范检查
  2、更新新添加page时的初始html文件

- v0.2.8
  修改 eslint.json 配置文件,放宽规则限制

- v0.2.9
  添加 eslint的依赖

- v0.2.10
  lint规则放宽
  sourceMap链接错误解决
  spon commit（cmt）集成，规范化提交内容
  spon性能优化，采用懒加载
  tty输出信息优化

- v0.2.11
  该版本发布时同时发布了两个XSS检测组件，欢迎大家使用
  修复了模板编译产生临时文件的bug
  修复了因存在隐藏文件导致构建失败的隐藏问题

- v0.2.12
  修复less编译的似有前缀消失的问题，该版本之后可以在less中只写原属性，不用再写其他的私有头部，如“-webkit-,-ms-”

- v0.2.13
  修复less文件watcher编译的似有前缀问题

- v0.2.14
  针对组件初始化添加README.md
  spon插件安装使用npm，放弃原先的cnpm
  针对page工程，初始化img文件夹，用于存放开发过程中的图片
  放松eslint的规范限定
  修复加载spon插件出现“*****加载插件失败,请检查插件目录*****”文字的错误

- v0.2.15
  eslint.json语法修改

- v0.2.16
  rem插件重新实现，放弃diff算法，直接正则匹配

- v0.2.17
  删除初始化安装操作
  修复sj-conventional-changelog包

