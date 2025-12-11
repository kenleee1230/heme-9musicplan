#!/bin/bash

# Firestore 规则部署脚本
# 用于快速部署 Firestore 安全规则到 Firebase

echo "🔐 Firestore 规则部署脚本"
echo "=========================="
echo ""

# 检查是否安装了 Firebase CLI
if ! command -v firebase &> /dev/null
then
    echo "❌ Firebase CLI 未安装"
    echo ""
    echo "请运行以下命令安装："
    echo "  npm install -g firebase-tools"
    echo ""
    exit 1
fi

echo "✅ Firebase CLI 已安装"
echo ""

# 检查是否已登录
echo "📝 检查登录状态..."
if ! firebase projects:list &> /dev/null
then
    echo "⚠️  未登录 Firebase"
    echo ""
    echo "正在打开登录页面..."
    firebase login
    echo ""
fi

echo "✅ 已登录 Firebase"
echo ""

# 显示当前项目
echo "📋 当前 Firebase 项目："
firebase use
echo ""

# 确认部署
read -p "是否要部署 Firestore 规则? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "🚀 正在部署 Firestore 规则..."
    echo ""
    
    # 部署规则
    firebase deploy --only firestore:rules
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Firestore 规则部署成功！"
        echo ""
        echo "下一步："
        echo "1. 刷新浏览器页面"
        echo "2. 重新登录应用"
        echo "3. 测试同步功能"
        echo ""
        echo "如果仍有问题，请打开 test-firestore-permission.html 进行诊断"
    else
        echo ""
        echo "❌ 部署失败"
        echo ""
        echo "请检查："
        echo "1. firestore.rules 文件是否存在"
        echo "2. 规则语法是否正确"
        echo "3. 是否有网络连接"
        echo "4. Firebase 项目是否正确"
    fi
else
    echo "❌ 已取消部署"
fi

echo ""

