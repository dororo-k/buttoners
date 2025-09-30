import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import cors from 'cors';
admin.initializeApp();
const db = admin.firestore();
// For cost control, you can set the maximum number of containers that can be
// running at the same time.
functions.setGlobalOptions({ maxInstances: 10 });



// Interface for the purchase request
interface PurchaseRequest {
  cart: { productId: string; qty: number }[];
}

// Interface for a single item in a purchase
interface PurchaseItem {
  productId: string;
  productName: string;
  qty: number;
  price: number;
}


// --- 상품 구매 Cloud Function (processPurchase) ---
exports.processPurchase = functions.https.onRequest(async (req, res) => {
  cors({ origin: true })(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    // 1. 인증 토큰 확인
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      res.status(401).json({ success: false, message: '인증되지 않은 사용자입니다.' });
      return;
    }

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      res.status(401).json({ success: false, message: '인증 토큰이 유효하지 않습니다.' });
      return;
    }
    const uid = decodedToken.uid;
    const { cart } = req.body as PurchaseRequest;

    // 2. 요청 유효성 검사
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      res.status(400).json({ success: false, message: '장바구니 정보가 올바르지 않습니다.' });
      return;
    }

    try {
      const idemKey = req.header('x-idempotency-key');
      const newPoints = await db.runTransaction(async (transaction) => {
        const userRef = db.collection('users').doc(uid);
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists) {
          throw new Error('사용자 정보를 찾을 수 없습니다.');
        }

        const userData = userDoc.data()!;
        const currentUserPoints = userData.points || 0;
        let totalCost = 0;
        const purchaseItems: PurchaseItem[] = [];

        // Idempotency check at start
        if (idemKey) {
          const idemRef = db.collection('idempotency').doc(`${uid}:${idemKey}`);
          const idemSnap = await transaction.get(idemRef);
          if (idemSnap.exists) {
            const stored = idemSnap.data() as any;
            return typeof stored?.newPoints === 'number' ? stored.newPoints : (userData.points || 0);
          }
        }

        for (const cartItem of cart) {
          functions.logger.log(`[processPurchase] Resolving product: ${cartItem.productId}`);

          // 1) 우선 products/{id} 문서로 직접 조회 (문서 ID 기반)
          const directRef = db.collection('products').doc(cartItem.productId);
          const directSnap = await transaction.get(directRef);

          let resolvedName: string | undefined;
          let resolvedPrice: number | undefined;

          if (directSnap.exists) {
            const data = directSnap.data() as any;
            resolvedName = data?.name;
            resolvedPrice = typeof data?.price === 'number' ? data.price : undefined;
          } else {
            // 2) 옵션 컬렉션 그룹에서 옵션 ID로 조회
            const cg = db.collectionGroup('options')
              .where(admin.firestore.FieldPath.documentId(), '==', cartItem.productId)
              .limit(1);
            const optSnap = await transaction.get(cg);
            if (optSnap.empty) {
              throw new Error(`상품(옵션) ID '${cartItem.productId}'를 찾을 수 없습니다.`);
            }
            const optDoc = optSnap.docs[0];
            const optData = optDoc.data() as any;
            resolvedPrice = typeof optData?.price === 'number' ? optData.price : undefined;
            // 상위 제품 이름을 가져와서 "제품명 옵션명" 형태로 조합
            const baseRef = optDoc.ref.parent.parent; // products/{baseId}
            if (baseRef) {
              const baseSnap = await transaction.get(baseRef);
              const baseData = baseSnap.data() as any;
              const baseName = baseData?.name || '상품';
              resolvedName = `${baseName} ${optData?.name || ''}`.trim();
            } else {
              resolvedName = optData?.name || '옵션';
            }
          }

          if (typeof resolvedPrice !== 'number') {
            throw new Error(`상품 '${cartItem.productId}'의 가격 정보를 확인할 수 없습니다.`);
          }

          const itemCost = resolvedPrice * cartItem.qty;
          totalCost += itemCost;

          purchaseItems.push({
            productId: cartItem.productId,
            productName: resolvedName || 'N/A',
            qty: cartItem.qty,
            price: resolvedPrice,
          });
        }

        if (currentUserPoints < totalCost) {
          throw new Error('포인트가 부족합니다.');
        }

        const finalPoints = currentUserPoints - totalCost;
        transaction.update(userRef, { points: finalPoints });

        // 구매 내역 기록
        const purchaseHistoryRef = db.collection('purchase_history').doc();
        transaction.set(purchaseHistoryRef, {
          uid: uid,
          nickname: userData.nickname,
          items: purchaseItems,
          totalCost: totalCost,
          purchasedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Store idempotency result
        if (idemKey) {
          const idemRef = db.collection('idempotency').doc(`${uid}:${idemKey}`);
          transaction.set(idemRef, { type: 'purchase', newPoints: finalPoints, createdAt: admin.firestore.FieldValue.serverTimestamp() });
        }

        return finalPoints;
      });

      res.status(200).json({ success: true, message: '구매가 완료되었습니다.', newPoints });
    } catch (error: any) {
      functions.logger.error('구매 처리 오류:', error);
      res.status(500).json({ success: false, message: error.message || '구매 처리 중 오류가 발생했습니다.' });
    }
  });
});

// --- 상품 가격 수정 Cloud Function (correctProductPrices) ---
exports.correctProductPrices = functions.https.onRequest(async (req, res) => {
  // CORS 헤더 설정
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // 보안: 이 함수는 민감한 데이터 수정 작업을 수행하므로,
  // 실제 운영 환경에서는 인증된 사용자(예: 관리자)만 접근하도록 제한해야 합니다.
  // 예: const idToken = req.headers.authorization?.split('Bearer ')[1];
  //     await admin.auth().verifyIdToken(idToken);

  try {
    const productsRef = db.collection('products');
    const snapshot = await productsRef.get();
    let updatedCount = 0;
    const batch = db.batch();

    if (snapshot.empty) {
      res.status(200).json({ success: true, message: 'products 컬렉션에 상품이 없습니다.' });
      return;
    }

    snapshot.docs.forEach(doc => {
      const productData = doc.data();
      let needsUpdate = false;

      // Main product price
      if (productData.price && productData.price < 0) {
        batch.update(doc.ref, { price: Math.abs(productData.price) });
        needsUpdate = true;
      }

      // Check options prices if they exist
      if (productData.options && Array.isArray(productData.options)) {
        const updatedOptions = productData.options.map((option: any) => {
          if (option.price && option.price < 0) {
            needsUpdate = true;
            return { ...option, price: Math.abs(option.price) };
          }
          return option;
        });
        if (needsUpdate) {
          batch.update(doc.ref, { options: updatedOptions });
        }
      }

      if (needsUpdate) {
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      await batch.commit();
      res.status(200).json({ success: true, message: `${updatedCount}개 상품의 가격을 수정했습니다.`, updatedCount: updatedCount });
    } else {
      res.status(200).json({ success: true, message: '수정할 음수 가격 상품이 없습니다.' });
    }

  } catch (error: any) {
    console.error('상품 가격 수정 중 오류 발생:', error);
    res.status(500).json({ success: false, message: error.message || '상품 가격 수정 중 오류가 발생했습니다.' });
  }
});
