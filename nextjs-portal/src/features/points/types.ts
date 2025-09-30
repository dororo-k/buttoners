﻿// src/features/points/types.ts
export type ProductOption = {
  id: string;
  name: string;
  price: number;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  options?: ProductOption[];
};

// CartItem에는 product의 정보(이름/가격 등)를 넣지 말고
// 오직 productId/qty만 넣으세요.
export type CartItem = {
  productId: string;
  qty: number;
};
