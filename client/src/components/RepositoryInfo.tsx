import React, { useMemo } from 'react';
import { Descriptions, Card, Tag, Typography } from 'antd';
import { Repository } from '../types';
import dayjs from 'dayjs';

const { Text } = Typography;

interface RepositoryInfoProps {
  repository: Repository;
}

const RepositoryInfo: React.FC<RepositoryInfoProps> = ({ repository }) => {
  // 动态获取当前访问的主机地址
  const svnBaseUrl = useMemo(() => {
    const host = window.location.hostname;
    // SVN 始终使用 HTTP 协议（因为 mod_dav_svn 配置）
    const protocol = 'http:';
    
    // 端口映射规则：
    // Web UI 端口 -> SVN 端口
    const portMapping: Record<string, string> = {
      '7001': '8090',  // 生产环境常用配置
      '3000': '80',    // 本地开发
      '5000': '80',    // Docker 默认
    };
    
    const webPort = window.location.port || '80';
    const svnPort = portMapping[webPort] || '80';
    
    // 构建 URL，标准端口（80/443）不显示
    const portSuffix = (svnPort === '80' || svnPort === '443') ? '' : `:${svnPort}`;
    return `${protocol}//${host}${portSuffix}`;
  }, []);
  return (
    <Card title="Repository Information">
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Name">{repository.name}</Descriptions.Item>
        <Descriptions.Item label="Description">
          {repository.description || 'No description'}
        </Descriptions.Item>
        <Descriptions.Item label="UUID">
          {repository.uuid || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Latest Revision">
          {repository.revision ? <Tag color="blue">r{repository.revision}</Tag> : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Created By">
          {repository.created_by_username ? (
            <Tag>{repository.created_by_username}</Tag>
          ) : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Created At">
          {repository.created_at
            ? dayjs(repository.created_at).format('YYYY-MM-DD HH:mm:ss')
            : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="访问地址">
          <Text code copyable>{svnBaseUrl}/svn/{repository.name}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="检出命令">
          <Text code copyable>svn checkout {svnBaseUrl}/svn/{repository.name}</Text>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default RepositoryInfo;