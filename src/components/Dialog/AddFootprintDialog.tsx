'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { FootprintCategory, FootprintFormData } from '../../types';
import { getAddressFromCoordinates } from '../../utils/geocoding';
import { compressAndConvertImage } from '../../utils/imageUtils';

interface AddFootprintDialogProps {
  open: boolean;
  onClose: () => void;
  onAddFootprint: (data: FootprintFormData) => void;
  coordinates: [number, number];
}

const AddFootprintDialog: React.FC<AddFootprintDialogProps> = ({ open, onClose, onAddFootprint, coordinates }) => {
  const [formData, setFormData] = useState<FootprintFormData>({
    name: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: '打卡',
    image: undefined,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageProcessing, setIsImageProcessing] = useState(false);

  // 当坐标变化时，自动获取地址信息
  useEffect(() => {
    if (open && coordinates && (coordinates[0] !== 0 || coordinates[1] !== 0)) {
      const fetchAddress = async () => {
        setIsLoading(true);
        try {
          const addressData = await getAddressFromCoordinates(coordinates);
          if (addressData) {
            setFormData(prev => ({
              ...prev,
              name: addressData.name.split(',').shift() || '',
              location: addressData.address,
            }));
          }
        } catch (error) {
          console.error('获取地址信息失败:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchAddress();
    }
  }, [open, coordinates]);

  // 图片处理函数
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImageProcessing(true);
    try {
      const compressedImage = await compressAndConvertImage(file);
      setFormData(prev => ({ ...prev, image: compressedImage }));
      setImagePreview(compressedImage);
    } catch (error) {
      console.error('图片处理失败:', error);
      alert('图片处理失败，请重试');
    } finally {
      setIsImageProcessing(false);
    }
  };

  // 移除图片
  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: undefined }));
    setImagePreview(null);
  };

  // 重置表单
  useEffect(() => {
    if (!open) {
      setFormData({
        name: '',
        location: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: '打卡',
        image: undefined,
      });
      setImagePreview(null);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddFootprint(formData);
    onClose();
  };

  const categories: FootprintCategory[] = ['探店', '户外', '城市', '打卡'];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>添加足迹</DialogTitle>
          <DialogDescription>
            在地图上添加新的足迹记录
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="max-h-[70vh] overflow-y-auto pr-4">
            <div className="space-y-4 py-4">
              {/* 地点名称 */}
              <div className="space-y-2">
                <Label htmlFor="name">地点名称</Label>
                <Input
                  id="name"
                  placeholder="输入地点名称"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* 详细位置 */}
              <div className="space-y-2">
                <Label htmlFor="location">详细位置</Label>
                <Input
                  id="location"
                  placeholder="输入详细位置"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>

              {/* 日期 */}
              <div className="space-y-2">
                <Label htmlFor="date">日期</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              {/* 分类 */}
              <div className="space-y-2">
                <Label htmlFor="category">分类</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as FootprintCategory })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 感受/描述 */}
              <div className="space-y-2">
                <Label htmlFor="description">感受/描述</Label>
                <Textarea
                  id="description"
                  placeholder="分享你的感受..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* 图片上传 */}
              <div className="space-y-2">
                <Label>照片</Label>
                {imagePreview ? (
                  <div>
                    <div className="relative w-full h-40 mt-2 rounded-lg overflow-hidden border">
                      <img
                        src={imagePreview}
                        alt="预览"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={removeImage}
                        className="absolute top-2 right-2"
                      >
                        移除
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      已选择图片，点击"移除"可更换
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Input
                      type="file"
                      id="image"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => document.getElementById('image')?.click()}
                      disabled={isImageProcessing}
                    >
                      {isImageProcessing ? '处理中...' : '选择图片'}
                    </Button>
                    <p className="text-xs text-muted-foreground self-center">
                      支持 JPG、PNG 等格式，最大 5MB
                    </p>
                  </div>
                )}
              </div>

              {/* 坐标信息 */}
              <div className="space-y-2">
                <Label>坐标信息</Label>
                <div className="flex flex-wrap gap-2">
                  <Input
                    placeholder="纬度"
                    value={coordinates[0].toString()}
                    readOnly
                    className="bg-muted flex-1 min-w-[120px]"
                  />
                  <Input
                    placeholder="经度"
                    value={coordinates[1].toString()}
                    readOnly
                    className="bg-muted flex-1 min-w-[120px]"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={onClose}>取消</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddFootprintDialog;
