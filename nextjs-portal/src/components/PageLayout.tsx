import React from 'react';
import PageHeader from './PageHeader';

interface PageLayoutProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({ title, description, children }) => {
  return (
    <div>
      <PageHeader title={title} description={description} />
      {children}
    </div>
  );
};

export default PageLayout;
