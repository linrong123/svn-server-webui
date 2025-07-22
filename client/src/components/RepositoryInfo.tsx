import React from 'react';
import { Descriptions, Card, Tag } from 'antd';
import { Repository } from '../types';
import dayjs from 'dayjs';

interface RepositoryInfoProps {
  repository: Repository;
}

const RepositoryInfo: React.FC<RepositoryInfoProps> = ({ repository }) => {
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
          <code>http://[服务器IP]/svn/{repository.name}</code>
        </Descriptions.Item>
        <Descriptions.Item label="命令示例">
          <code>svn checkout http://[服务器IP]/svn/{repository.name}</code>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default RepositoryInfo;