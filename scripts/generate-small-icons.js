// 生成小尺寸图标
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputSvg = path.join(__dirname, '../public/icons/icon.svg');
const outputDir = path.join(__dirname, '../public/icons');

async function generateSmallIcons() {
  console.log('生成小尺寸图标...');
  
  // 生成 16x16
  try {
    await sharp(inputSvg)
      .resize(16, 16)
      .png()
      .toFile(path.join(outputDir, 'icon-16x16.png'));
    console.log('✓ 生成 icon-16x16.png');
  } catch (error) {
    console.error('✗ 生成 icon-16x16.png 失败:', error.message);
  }
  
  // 生成 32x32
  try {
    await sharp(inputSvg)
      .resize(32, 32)
      .png()
      .toFile(path.join(outputDir, 'icon-32x32.png'));
    console.log('✓ 生成 icon-32x32.png');
  } catch (error) {
    console.error('✗ 生成 icon-32x32.png 失败:', error.message);
  }
  
  console.log('完成！');
}

generateSmallIcons().catch(console.error);

