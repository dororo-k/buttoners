import React from 'react';

interface NoticeDetailProps {
  id: string;
}

const NoticeDetail: React.FC<NoticeDetailProps> = ({ id }) => {
  return (
    <div className="notice-detail p-6">
      <h2 className="text-xl font-bold mb-4">공지사항 상세</h2>
      <p>ID: {id}</p>
      <p>이것은 공지사항 상세 페이지의 플레이스홀더입니다.</p>
      {/* 실제 공지사항 내용은 여기에 표시 */}
    </div>
  );
};

export default NoticeDetail;