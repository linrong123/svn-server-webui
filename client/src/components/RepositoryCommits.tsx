import React from 'react';
import { List, Card, Tag, Typography, Spin, message, Empty, Button } from 'antd';
import { UserOutlined, ClockCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQuery } from 'react-query';
import { repositoryService } from '../services/repositoryService';
import dayjs from 'dayjs';

const { Text, Paragraph } = Typography;

interface RepositoryCommitsProps {
  repositoryName: string;
}

const RepositoryCommits: React.FC<RepositoryCommitsProps> = ({ repositoryName }) => {
  const { data: commits = [], isLoading, refetch } = useQuery(
    ['repository-commits', repositoryName],
    () => repositoryService.getCommitLog(repositoryName, 50),
    {
      onError: (error: any) => {
        message.error(error.response?.data?.error?.message || 'Failed to load commits');
      },
    }
  );

  if (isLoading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (commits.length === 0) {
    return (
      <Card>
        <Empty description="No commits yet" />
      </Card>
    );
  }

  return (
    <Card
      title="Recent Commits"
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={() => refetch()}
        >
          Refresh
        </Button>
      }
    >
      <List
        itemLayout="vertical"
        dataSource={commits}
        renderItem={(commit) => (
          <List.Item>
            <List.Item.Meta
              title={
                <div>
                  <Tag color="blue">r{commit.revision}</Tag>
                  <Text strong>{commit.message || 'No message'}</Text>
                </div>
              }
              description={
                <div>
                  <Tag icon={<UserOutlined />}>{commit.author}</Tag>
                  <Tag icon={<ClockCircleOutlined />}>
                    {dayjs(commit.date).format('YYYY-MM-DD HH:mm:ss')}
                  </Tag>
                </div>
              }
            />
            {commit.changes && commit.changes.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">Changes:</Text>
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: 8, 
                  borderRadius: 4,
                  marginTop: 4,
                  fontSize: 12,
                  overflow: 'auto'
                }}>
                  {commit.changes.join('\n')}
                </pre>
              </div>
            )}
          </List.Item>
        )}
      />
    </Card>
  );
};

export default RepositoryCommits;