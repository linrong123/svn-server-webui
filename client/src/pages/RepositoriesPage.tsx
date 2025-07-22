import React, { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Popconfirm, Tag, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, FolderOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { repositoryService } from '../services/repositoryService';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;

const RepositoriesPage: React.FC = () => {
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const { data: repositories = [], isLoading } = useQuery(
    'repositories',
    repositoryService.list
  );

  const createMutation = useMutation(
    (data: { name: string; description?: string }) => 
      repositoryService.create(data.name, data.description),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('repositories');
        message.success('Repository created successfully');
        setCreateModalVisible(false);
        form.resetFields();
      },
      onError: (error: any) => {
        message.error(error.response?.data?.error?.message || 'Failed to create repository');
      },
    }
  );

  const deleteMutation = useMutation(
    (name: string) => repositoryService.delete(name),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('repositories');
        message.success('Repository deleted successfully');
      },
      onError: (error: any) => {
        message.error(error.response?.data?.error?.message || 'Failed to delete repository');
      },
    }
  );

  const handleCreate = async (values: any) => {
    createMutation.mutate(values);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <FolderOutlined />
          <a onClick={() => navigate(`/repositories/${name}`)}>{name}</a>
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => text || '-',
    },
    {
      title: 'Revision',
      dataIndex: 'revision',
      key: 'revision',
      render: (rev: number) => rev ? `r${rev}` : '-',
    },
    {
      title: 'Created By',
      dataIndex: 'created_by_username',
      key: 'created_by_username',
      render: (username: string) => username ? <Tag>{username}</Tag> : '-',
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="primary"
            size="small"
            onClick={() => navigate(`/repositories/${record.name}`)}
          >
            Browse
          </Button>
          {isAdmin && (
            <Popconfirm
              title="Delete Repository"
              description={`Are you sure you want to delete "${record.name}"?`}
              onConfirm={() => deleteMutation.mutate(record.name)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
              >
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={2}>Repositories</Title>
        {isAdmin && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            Create Repository
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={repositories}
        rowKey="name"
        loading={isLoading}
      />

      <Modal
        title="Create Repository"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Form.Item
            name="name"
            label="Repository Name"
            rules={[
              { required: true, message: 'Please input repository name!' },
              { pattern: /^[a-zA-Z0-9_-]+$/, message: 'Only letters, numbers, underscores and hyphens allowed' },
            ]}
          >
            <Input placeholder="my-repository" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} placeholder="Repository description (optional)" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createMutation.isLoading}>
                Create
              </Button>
              <Button onClick={() => setCreateModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RepositoriesPage;