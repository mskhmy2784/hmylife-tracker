// src/services/recordsService.js
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  onSnapshot,
  limit,
  startAfter,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { formatDate } from '../utils/dateUtils';

class RecordsService {
  constructor() {
    this.cache = new Map();
    this.listeners = new Map();
  }

  // 指定日の記録を取得
  async getRecordsByDate(userId, date) {
    if (!userId || !date) {
      throw new Error('ユーザーIDと日付は必須です');
    }

    try {
      const q = query(
        collection(db, 'records'),
        where('userId', '==', userId),
        where('date', '==', date),
        orderBy('recordTime', 'desc')
      );

      const snapshot = await getDocs(q);
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));

      // キャッシュに保存
      const cacheKey = `${userId}-${date}`;
      this.cache.set(cacheKey, records);

      return records;
    } catch (error) {
      console.error('記録取得エラー:', error);
      throw new Error('記録の取得に失敗しました');
    }
  }

  // リアルタイムで記録を監視
  subscribeToRecords(userId, date, callback) {
    if (!userId || !date) {
      throw new Error('ユーザーIDと日付は必須です');
    }

    const listenerId = `${userId}-${date}`;
    
    // 既存のリスナーがある場合は解除
    if (this.listeners.has(listenerId)) {
      this.listeners.get(listenerId)();
    }

    const q = query(
      collection(db, 'records'),
      where('userId', '==', userId),
      where('date', '==', date),
      orderBy('recordTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const records = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        }));

        // キャッシュを更新
        const cacheKey = `${userId}-${date}`;
        this.cache.set(cacheKey, records);

        callback(records);
      },
      (error) => {
        console.error('リアルタイム監視エラー:', error);
        callback(null, new Error('データの監視に失敗しました'));
      }
    );

    this.listeners.set(listenerId, unsubscribe);
    return unsubscribe;
  }

  // 記録追加
  async addRecord(recordData) {
    if (!recordData.userId) {
      throw new Error('ユーザーIDは必須です');
    }

    try {
      const newRecord = {
        ...recordData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'records'), newRecord);
      
      // キャッシュを無効化
      this.invalidateCache(recordData.userId, recordData.date);

      return docRef.id;
    } catch (error) {
      console.error('記録追加エラー:', error);
      throw new Error('記録の追加に失敗しました');
    }
  }

  // 記録更新
  async updateRecord(id, updates) {
    if (!id) {
      throw new Error('記録IDは必須です');
    }

    try {
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      const docRef = doc(db, 'records', id);
      await updateDoc(docRef, updateData);

      // キャッシュを無効化（ユーザーIDと日付がupdatesに含まれている場合）
      if (updates.userId && updates.date) {
        this.invalidateCache(updates.userId, updates.date);
      }

      return true;
    } catch (error) {
      console.error('記録更新エラー:', error);
      throw new Error('記録の更新に失敗しました');
    }
  }

  // 記録削除
  async deleteRecord(id, userId, date) {
    if (!id) {
      throw new Error('記録IDは必須です');
    }

    try {
      const docRef = doc(db, 'records', id);
      await deleteDoc(docRef);

      // キャッシュを無効化
      if (userId && date) {
        this.invalidateCache(userId, date);
      }

      return true;
    } catch (error) {
      console.error('記録削除エラー:', error);
      throw new Error('記録の削除に失敗しました');
    }
  }

  // 期間指定で記録を取得
  async getRecordsByDateRange(userId, startDate, endDate, categories = null) {
    if (!userId || !startDate || !endDate) {
      throw new Error('ユーザーID、開始日、終了日は必須です');
    }

    try {
      let q = query(
        collection(db, 'records'),
        where('userId', '==', userId),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc'),
        orderBy('recordTime', 'desc')
      );

      // カテゴリフィルターがある場合
      if (categories && categories.length > 0) {
        q = query(q, where('category', 'in', categories));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
    } catch (error) {
      console.error('期間指定記録取得エラー:', error);
      throw new Error('指定期間の記録取得に失敗しました');
    }
  }

  // カテゴリ別の統計を取得
  async getCategoryStats(userId, startDate, endDate) {
    try {
      const records = await this.getRecordsByDateRange(userId, startDate, endDate);
      
      const stats = {};
      records.forEach(record => {
        const category = record.category;
        if (!stats[category]) {
          stats[category] = {
            count: 0,
            totalAmount: 0,
            totalCalories: 0,
            totalCaloriesBurn: 0,
            totalDuration: 0
          };
        }
        
        stats[category].count++;
        stats[category].totalAmount += record.amount || 0;
        stats[category].totalCalories += record.calories || 0;
        stats[category].totalCaloriesBurn += record.caloriesBurned || 0;
        stats[category].totalDuration += record.duration || record.durationMinutes || 0;
      });

      return stats;
    } catch (error) {
      console.error('統計取得エラー:', error);
      throw new Error('統計データの取得に失敗しました');
    }
  }

  // 最新の記録を取得（指定件数）
  async getLatestRecords(userId, limitCount = 10) {
    if (!userId) {
      throw new Error('ユーザーIDは必須です');
    }

    try {
      const q = query(
        collection(db, 'records'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
    } catch (error) {
      console.error('最新記録取得エラー:', error);
      throw new Error('最新記録の取得に失敗しました');
    }
  }

  // 指定日より前のデータを一括削除
  async deleteRecordsBefore(userId, beforeDate) {
    if (!userId || !beforeDate) {
      throw new Error('ユーザーIDと基準日は必須です');
    }

    try {
      const q = query(
        collection(db, 'records'),
        where('userId', '==', userId),
        where('date', '<=', beforeDate)
      );

      const snapshot = await getDocs(q);
      const batch = [];
      
      // 100件ずつバッチ処理
      snapshot.docs.forEach((docSnap, index) => {
        if (index % 500 === 0) {
          batch.push([]);
        }
        batch[batch.length - 1].push(docSnap.ref);
      });

      let deletedCount = 0;
      for (const batchRefs of batch) {
        const promises = batchRefs.map(ref => deleteDoc(ref));
        await Promise.all(promises);
        deletedCount += batchRefs.length;
      }

      // キャッシュをクリア
      this.clearCache();

      return deletedCount;
    } catch (error) {
      console.error('一括削除エラー:', error);
      throw new Error('一括削除に失敗しました');
    }
  }

  // キャッシュを無効化
  invalidateCache(userId, date) {
    const cacheKey = `${userId}-${date}`;
    this.cache.delete(cacheKey);
  }

  // キャッシュをクリア
  clearCache() {
    this.cache.clear();
  }

  // すべてのリスナーを解除
  unsubscribeAll() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }

  // 特定のリスナーを解除
  unsubscribe(userId, date) {
    const listenerId = `${userId}-${date}`;
    if (this.listeners.has(listenerId)) {
      this.listeners.get(listenerId)();
      this.listeners.delete(listenerId);
    }
  }
}

// シングルトンインスタンスをエクスポート
export const recordsService = new RecordsService();