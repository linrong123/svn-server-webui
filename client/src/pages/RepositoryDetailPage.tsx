import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, Breadcrumb, Typography, Spin, message } from 'antd';
import { FolderOutlined, HomeOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { repositoryService } from '../services/repositoryService';
import RepositoryBrowser from '../components/RepositoryBrowser';
import RepositoryCommits from '../components/RepositoryCommits';
import RepositoryInfo from '../components/RepositoryInfo';

const { Title } = Typography;
const { TabPane } = Tabs;

const RepositoryDetailPage: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const [activeTab, setActiveTab] = useState('browse');

  const { data: repository, isLoading, error } = useQuery({
    queryKey: ['repository', name],
    queryFn: () => repositoryService.get(name!),
    enabled: !!name,
  });

  React.useEffect(() => {
    if (error) {
      message.error((error as any).response?.data?.error?.message || 'Failed to load repository');
    }
  }, [error]);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !repository) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        Repository not found
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item href="/repositories">
          <HomeOutlined />
          <span>Repositories</span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <FolderOutlined />
          <span>{name}</span>
        </Breadcrumb.Item>
      </Breadcrumb>

      <Title level={2}>{name}</Title>
      {repository.description && (
        <p style={{ fontSize: 16, marginBottom: 24 }}>{repository.description}</p>
      )}

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Browse" key="browse">
          <RepositoryBrowser repositoryName={name!} />
        </TabPane>
        <TabPane tab="Commits" key="commits">
          <RepositoryCommits repositoryName={name!} />
        </TabPane>
        <TabPane tab="Info" key="info">
          <RepositoryInfo repository={repository} />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default RepositoryDetailPage;