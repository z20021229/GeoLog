'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import EditHostModal from '@/components/Dialog/EditHostModal';
import { HostConfig } from '@/types';

const HostPage: React.FC = () => {
  const [hosts, setHosts] = useState<HostConfig[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHost, setEditingHost] = useState<HostConfig | undefined>(undefined);

  // 生成随机10.168.x.x IP
  const generateRandom10168IP = (): string => {
    const thirdOctet = Math.floor(Math.random() * 256);
    const fourthOctet = Math.floor(Math.random() * 256);
    return `10.168.${thirdOctet}.${fourthOctet}`;
  };

  const handleSaveHost = (data: HostConfig) => {
    // 1. 添加当前输入的IP
    const updatedHosts = [...hosts, data];
    
    // 2. 随机生成2台10.168.x.x网段的虚拟主机
    for (let i = 0; i < 2; i++) {
      updatedHosts.push({
        ip: generateRandom10168IP(),
        username: 'root',
        password: 'password',
        dbDriver: 'GaussDB',
        dbUser: 'root',
        dbPassword: 'password'
      });
    }
    
    setHosts(updatedHosts);
  };

  const handleEditHost = (host: HostConfig) => {
    setEditingHost(host);
    setIsModalOpen(true);
  };

  const handleDeleteHost = (ip: string) => {
    setHosts(hosts.filter(host => host.ip !== ip));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">主机管理</h1>
        <Button onClick={() => {
          setEditingHost(undefined);
          setIsModalOpen(true);
        }}>
          添加主机
        </Button>
      </div>

      <Table>
        <thead>
          <tr>
            <th>主机IP</th>
            <th>用户名</th>
            <th>数据库驱动</th>
            <th>数据库用户名</th>
            <th>检查结果</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {hosts.map((host, index) => (
            <tr key={`${host.ip}-${index}`}>
              <td className="flex items-center">
                {host.ip}
                {/* 为10.168.网段的主机添加蓝色的'实验网段'标签 */}
                {host.ip.startsWith('10.168.') && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                    实验网段
                  </span>
                )}
              </td>
              <td>{host.username}</td>
              <td>{host.dbDriver === 'GaussDB' ? 'GaussDB 505.2.1' : host.dbDriver}</td>
              <td>{host.dbUser}</td>
              <td>
                {host.ip.startsWith('10.168.') ? (
                  <span className="flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></span>
                    <span className="px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                      在线
                    </span>
                  </span>
                ) : (
                  <span className="text-gray-500">离线</span>
                )}
              </td>
              <td>
                <div className="flex space-x-2">
                  <Button variant="secondary" size="sm" onClick={() => handleEditHost(host)}>
                    编辑
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteHost(host.ip)}>
                    删除
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <EditHostModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingHost(undefined);
        }}
        onSave={handleSaveHost}
        initialData={editingHost}
      />
    </div>
  );
};

export default HostPage;