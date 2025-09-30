const admin = require('firebase-admin');

// Explicitly set emulator host for Admin SDK
// This bypasses credential checks for local emulator connection
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'; // Ensure this matches your Firestore emulator port

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  console.log('Initializing Firebase Admin SDK...');
  admin.initializeApp({
    projectId: 'buttoners-ad811', // Use the emulator's project ID
  });
  console.log('Firebase Admin SDK initialized.');
}

const db = admin.firestore(); // Get the Firestore instance

async function uploadProducts() {
  console.log('Starting product upload to Firestore emulator...');
  console.log('Attempting to connect to Firestore...');
  try {
    // Test connection by trying to get a dummy document
    await db.collection('test_connection').doc('dummy').get();
    console.log('Successfully connected to Firestore emulator.');
  } catch (connError) {
    console.error('Failed to connect to Firestore emulator:', connError);
    return; // Stop if connection fails
  }

  const productsCollection = db.collection('products');

  for (const product of MOCK_PRODUCTS) {
    try {
      const productToUpload = { ...product };
      delete productToUpload.options;

      await productsCollection.doc(product.id).set(productToUpload);
      console.log(`Uploaded product: ${product.name} (${product.id})`);

      // If products have options, you might want to store them in a subcollection
      if (product.options && product.options.length > 0) {
        const optionsSubcollection = productsCollection.doc(product.id).collection('options');
        for (const option of product.options) {
          await optionsSubcollection.doc(option.id).set(option);
          console.log(`  Uploaded option: ${option.name} (${option.id}) for ${product.name}`);
        }
      }

    } catch (error) {
      console.error(`Error uploading product ${product.name}:`, error);
    }
  }
  console.log('Product upload complete.');
}

uploadProducts().catch(console.error);

