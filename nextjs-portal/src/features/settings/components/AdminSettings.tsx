'use client';

import React, { useState, useEffect } from 'react';
import useStaffStore from '../../staff/store/useStaffStore';
import type { Account } from '../../../types';
import { Modal } from '@/components/Modal';
import { updateUserRoleAction } from '../../staff/actions'; // Import the new action
import { notifications } from '@mantine/notifications';
import { useAppStore } from '@/components/providers/StoreProvider'; // To get current user for auth check
import AdminPointTransactions from './AdminPointTransactions';
import AdminPointsPolicy from './AdminPointsPolicy';
import AdminPointsManager from './AdminPointsManager';

export default function AdminSettings() {
  const [showMemberList, setShowMemberList] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Account | null>(null);
  const [members, setMembers] = useState<Account[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [errorMembers, setErrorMembers] = useState<string | null>(null);

  const staffStore = useStaffStore(); // Get the store instance
  const currentUser = useAppStore('staffSession', (s) => s.currentUser); // Get current user

  useEffect(() => {
    if (showMemberList) {
      const fetchMembers = async () => {
        setIsLoadingMembers(true);
        setErrorMembers(null);
        try {
          const fetchedMembers = await staffStore.getStaffList();
          setMembers(fetchedMembers);
        } catch (err: any) {
          setErrorMembers(err.message || '회원 목록을 불러오는 데 실패했습니다.');
        } finally {
          setIsLoadingMembers(false);
        }
      };
      fetchMembers();
    }
  }, [showMemberList, staffStore]);

  const handleUpdateRole = async (memberUid: string, newPosition: 'admin' | 'buttoner') => {
    if (!window.confirm(`${memberUid} 사용자의 역할을 ${newPosition}으로 변경하시겠습니까?`)) {
      return;
    }
    const result = await updateUserRoleAction(memberUid, newPosition);
    try { notifications.show({ color: result.message.includes('성공') ? 'green' : 'red', message: result.message }); } catch {}
    if (result.message.includes('성공적으로')) {
      // Refresh member list after successful update
      const fetchedMembers = await staffStore.getStaffList();
      setMembers(fetchedMembers);
      setSelectedMember(null); // Close modal after update
    }
  };

  const handleViewMemberList = () => {
    setShowMemberList(true);
  };

  const handleMemberClick = (member: Account) => {
    setSelectedMember(member);
  };

  const handleCloseMemberDetails = () => {
    setSelectedMember(null);
  };

  const [tab, setTab] = useState<'members' | 'points'>('members');

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">관리자 설정</h1>
      <p className="meta">필요한 설정 컴포넌트를 여기에 조합하세요.</p>

      <div className="mt-4 flex items-center gap-3 border-b border-border">
        <button className={`py-2 px-3 text-sm ${tab==='members' ? 'border-b-2 border-brand text-ink' : 'text-muted hover:text-ink'}`} onClick={() => setTab('members')}>회원 관리</button>
        <button className={`py-2 px-3 text-sm ${tab==='points' ? 'border-b-2 border-brand text-ink' : 'text-muted hover:text-ink'}`} onClick={() => setTab('points')}>포인트 사용내역</button>
      </div>

      {tab==='members' && (
        <>
          <div className="mt-6">
            <button onClick={handleViewMemberList} className="btn-primary">회원목록 보기</button>
          </div>
          {showMemberList && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">회원 목록</h2>
              {isLoadingMembers && <p>로딩 중...</p>}
              {errorMembers && <p className="text-red-500">오류: {errorMembers}</p>}
              {!isLoadingMembers && members.length === 0 && <p>등록된 회원이 없습니다.</p>}
              {!isLoadingMembers && members.length > 0 && (
                <ul className="border rounded-md divide-y divide-gray-200">
                  {members.map((member) => (
                    <li key={member.uid} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => handleMemberClick(member)}>
                      {member.name} ({member.nickname}) - {member.position}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      {tab==='points' && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AdminPointsManager />
          <AdminPointTransactions />
        </div>
      )}

      {selectedMember && (
        <Modal open={!!selectedMember} onClose={handleCloseMemberDetails} title="회원 정보">
          <div className="p-4">
            <p><strong>이름:</strong> {selectedMember.name}</p>
            <p><strong>닉네임:</strong> {selectedMember.nickname}</p>
            <p><strong>이메일:</strong> {selectedMember.email}</p>
            <p><strong>전화번호:</strong> {selectedMember.phoneNumber}</p>
            <p><strong>직책:</strong> {selectedMember.position}</p>
            <p><strong>입사일:</strong> {selectedMember.employmentStartDate}</p>
            <p><strong>포인트:</strong> {selectedMember.points}</p>
            <p><strong>경험치:</strong> {selectedMember.exp}</p>
          </div>
          <div className="flex justify-end mt-4 gap-2"> {/* Added gap-2 */}
            {currentUser?.position === 'admin' && selectedMember.position !== 'admin' && (
              <button
                onClick={() => handleUpdateRole(selectedMember.uid, 'admin')}
                className="btn-primary"
              >
                관리자로 승격
              </button>
            )}
            {currentUser?.position === 'admin' && selectedMember.position === 'admin' && (
              <button
                onClick={() => handleUpdateRole(selectedMember.uid, 'buttoner')}
                className="btn-secondary"
              >
                일반 회원으로 강등
              </button>
            )}
            <button onClick={handleCloseMemberDetails} className="btn-ghost">닫기</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
