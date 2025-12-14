#!/bin/bash
# 加载 nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 切换到项目目录
cd "$(dirname "$0")"

# 读取 .nvmrc 文件中的 Node.js 版本
if [ -f .nvmrc ]; then
    NODE_VERSION=$(cat .nvmrc)
    echo "安装 Node.js 版本: $NODE_VERSION"
    nvm install "$NODE_VERSION"
    nvm use "$NODE_VERSION"
else
    echo "未找到 .nvmrc 文件，安装 Node.js 18 LTS"
    nvm install 18
    nvm use 18
fi

# 显示 Node.js 和 npm 版本
echo "Node.js 版本: $(node --version)"
echo "npm 版本: $(npm --version)"

# 安装项目依赖
echo "正在安装项目依赖..."
npm install --legacy-peer-deps

echo "环境设置完成！"

