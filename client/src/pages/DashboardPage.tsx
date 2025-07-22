import React from 'react';
import { Row, Col, Card, Statistic, List, Tag, Typography } from 'antd';
import { FolderOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useQuery } from 'react-query';
import { repositoryService } from '../services/repositoryService';
import { userService } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title } = Typography;

const DashboardPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  
  const { data: repositories = [] } = useQuery(
    'repositories',
    repositoryService.list
  );

  const { data: users = [] } = useQuery(
    'users',
    userService.list,
    { enabled: isAdmin }
  );

  const recentRepos = [...repositories]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 5);

  return (
    <div>
      <Title level={2}>Dashboard</Title>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Repositories"
              value={repositories.length}
              prefix={<FolderOutlined />}
            />
          </Card>
        </Col>
        {isAdmin && (
          <Col span={8}>
            <Card>
              <Statistic
                title="Total Users"
                value={users.length}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
        )}
        <Col span={isAdmin ? 8 : 16}>
          <Card>
            <Statistic
              title="Your Role"
              value={user?.role.toUpperCase()}
              valueStyle={{ color: user?.role === 'admin' ? '#3f8600' : '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Recent Repositories">
        <List
          dataSource={recentRepos}
          renderItem={(repo) => (
            <List.Item>
              <List.Item.Meta
                avatar={<FolderOutlined style={{ fontSize: 24 }} />}
                title={
                  <a href={`/repositories/${repo.name}`}>{repo.name}</a>
                }
                description={
                  <div>
                    {repo.description || 'No description'}
                    <div style={{ marginTop: 4 }}>
                      <Tag icon={<ClockCircleOutlined />}>
                        {dayjs(repo.created_at).fromNow()}
                      </Tag>
                      {repo.created_by_username && (
                        <Tag icon={<UserOutlined />}>
                          {repo.created_by_username}
                        </Tag>
                      )}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
          locale={{emptyText: (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              No repositories yet
            </div>
          )}}
        />
      </Card>
    </div>
  );
};

export default DashboardPage;