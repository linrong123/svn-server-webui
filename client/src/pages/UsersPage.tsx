import React, { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, Popconfirm, Tag, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

const UsersPage: React.FC = () => {
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: userService.list,
  });

  const createMutation = useMutation({
    mutationFn: (data: { username: string; password: string; email?: string }) =>
      authService.register(data.username, data.password, data.email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      message.success('User created successfully');
      setCreateModalVisible(false);
      (createForm as any).resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to create user');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      userService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      message.success('User updated successfully');
      setEditModalVisible(false);
      (editForm as any).resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to update user');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => userService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      message.success('User deleted successfully');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to delete user');
    },
  });

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    (editForm as any).setFieldsValue({
      email: user.email,
      role: user.role,
    });
    setEditModalVisible(true);
  };

  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => email || '-',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          {record.id !== currentUser?.id && (
            <Popconfirm
              title="Delete User"
              description={`Are you sure you want to delete "${record.username}"?`}
              onConfirm={() => deleteMutation.mutate(record.id)}
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
        <Title level={2}>Users</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalVisible(true)}
        >
          Create User
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={isLoading}
      />

      <Modal
        title="Create User"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={(values: { username: string; password: string; email?: string }) => createMutation.mutate(values)}
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[
              { required: true, message: 'Please input username!' },
              { min: 3, message: 'Username must be at least 3 characters' },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Please input password!' },
              { min: 6, message: 'Password must be at least 6 characters' },
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: 'email', message: 'Please input a valid email!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                Create
              </Button>
              <Button onClick={() => setCreateModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Edit User"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={(values: { email?: string; password?: string; role?: string }) =>
            updateMutation.mutate({ id: selectedUser?.id, data: values })
          }
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: 'email', message: 'Please input a valid email!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="password"
            label="New Password"
            rules={[{ min: 6, message: 'Password must be at least 6 characters' }]}
          >
            <Input.Password placeholder="Leave empty to keep current password" />
          </Form.Item>

          <Form.Item name="role" label="Role">
            <Select>
              <Option value="user">User</Option>
              <Option value="admin">Admin</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
                Update
              </Button>
              <Button onClick={() => setEditModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UsersPage;