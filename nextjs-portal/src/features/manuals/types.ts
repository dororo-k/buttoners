export type ManualCategory = '서비스' | '식음료' | '청소' | '기타';

export interface ManualDoc {
  id: string;
  title: string;
  category: ManualCategory;
  path: string; // storage path
  url: string; // download URL
  thumbnailUrl?: string; // pre-generated thumb URL (optional)
  size: number;
  contentType: string;
  createdAt: number; // ms epoch
  createdBy: string; // uid
}
