PROGRAM = $(notdir $(CURDIR))
BINPATH = /usr/local/lib/node_modules/spon
install:
	@echo 初始化环境
	@-sudo rm /usr/local/bin/spon
	@echo 项目构建
	@-sudo mkdir -p $(BINPATH)
	@-sudo cp -rf $(CURDIR)/* $(BINPATH)/ 
	@echo 创建软连接
	@sudo ln -s $(BINPATH)/bin/spon.js /usr/local/bin/spon
	@echo 依赖加载
	@-cd $(BINPATH);sudo npm install
	@echo 权限设定
	@-chmod +x /usr/local/bin/spon
	@-sudo rm -rf $(CURDIR) $(CURDIR).tar.gz
	@echo
	@echo
	@echo 安装完毕，请执行‘spon’命令查看使用说明

