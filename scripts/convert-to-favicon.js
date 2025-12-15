// 将图片转换为网站 favicon 和 logo
// 使用方法: node scripts/convert-to-favicon.js <图片路径>
// 例如: node scripts/convert-to-favicon.js ./my-logo.png

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 从命令行参数获取图片路径
const imagePath = process.argv[2];

if (!imagePath) {
  console.error('❌ 请提供图片路径');
  console.log('使用方法: node scripts/convert-to-favicon.js <图片路径>');
  console.log('例如: node scripts/convert-to-favicon.js ./my-logo.png');
  process.exit(1);
}

// 检查文件是否存在
const fullImagePath = path.resolve(process.cwd(), imagePath);
if (!fs.existsSync(fullImagePath)) {
  console.error(`❌ 文件不存在: ${fullImagePath}`);
  process.exit(1);
}

const outputDir = path.join(__dirname, '../public/icons');
const publicDir = path.join(__dirname, '../public');

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 需要生成的图标尺寸
const iconSizes = [
  { size: 16, name: 'icon-16x16.png' },
  { size: 32, name: 'icon-32x32.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' }
];

async function convertToFavicon() {
  console.log(`\n🖼️  开始转换图片: ${imagePath}`);
  console.log(`📁 输出目录: ${outputDir}\n`);

  try {
    // 读取并验证图片
    const metadata = await sharp(fullImagePath).metadata();
    console.log(`✓ 图片信息: ${metadata.width}x${metadata.height}, 格式: ${metadata.format}\n`);

    // 生成各种尺寸的图标
    for (const { size, name } of iconSizes) {
      const outputFile = path.join(outputDir, name);
      
      try {
        await sharp(fullImagePath)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 } // 透明背景
          })
          .png()
          .toFile(outputFile);
        
        console.log(`✓ 生成 ${name} (${size}x${size})`);
      } catch (error) {
        console.error(`✗ 生成 ${name} 失败:`, error.message);
      }
    }

    // 生成 SVG favicon (从原图创建简化版本)
    try {
      // 创建一个简单的 SVG favicon
      // 如果原图是 SVG，直接复制；否则创建一个包含图片引用的 SVG
      const svgFaviconPath = path.join(publicDir, 'favicon.svg');
      
      if (metadata.format === 'svg') {
        // 如果是 SVG，直接复制并优化
        await sharp(fullImagePath)
          .resize(32, 32)
          .toFile(svgFaviconPath.replace('.svg', '-temp.png'));
        
        // 读取 SVG 内容并优化
        const svgContent = fs.readFileSync(fullImagePath, 'utf-8');
        // 简化 SVG（可选：移除不必要的元素）
        fs.writeFileSync(svgFaviconPath, svgContent);
        console.log(`✓ 生成 favicon.svg`);
      } else {
        // 对于非 SVG 图片，创建一个包含 base64 图片的 SVG
        const imageBuffer = fs.readFileSync(fullImagePath);
        const base64Image = imageBuffer.toString('base64');
        const mimeType = `image/${metadata.format}`;
        
        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <image href="data:${mimeType};base64,${base64Image}" width="32" height="32" preserveAspectRatio="xMidYMid meet"/>
</svg>`;
        
        fs.writeFileSync(svgFaviconPath, svgContent);
        console.log(`✓ 生成 favicon.svg`);
      }
    } catch (error) {
      console.error(`✗ 生成 favicon.svg 失败:`, error.message);
    }

    // 生成 favicon.ico (16x16 PNG，因为真正的 .ico 需要特殊处理)
    try {
      const faviconPngPath = path.join(publicDir, 'favicon-temp.png');
      await sharp(fullImagePath)
        .resize(16, 16, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(faviconPngPath);
      
      console.log(`✓ 生成 favicon-temp.png (16x16)`);
      console.log(`  提示：如需 .ico 格式，可以使用在线工具将 favicon-temp.png 转换为 favicon.ico`);
    } catch (error) {
      console.error(`✗ 生成 favicon 失败:`, error.message);
    }

    // 复制原图到 icons 目录作为 icon.svg（如果是 SVG）
    if (metadata.format === 'svg') {
      try {
        const iconSvgPath = path.join(outputDir, 'icon.svg');
        fs.copyFileSync(fullImagePath, iconSvgPath);
        console.log(`✓ 复制 icon.svg`);
      } catch (error) {
        console.error(`✗ 复制 icon.svg 失败:`, error.message);
      }
    }

    console.log('\n✅ 图标生成完成！');
    console.log('\n📝 生成的文件：');
    console.log('   - public/icons/icon-16x16.png');
    console.log('   - public/icons/icon-32x32.png');
    console.log('   - public/icons/icon-192x192.png');
    console.log('   - public/icons/icon-512x512.png');
    console.log('   - public/icons/apple-touch-icon.png');
    console.log('   - public/favicon.svg');
    console.log('   - public/favicon-temp.png');
    if (metadata.format === 'svg') {
      console.log('   - public/icons/icon.svg');
    }
    console.log('\n💡 提示：');
    console.log('   1. 如果需要真正的 .ico 文件，可以使用在线工具转换 favicon-temp.png');
    console.log('   2. 检查 index.html 中的 favicon 引用是否正确');
    console.log('   3. 如果图片背景不是透明的，可能需要调整图片或使用图片编辑工具处理\n');

  } catch (error) {
    console.error('❌ 转换失败:', error.message);
    process.exit(1);
  }
}

// 运行转换
convertToFavicon().catch(error => {
  console.error('❌ 发生错误:', error);
  process.exit(1);
});
