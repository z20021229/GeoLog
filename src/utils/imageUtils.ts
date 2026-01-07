// 图片处理工具函数

/**
 * 压缩图片并转换为 Base64
 * @param file 图片文件
 * @param maxWidth 最大宽度，默认 800px
 * @param quality 压缩质量，默认 0.6
 * @returns Promise<string> Base64 格式的压缩图片
 */
export const compressAndConvertImage = (file: File, maxWidth: number = 800, quality: number = 0.6): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 检查文件类型
    if (!file.type.match('image.*')) {
      reject(new Error('请选择图片文件'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        // 计算缩放比例
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = Math.round(img.height * ratio);
        }
        
        // 创建 Canvas 并绘制缩放后的图片
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建 Canvas 上下文'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // 转换为 Base64 并压缩
        const compressedDataUrl = canvas.toDataURL(file.type, quality);
        resolve(compressedDataUrl);
      };
      
      img.onerror = (error) => {
        reject(error);
      };
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
  });
};

/**
 * 清除图片的 Base64 前缀，仅返回数据部分
 * @param base64String Base64 字符串
 * @returns string 清除前缀后的 Base64 数据
 */
export const removeBase64Prefix = (base64String: string): string => {
  return base64String.replace(/^data:image\/(png|jpg|jpeg|gif);base64,/, '');
};

/**
 * 获取图片的 MIME 类型
 * @param base64String Base64 字符串
 * @returns string MIME 类型
 */
export const getImageMimeType = (base64String: string): string => {
  const match = base64String.match(/^data:image\/(png|jpg|jpeg|gif);base64,/);
  if (match) {
    return `image/${match[1]}`;
  }
  return 'image/jpeg';
};
