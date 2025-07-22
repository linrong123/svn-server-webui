import React, { useState } from 'react';
import { Tree, Card, Spin, message, Empty, Button, Modal } from 'antd';
import { FileOutlined, FolderOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { repositoryService } from '../services/repositoryService';
import { TreeNode } from '../types';
import FileViewer from './FileViewer';
import type { DataNode } from 'antd/es/tree';

interface RepositoryBrowserProps {
  repositoryName: string;
}

const RepositoryBrowser: React.FC<RepositoryBrowserProps> = ({ repositoryName }) => {
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>(['/']);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileModalVisible, setFileModalVisible] = useState(false);

  const { data: tree, isLoading, refetch } = useQuery({
    queryKey: ['repository-tree', repositoryName],
    queryFn: () => repositoryService.browse(repositoryName, '/'),
  });

  React.useEffect(() => {
    if (tree === undefined && !isLoading) {
      message.error('Failed to load repository tree');
    }
  }, [tree, isLoading]);

  const convertToAntdTree = (node: TreeNode): DataNode => {
    const isDirectory = node.type === 'directory';
    return {
      title: node.name,
      key: node.path,
      icon: isDirectory ? <FolderOutlined /> : <FileOutlined />,
      isLeaf: !isDirectory,
      children: node.children?.map(convertToAntdTree),
    };
  };

  const handleSelect = (_selectedKeys: React.Key[], info: any) => {
    const node = info.node;
    if (node.isLeaf) {
      setSelectedFile(node.key as string);
      setFileModalVisible(true);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!tree || (tree.children && tree.children.length === 0)) {
    return (
      <Card>
        <Empty description="Repository is empty" />
      </Card>
    );
  }

  const treeData = tree.children?.map(convertToAntdTree) || [];

  return (
    <>
      <Card
        title="Repository Browser"
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        }
      >
        <Tree
          showIcon
          defaultExpandAll
          expandedKeys={expandedKeys}
          onExpand={setExpandedKeys}
          onSelect={handleSelect}
          treeData={treeData}
        />
      </Card>

      <Modal
        title={selectedFile}
        open={fileModalVisible}
        onCancel={() => setFileModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedFile && (
          <FileViewer
            repositoryName={repositoryName}
            filePath={selectedFile}
          />
        )}
      </Modal>
    </>
  );
};

export default RepositoryBrowser;