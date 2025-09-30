import React from 'react';

interface CategoryTabsProps {
  categories: string[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
}) => {
  return (
    <div role="tablist" aria-label="?곹뭹 移댄뀒怨좊━" className="flex flex-wrap gap-x-2 gap-y-2">
      {categories.map((category) => {
        const isActive = category === activeCategory;
        const buttonClasses = [
          'px-3 py-[7px] border rounded-md cursor-pointer bg-transparent text-[13px] leading-tight transition-colors select-none',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500',
          isActive
            ? 'border-amber-500 bg-amber-50 text-amber-800 font-semibold'
            : 'border-stone-300 text-stone-700 hover:text-stone-900 hover:border-stone-400',
        ].join(' ');

        return (
          <button
            key={category}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectCategory(category)}
            className={buttonClasses}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryTabs;
