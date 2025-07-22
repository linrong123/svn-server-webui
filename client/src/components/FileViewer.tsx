import React from 'react';
import { Spin, message, Alert } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { repositoryService } from '../services/repositoryService';

interface FileViewerProps {
  repositoryName: string;
  filePath: string;
  revision?: number;
}

const FileViewer: React.FC<FileViewerProps> = ({ repositoryName, filePath, revision }) => {
  const { data: content, isLoading, error } = useQuery({
    queryKey: ['file-content', repositoryName, filePath, revision],
    queryFn: () => repositoryService.getFileContent(repositoryName, filePath, revision),
  });

  React.useEffect(() => {
    if (error) {
      message.error((error as any).response?.data?.error?.message || 'Failed to load file content');
    }
  }, [error]);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description="Failed to load file content"
        type="error"
      />
    );
  }

  const getLanguage = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'jsx',
      ts: 'typescript',
      tsx: 'tsx',
      py: 'python',
      java: 'java',
      c: 'c',
      cpp: 'cpp',
      h: 'c',
      cs: 'csharp',
      php: 'php',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      kt: 'kotlin',
      swift: 'swift',
      m: 'objectivec',
      scala: 'scala',
      sh: 'bash',
      yml: 'yaml',
      yaml: 'yaml',
      json: 'json',
      xml: 'xml',
      html: 'html',
      css: 'css',
      scss: 'scss',
      sql: 'sql',
      md: 'markdown',
    };
    return languageMap[ext || ''] || 'text';
  };

  const language = getLanguage(filePath);

  return (
    <div style={{ maxHeight: '500px', overflow: 'auto' }}>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        showLineNumbers
        wrapLines
      >
        {content || ''}
      </SyntaxHighlighter>
    </div>
  );
};

export default FileViewer;