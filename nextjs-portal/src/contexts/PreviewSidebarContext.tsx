import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Notice } from '@/types/notice'; // Assuming Notice type is available here

interface PreviewSidebarContextType {
  previewNotice: Notice | null;
  setPreviewNotice: (notice: Notice | null) => void;
  isRightSidebarOpen: boolean;
  setRightSidebarOpen: (isOpen: boolean) => void;
}

const PreviewSidebarContext = createContext<PreviewSidebarContextType | undefined>(undefined);

export const PreviewSidebarProvider = ({ children }: { children: ReactNode }) => {
  const [previewNotice, setPreviewNotice] = useState<Notice | null>(null);
  const [isRightSidebarOpen, setRightSidebarOpen] = useState(false);

  return (
    <PreviewSidebarContext.Provider value={{ previewNotice, setPreviewNotice, isRightSidebarOpen, setRightSidebarOpen }}>
      {children}
    </PreviewSidebarContext.Provider>
  );
};

export const usePreviewSidebar = () => {
  const context = useContext(PreviewSidebarContext);
  if (context === undefined) {
    throw new Error('usePreviewSidebar must be used within a PreviewSidebarProvider');
  }
  return context;
};