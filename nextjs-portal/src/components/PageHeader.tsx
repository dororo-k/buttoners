import React from 'react';

interface PageHeaderProps {
  title?: string;
  description?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description }) => {
  return (
    <header className="mb-6 flex items-baseline gap-4">
      <div>
        {title && <h1 className="text-2xl font-bold">{title}</h1>}
      </div>
      {description && <p className="text-sm text-ink/70">{description}</p>}
    </header>
  );
};

export default PageHeader;
