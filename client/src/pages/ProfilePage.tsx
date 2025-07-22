import React from 'react';
import { Card, Form, Input, Button, message, Typography, Divider } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';

const { Title } = Typography;

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data: { email?: string; password?: string }) =>
      userService.update(user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
      message.success('Profile updated successfully');
      (form as any).resetFields(['password', 'confirmPassword']);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to update profile');
    },
  });

  const handleSubmit = (values: { email?: string; password?: string; confirmPassword?: string }) => {
    const { confirmPassword, ...data } = values;
    const updateData: any = {};
    
    if (data.email !== user?.email) {
      updateData.email = data.email;
    }
    
    if (data.password) {
      updateData.password = data.password;
    }

    if (Object.keys(updateData).length > 0) {
      updateMutation.mutate(updateData);
    } else {
      message.info('No changes to save');
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Title level={2}>Profile</Title>
      
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            username: user?.username,
            email: user?.email,
          }}
        >
          <Form.Item
            name="username"
            label="Username"
          >
            <Input 
              prefix={<UserOutlined />} 
              disabled 
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: 'email', message: 'Please input a valid email!' }]}
          >
            <Input prefix={<MailOutlined />} />
          </Form.Item>

          <Divider>Change Password</Divider>

          <Form.Item
            name="password"
            label="New Password"
            rules={[
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Leave empty to keep current password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={['password']}
            rules={[
              ({ getFieldValue }: any) => ({
                validator(_: any, value: any) {
                  if (!value && !getFieldValue('password')) {
                    return Promise.resolve();
                  }
                  if (getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match!'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Confirm new password"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={updateMutation.isPending}
              block
            >
              Update Profile
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ProfilePage;