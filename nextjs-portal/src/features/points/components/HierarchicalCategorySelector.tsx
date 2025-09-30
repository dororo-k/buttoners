import React, { useState } from 'react';

import { CATEGORY_HIERARCHY } from '../data'; // Import CATEGORY_HIERARCHY from data.ts
import { Star, CupSoda, Drumstick, IceCream2, MoreHorizontal } from 'lucide-react';

// 카테고리 이름과 아이콘을 매핑합니다. data.ts의 카테고리명에 맞게 수정할 수 있습니다.
const categoryIcons: { [key: string]: React.ElementType } = {
  '즐겨찾기': Star,
  '음료': CupSoda,
  '음식': Drumstick,
  '디저트류': IceCream2,
  '기타': MoreHorizontal,
};

// '즐겨찾기'를 포함한 1차 카테고리 목록
const primaryCategories = ['즐겨찾기', ...Object.keys(CATEGORY_HIERARCHY)];

// 2차 카테고리로부터 1차 카테고리를 찾는 헬퍼 함수
const findPrimaryCategory = (category: string): string | null => {
  if (category === '즐겨찾기') {
    return '즐겨찾기';
  }
  // Check if the category itself is a primary category
  if (Object.keys(CATEGORY_HIERARCHY).includes(category)) {
    return category; // It's a primary category
  }
  // Otherwise, check if it's a secondary category
  for (const primary in CATEGORY_HIERARCHY) {
    if (CATEGORY_HIERARCHY[primary].includes(category)) {
      return primary;
    }
  }
  return null;
};

interface HierarchicalCategorySelectorProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}

const HierarchicalCategorySelector: React.FC<HierarchicalCategorySelectorProps> = ({ activeCategory, onSelectCategory }) => {
  // 현재 열려있는 1차 카테고리를 관리하는 상태
  const [openPrimaryCategory, setOpenPrimaryCategory] = useState<string | null>(() => {
    const primary = findPrimaryCategory(activeCategory);
    return primary === '즐겨찾기' ? null : primary;
  });

  // activeCategory가 외부에서 변경될 때(예: 2차 카테고리 클릭) 열려있는 1차 카테고리 동기화
  React.useEffect(() => {
    const primary = findPrimaryCategory(activeCategory);
    // '즐겨찾기'가 선택된 경우, 2차 카테고리 목록은 닫혀 있어야 함
    if (primary === '즐겨찾기') {
      setOpenPrimaryCategory(null);
    } else {
      // 현재 열린 카테고리와 다를 경우에만 상태를 업데이트하여 불필요한 리렌더링 방지
      if (openPrimaryCategory !== primary) setOpenPrimaryCategory(primary);
    }
  }, [activeCategory]);

  // 1차 카테고리 버튼 클릭 핸들러
  const handlePrimaryCategoryClick = (category: string) => {
    // 1차 카테고리 클릭 시, 부모 컴포넌트에 알려 첫 번째 하위 카테고리를 선택하게 합니다.
    // useEffect가 activeCategory 변경에 따라 열린 메뉴를 동기화하므로,
    // 여기서 setOpenPrimaryCategory를 직접 호출할 필요가 없습니다.
    onSelectCategory(category);
  };

  return (
    <div className="w-full">
      {/* 1차 카테고리 버튼 목록 */}
      <div className="grid grid-cols-5 gap-px border border-border rounded-t-lg overflow-hidden bg-border">
        {primaryCategories.map((primaryCat) => {
          const Icon = categoryIcons[primaryCat] || MoreHorizontal; // 기본 아이콘 설정
          return (
            <button
              key={primaryCat}
              onClick={() => handlePrimaryCategoryClick(primaryCat)}
              className={`flex items-center justify-center gap-1.5 py-2 text-center text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:z-10 ${
                openPrimaryCategory === primaryCat ? 'bg-panel text-brand' : 'bg-surface text-muted hover:bg-elev'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={openPrimaryCategory === primaryCat ? 2.5 : 2} />
              <span>{primaryCat}</span>
            </button>
          );
        })}
      </div>

      {/* 2차 카테고리 컨테이너 (애니메이션 적용) */}
      <div className="border-x border-b border-border rounded-b-lg bg-panel">
        <div
          className={`grid transition-all duration-300 ease-in-out ${
            openPrimaryCategory ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden">
            <div className="p-3 flex justify-between items-center">
              <div className="flex flex-wrap gap-x-3 gap-y-2">
                {openPrimaryCategory &&
                  CATEGORY_HIERARCHY[openPrimaryCategory]?.map((secondaryCat) => {
                    const isSecondaryActive = secondaryCat === activeCategory;
                    return (
                      <button
                        key={secondaryCat}
                        onClick={() => onSelectCategory(secondaryCat)}
                        className={`px-3 py-1 text-sm rounded-md transition-colors cursor-pointer ${
                          isSecondaryActive
                            ? 'bg-brand text-white font-semibold'
                            : 'text-muted hover:text-ink hover:bg-elev'
                        }`}
                      >
                        {secondaryCat}
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HierarchicalCategorySelector;
