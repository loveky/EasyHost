# EasyHost
一个帮你轻松管理hosts文件的小工具。基于[Electron](http://electron.atom.io/)构建。

### 开始使用
[点此](http://pan.baidu.com/s/1kTrOTWr)下载安装程序，与往日管理hosts文件的痛苦经历说再见。

### 本地开发
*注：如果需要生成Windows安装文件，请先安装[nullsoft scriptable installer](http://nsis.sourceforge.net/Download)*

首先clone本仓库，并安装npm依赖
```shell
git clone https://github.com/loveky/EasyHost.git
cd EasyHost
npm install
```

编辑app目录内文件以增加功能或修复bug，使用以下命令预览：
```shell
npm run dev
```

编辑完成后通过以下命令生成Windows安装文件：
```shell
npm run pack
```
