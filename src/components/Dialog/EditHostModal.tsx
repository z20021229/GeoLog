'use client';

import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { InputField } from '../ui/InputField';
import { PasswordField } from '../ui/PasswordField';
import { HostConfig } from '../../types';
import { testHostConnection, testDatabaseConnection } from '../../lib/api';

interface EditHostModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: HostConfig) => void;
  initialData?: HostConfig;
}

// 表单验证规则
const hostConfigSchema = z.object({
  ip: z.string()
    .min(1, '主机IP不能为空')
    .regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, '请输入有效的IP地址'),
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
  dbDriver: z.enum(['GaussDB', 'PostgreSQL', 'MySQL']),
  dbUser: z.string().min(1, '数据库用户名不能为空'),
  dbPassword: z.string().min(1, '数据库密码不能为空'),
});

type HostConfigFormData = z.infer<typeof hostConfigSchema>;

const EditHostModal: React.FC<EditHostModalProps> = ({ open, onClose, onSave, initialData }) => {
  const [hostTestStatus, setHostTestStatus] = useState<'idle' | 'testing' | 'success'>('idle');
  const [dbTestStatus, setDbTestStatus] = useState<'idle' | 'testing' | 'success'>('idle');
  const [toast, setToast] = useState<{ message: string; type: 'success' } | null>(null);

  // 使用 react-hook-form 管理表单
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<HostConfigFormData>({
    resolver: zodResolver(hostConfigSchema),
    defaultValues: initialData || {
      ip: '',
      username: '',
      password: '',
      dbDriver: 'GaussDB',
      dbUser: '',
      dbPassword: '',
    },
  });

  // 监听表单值变化
  const formValues = watch();

  // 监听IP输入变化，实现智能默认值填充
  React.useEffect(() => {
    // 使用正则匹配10.168.网段
    if (/^10\.168\./.test(formValues.ip)) {
      // 自动填入默认用户名'root'
      setValue('username', 'root');
      // 默认选中第一个数据库驱动
      setValue('dbDriver', 'GaussDB');
    }
  }, [formValues.ip, setValue]);

  const showToast = (message: string, type: 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleHostTest = async () => {
    setHostTestStatus('testing');
    
    try {
      // 使用正则匹配10.168.网段
      if (/^10\.168\./.test(formValues.ip)) {
        // 模拟1.5秒加载
        await new Promise(resolve => setTimeout(resolve, 1500));
        setHostTestStatus('success');
      } else {
        const result = await testHostConnection(
          formValues.ip,
          formValues.username,
          formValues.password
        );
        
        if (result.success) {
          setHostTestStatus('success');
        }
      }
    } catch (error) {
      setHostTestStatus('idle');
    }
  };

  const handleDbTest = async () => {
    setDbTestStatus('testing');
    
    try {
      // 使用正则匹配10.168.网段
      if (/^10\.168\./.test(formValues.ip)) {
        // 模拟1.5秒加载
        await new Promise(resolve => setTimeout(resolve, 1500));
        setDbTestStatus('success');
      } else {
        const result = await testDatabaseConnection(
          formValues.ip,
          formValues.username,
          formValues.password,
          formValues.dbDriver,
          formValues.dbUser,
          formValues.dbPassword
        );
        
        if (result.success) {
          setDbTestStatus('success');
        }
      }
    } catch (error) {
      setDbTestStatus('idle');
    }
  };

  const onSubmit: SubmitHandler<HostConfigFormData> = (data) => {
    onSave(data);
    onClose();
  };

  return (
    <>
      {/* Toast 提示 */}
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-in fade-in-0 slide-in-from-top-5">
          {toast.message}
        </div>
      )}

      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="w-[600px] max-w-[90vw] bg-white rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle>{initialData ? '编辑主机' : '添加主机'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-4">
            {/* 主机IP */}
            <InputField
              label="主机IP"
              id="ip"
              required
              placeholder="输入主机IP"
              {...register('ip')}
            />
            {errors.ip && (
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-3"></div>
                <p className="col-span-9 text-xs text-red-500">{errors.ip.message}</p>
              </div>
            )}

            {/* 用户名 */}
            <InputField
              label="用户名"
              id="username"
              required
              placeholder="输入用户名"
              {...register('username')}
            />
            {errors.username && (
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-3"></div>
                <p className="col-span-9 text-xs text-red-500">{errors.username.message}</p>
              </div>
            )}

            {/* 密码 */}
            <PasswordField
              label="密码"
              id="password"
              required
              placeholder="输入密码"
              {...register('password')}
            />
            {errors.password && (
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-3"></div>
                <p className="col-span-9 text-xs text-red-500">{errors.password.message}</p>
              </div>
            )}

            {/* 测试主机按钮 */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-3"></div>
              <button
                type="button"
                onClick={handleHostTest}
                className="col-span-9 text-left text-sm text-blue-600 hover:text-blue-800"
              >
                {hostTestStatus === 'testing' ? (
                  <>
                    <Loader2 size={16} className="inline mr-1 animate-spin" /> 测试中...
                  </>
                ) : hostTestStatus === 'success' ? (
                  <>
                    <Check size={16} className="inline mr-1 text-green-500" /> 测试主机 正常
                  </>
                ) : (
                  '测试主机'
                )}
              </button>
            </div>

            {/* 数据库驱动 */}
            <div className="grid grid-cols-12 gap-4 items-center">
              <label htmlFor="dbDriver" className="col-span-3 text-right font-medium">
                <span className="text-red-500 mr-1">*</span>选择数据库驱动
              </label>
              <Select
                value={formValues.dbDriver}
                onValueChange={(value) => setValue('dbDriver', value as HostConfig['dbDriver'])}
              >
                <SelectTrigger id="dbDriver" className="focus:ring-blue-500">
                  <SelectValue placeholder="选择数据库驱动" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GaussDB">GaussDB 505.2.1</SelectItem>
                  <SelectItem value="PostgreSQL">PostgreSQL</SelectItem>
                  <SelectItem value="MySQL">MySQL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 数据库用户名 */}
            <InputField
              label="数据库用户名"
              id="dbUser"
              required
              placeholder="输入数据库用户名"
              {...register('dbUser')}
            />
            {errors.dbUser && (
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-3"></div>
                <p className="col-span-9 text-xs text-red-500">{errors.dbUser.message}</p>
              </div>
            )}

            {/* 数据库密码 */}
            <PasswordField
              label="数据库密码"
              id="dbPassword"
              required
              placeholder="输入数据库密码"
              {...register('dbPassword')}
            />
            {errors.dbPassword && (
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-3"></div>
                <p className="col-span-9 text-xs text-red-500">{errors.dbPassword.message}</p>
              </div>
            )}

            {/* 测试数据库按钮 */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-3"></div>
              <button
                type="button"
                onClick={handleDbTest}
                className="col-span-9 text-left text-sm text-blue-600 hover:text-blue-800"
              >
                {dbTestStatus === 'testing' ? (
                  <>
                    <Loader2 size={16} className="inline mr-1 animate-spin" /> 测试中...
                  </>
                ) : dbTestStatus === 'success' ? (
                  <>
                    <Check size={16} className="inline mr-1 text-green-500" /> 测试数据库 正常
                  </>
                ) : (
                  '测试数据库'
                )}
              </button>
            </div>
          </form>
          
          <DialogFooter className="border-t p-4">
            <Button variant="secondary" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" onClick={handleSubmit(onSubmit)}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditHostModal;