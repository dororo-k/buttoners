"use client";

import { db, storage, auth } from '@/lib/firebaseClient';
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, Timestamp, where } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes, deleteObject } from 'firebase/storage';
import type { ManualCategory, ManualDoc } from '../types';

const COLLECTION = 'manuals';

export async function uploadManual(params: { file: File; category: ManualCategory; title?: string; thumbnail?: Blob }) {
  const { file, category } = params;
  const title = params.title?.trim() || file.name.replace(/\.pdf$/i, '');
  const uid = auth.currentUser?.uid ?? 'unknown';
  const ts = Date.now();

  const storagePath = `${COLLECTION}/${category}/${ts}_${file.name}`;
  const sref = ref(storage, storagePath);
  const snapshot = await uploadBytes(sref, file, { contentType: file.type || 'application/pdf' });
  const url = await getDownloadURL(snapshot.ref);

  let thumbnailUrl: string | undefined = undefined;
  if (params.thumbnail) {
    const thumbExt = 'jpg';
    const thumbPath = `${COLLECTION}/${category}/thumbs/${ts}_${file.name.replace(/\.pdf$/i, '')}.${thumbExt}`;
    const tref = ref(storage, thumbPath);
    const contentType = 'image/jpeg';
    await uploadBytes(tref, params.thumbnail, { contentType });
    thumbnailUrl = await getDownloadURL(tref);
  }

  const docRef = await addDoc(collection(db, COLLECTION), {
    title,
    category,
    path: storagePath,
    url,
    thumbnailUrl: thumbnailUrl || null,
    size: file.size,
    contentType: file.type || 'application/pdf',
    createdAt: serverTimestamp(),
    createdBy: uid,
  });

  return docRef.id as string;
}

export async function listManuals(category?: ManualCategory): Promise<ManualDoc[]> {
  const baseCol = collection(db, COLLECTION);
  const q = category
    ? query(baseCol, where('category', '==', category), orderBy('createdAt', 'desc'))
    : query(baseCol, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as any;
    const createdAt = (data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now()) as number;
    return {
      id: d.id,
      title: data.title,
      category: data.category,
      path: data.path,
      url: data.url,
      size: data.size,
      contentType: data.contentType,
      createdAt,
      createdBy: data.createdBy,
    } satisfies ManualDoc;
  });
}

export async function deleteManual(id: string) {
  // Fetch doc to get storage path
  const dref = doc(db, COLLECTION, id);
  const { getDoc } = await import('firebase/firestore');
  const dsnap = await getDoc(dref);
  if (!dsnap.exists()) return;
  const data = dsnap.data() as any;
  const storagePath: string | undefined = data.path;
  if (storagePath) {
    try {
      await deleteObject(ref(storage, storagePath));
    } catch {
      // ignore storage delete failure; proceed to delete doc
    }
  }
  await deleteDoc(dref);
}
