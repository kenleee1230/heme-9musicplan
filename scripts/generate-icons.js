// 生成图标脚本
// 需要安装: npm install sharp --save-dev

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const iconSizes = [16, 32, 192, 512, 180]; // 180 for apple-touch-icon
const inputSvg = path.join(__dirname, '../public/icons/icon.svg');
const outputDir = path.join(__dirname, '../public/icons');

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  console.log('开始生成图标...');
  
  for (const size of iconSizes) {
    const outputFile = path.join(outputDir, size === 180 ? 'apple-touch-icon.png' : `icon-${size}x${size}.png`);
    
    try {
      await sharp(inputSvg)
        .resize(size, size)
        .png()
        .toFile(outputFile);
      
      console.log(`✓ 生成 ${outputFile} (${size}x${size})`);
    } catch (error) {
      console.error(`✗ 生成 ${outputFile} 失败:`, error.message);
    }
  }
  
  // 生成 favicon.ico (16x16)
  const faviconPath = path.join(__dirname, '../public/favicon.ico');
  try {
    await sharp(inputSvg)
      .resize(16, 16)
      .png()
      .toFile(faviconPath.replace('.ico', '-temp.png'));
    
    // 注意：真正的 .ico 文件需要特殊处理，这里先创建 PNG
    // 如果需要真正的 .ico，可以使用 toIco 库或在线工具转换
    console.log(`✓ 生成 favicon (16x16 PNG)`);
    console.log(`  提示：如需 .ico 格式，请使用在线工具将 favicon-16x16.png 转换为 .ico`);
  } catch (error) {
    console.error(`✗ 生成 favicon 失败:`, error.message);
  }
  
  console.log('\n图标生成完成！');
}

// 运行生成
generateIcons().catch(error => {
  console.error('生成图标时出错:', error);
  process.exit(1);
});

