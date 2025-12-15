// 从 PNG 生成 favicon.ico
// 使用 sharp 生成多尺寸的 ICO 文件

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '../public');
const faviconPngPath = path.join(publicDir, 'favicon-temp.png');
const faviconIcoPath = path.join(publicDir, 'favicon.ico');

async function updateFaviconIco() {
  console.log('\n🔄 更新 favicon.ico...\n');

  // 检查源文件是否存在
  if (!fs.existsSync(faviconPngPath)) {
    console.error('❌ favicon-temp.png 不存在，请先运行转换脚本');
    process.exit(1);
  }

  try {
    // 读取 PNG 文件
    const image = sharp(faviconPngPath);
    const metadata = await image.metadata();
    
    console.log(`✓ 读取源图片: ${metadata.width}x${metadata.height}`);

    // 生成多个尺寸的 PNG（ICO 需要多个尺寸）
    const sizes = [16, 32, 48];
    const buffers = [];

    for (const size of sizes) {
      const buffer = await image
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toBuffer();
      
      buffers.push({ size, buffer });
      console.log(`✓ 生成 ${size}x${size} 版本`);
    }

    // 注意：sharp 不能直接生成 ICO 文件
    // 我们需要使用其他方法或库
    // 这里我们创建一个简单的解决方案：复制 16x16 PNG 作为临时方案
    // 或者使用在线工具转换
    
    // 方案1：直接使用 16x16 PNG 作为 favicon（现代浏览器支持）
    const favicon16 = await image
      .resize(16, 16, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();

    // 由于无法直接生成 ICO，我们使用一个变通方法
    // 将 PNG 复制为 favicon.ico（某些浏览器会接受）
    // 但更好的方法是使用专门的工具
    
    console.log('\n⚠️  注意：sharp 无法直接生成真正的 .ico 文件');
    console.log('   已生成 PNG 格式的 favicon');
    console.log('\n💡 建议：');
    console.log('   1. 使用在线工具将 favicon-temp.png 转换为 favicon.ico');
    console.log('   2. 或者使用 toico 库: npm install toico');
    console.log('   3. 访问: https://convertio.co/png-ico/ 或 https://favicon.io/favicon-converter/');
    
    // 尝试安装并使用 toico（如果可用）
    try {
      const { toIco } = await import('toico');
      const icoBuffer = await toIco(buffers.map(b => b.buffer));
      fs.writeFileSync(faviconIcoPath, icoBuffer);
      console.log('\n✅ 成功生成 favicon.ico！');
    } catch (error) {
      // 如果 toico 不可用，使用 PNG 作为后备
      console.log('\n📝 使用 PNG 作为临时方案...');
      // 将 16x16 PNG 写入 favicon.ico（某些浏览器会接受）
      fs.writeFileSync(faviconIcoPath, favicon16);
      console.log('✅ 已将 16x16 PNG 复制为 favicon.ico');
      console.log('   （建议使用在线工具转换为真正的 ICO 格式）');
    }

  } catch (error) {
    console.error('❌ 更新失败:', error.message);
    process.exit(1);
  }
}

updateFaviconIco().catch(error => {
  console.error('❌ 发生错误:', error);
  process.exit(1);
});