// MOCK_PRODUCTS directly included for self-containment
const MOCK_PRODUCTS = [
  // 커피
  { id: 'coffee-1', name: '아메리카노', category: '커피', price: 1500 },
  { id: 'coffee-2', name: 'BIG 아메리카노', category: '커피', price: 2000 },
  { id: 'coffee-3', name: '카페라떼', category: '커피', price: 2000 },
  { id: 'coffee-4', name: 'BIG 카페라떼', category: '커피', price: 2500 },
  { id: 'coffee-5', name: '바닐라 라떼', category: '커피', price: 2500 },
  { id: 'coffee-6', name: 'BIG 바닐라 라떼', category: '커피', price: 3000 },
  { id: 'coffee-7', name: '레트로 밀크 커피', category: '커피', price: 1800 },
  { id: 'coffee-8', name: '콜드브루 디카페인', category: '커피', price: 2000 },
  { id: 'coffee-9', name: '콜드브루 디카페인 라떼', category: '커피', price: 2500 },
  { id: 'coffee-10', name: '콜드브루 디카페인 돌체라떼', category: '커피', price: 3000 },

  // 에이드
  { id: 'ade-1', name: '복숭아 아이스티', category: '에이드', price: 1500 },
  { id: 'ade-2', name: 'BIG 복숭아 아이스티', category: '에이드', price: 2000 },
  { id: 'ade-3', name: '제로 복숭아 아이스티', category: '에이드', price: 1500 },
  { id: 'ade-4', name: 'BIG 제로 복숭아 아이스티', category: '에이드', price: 2000 },
  { id: 'ade-5', name: '애플망고 에이드', category: '에이드', price: 2000 },
  { id: 'ade-6', name: '청포도 에이드', category: '에이드', price: 2000 },
  { id: 'ade-7', name: '레몬 에이드', category: '에이드', price: 2000 },
  { id: 'ade-8', name: '체리콕', category: '에이드', price: 2000 },
  { id: 'ade-9', name: '스트로베리 선셋 티에이드', category: '에이드', price: 2500 },
  { id: 'ade-10', name: '레몬애플 아이셔 에이드', category: '에이드', price: 2500 },
  { id: 'ade-11', name: '비타에너지글로우 (퓨어)', category: '에이드', price: 2500 },
  { id: 'ade-12', name: '비타에너지글로우 (레몬)', category: '에이드', price: 2500 },
  { id: 'ade-13', name: '비타에너지글로우 (체리)', category: '에이드', price: 2500 },

  // 라떼
  { id: 'latte-1', name: '17곡 미숫가루 라떼', category: '라떼', price: 1800 },
  { id: 'latte-2', name: '더블초코 라떼', category: '라떼', price: 2000 },
  { id: 'latte-3', name: '제주녹차 라떼', category: '라떼', price: 2000 },
  { id: 'latte-4', name: '리얼딸기 라떼', category: '라떼', price: 2500 },

  // 티
  { id: 'tea-1', name: '크림 카라멜 (디카페인)', category: '티', price: 3000 },
  { id: 'tea-2', name: '1887 블랙티', category: '티', price: 3000 },
  { id: 'tea-3', name: '그랜드 웨딩', category: '티', price: 3000 },
  { id: 'tea-4', name: '프렌치 얼그레이', category: '티', price: 3000 },

  // 쉐이크
  { id: 'shake-1', name: '초코칩오레오 쉐이크', category: '쉐이크', price: 3000 },
  { id: 'shake-2', name: '돼지바 쉐이크', category: '쉐이크', price: 3000 },
  { id: 'shake-3', name: '더위사냥 쉐이크', category: '쉐이크', price: 3000 },
  { id: 'shake-4', name: '밀크 쉐이크', category: '쉐이크', price: 2500 },
  { id: 'shake-5', name: '멜론 쉐이크', category: '쉐이크', price: 3000 },
  { id: 'shake-6', name: '뽕따 쉐이크', category: '쉐이크', price: 3000 },
  { id: 'shake-7', name: '스트로베리 어썸', category: '쉐이크', price: 3000 },
  { id: 'shake-8', name: '배 크러쉬', category: '쉐이크', price: 3000 },

  // 캔음료
  { id: 'can-1', name: '콜라', category: '캔음료', price: 2000 },
  { id: 'can-2', name: '제로콜라', category: '캔음료', price: 2000 },
  { id: 'can-3', name: '스프라이트', category: '캔음료', price: 2000 },
  { id: 'can-4', name: '제로스프라이트', category: '캔음료', price: 2000 },
  { id: 'can-5', name: '웰치스포도', category: '캔음료', price: 2000 },

  // 음식 (기존 식사/스낵류 변경 및 새 항목 추가)
  { id: 'meal-1', name: '리얼 페퍼로니 피자', category: '피자', price: 5000 },
  { id: 'meal-2', name: '오리지널 떡볶이', category: '떡볶이', price: 5000 },
  { id: 'meal-3', name: '로제 떡볶이', category: '떡볶이', price: 5000 },
  { id: 'meal-4', name: '순살 치킨', category: '치킨', price: 6000, options: [{ id: 'meal-4-mini', name: '미니 (250g)', price: 4000 }] },
  { id: 'meal-5', name: '스노윙 슈프림 순살 치킨', category: '치킨', price: 6000 },
  { id: 'meal-6', name: '청양마요 순살 치킨', category: '치킨', price: 6000 },
  { id: 'meal-7', name: '감자튀김', category: '튀김', price: 4000, options: [{ id: 'meal-7-mini', name: '미니 (250g)', price: 3000 }] },
  { id: 'meal-8', name: '허니버터갈릭 감자튀김', category: '튀김', price: 4000 },
  { id: 'meal-9', name: '버팔로 스틱', category: '튀김', price: 6000, options: [{ id: 'meal-9-mini', name: '미니 (4개)', price: 3500 }] },
  { id: 'meal-10', name: '스노윙 쉬림프 앤 펍스', category: '튀김', price: 6500 },
  { id: 'meal-11', name: '오지치즈 프라이 앤 나쵸', category: '튀김', price: 6000 },
  { id: 'meal-12', name: '포테이토 펍스', category: '튀김', price: 3500, options: [{ id: 'meal-12-mini', name: '미니 (120g)', price: 2000 }] },
  { id: 'meal-13', name: '누텔라 츄러스', category: '튀김', price: 5000, options: [{ id: 'meal-13-mini', name: '미니 (6개)', price: 3000 }] },
  { id: 'meal-14', name: '소떡소떡', category: '튀김', price: 2500 },

  // 디저트류
  { id: 'dessert-1', name: '시즈닝 팝콘', category: '스낵', price: 2000 },
  { id: 'dessert-2', name: '칠리치즈 나쵸', category: '스낵', price: 3500 },
  { id: 'dessert-3', name: '크레이프 케이크', category: '아이스크림', price: 5000 },
  { id: 'dessert-4', name: '아포가토', category: '아이스크림', price: 2500 },
  { id: 'dessert-5', name: '아이스크림 브라우니', category: '아이스크림', price: 3500 },
  { id: 'dessert-6', name: '바닐라 아이스크림', category: '아이스크림', price: 2000 },
  { id: 'dessert-7', name: '요거트 아이스크림', category: '아이스크림', price: 2000 },

  // 지각/대타류
  { id: 'tardy-1', name: '지각', category: '지각/대타', price: 3000 },
  { id: 'substitute-1', name: '매니저 요청으로 대타근무', category: '지각/대타', price: +3000 },
];

async function uploadProducts() {
  console.log('Starting product upload to Firestore emulator...');
  console.log('Attempting to connect to Firestore...');
  try {
    // Test connection by trying to get a dummy document
    await db.collection('test_connection').doc('dummy').get();
    console.log('Successfully connected to Firestore emulator.');
  } catch (connError) {
    console.error('Failed to connect to Firestore emulator:', connError);
    return; // Stop if connection fails
  }

  const productsCollection = db.collection('products');

  for (const product of MOCK_PRODUCTS) {
    try {
      const productToUpload = { ...product };
      delete productToUpload.options;

      await productsCollection.doc(product.id).set(productToUpload);
      console.log(`Uploaded product: ${product.name} (${product.id})`);

      // If products have options, you might want to store them in a subcollection
      if (product.options && product.options.length > 0) {
        const optionsSubcollection = productsCollection.doc(product.id).collection('options');
        for (const option of product.options) {
          await optionsSubcollection.doc(option.id).set(option);
          console.log(`  Uploaded option: ${option.name} (${option.id}) for ${product.name}`);
        }
      }

    } catch (error) {
      console.error(`Error uploading product ${product.name}:`, error);
    }
  }
  console.log('Product upload complete.');
}

uploadProducts().catch(console.error);