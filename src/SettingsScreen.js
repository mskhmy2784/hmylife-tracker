import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, doc, setDoc, getDoc, addDoc, deleteDoc, onSnapshot, query, orderBy, where, getDocs, writeBatch } from 'firebase/firestore';

function SettingsScreen({ onBack }) {
  // ユーザー基本情報
  const [height, setHeight] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('male');
  const [userInfoSaving, setUserInfoSaving] = useState(false);

  // マスタデータ
  const [paymentLocations, setPaymentLocations] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [locations, setLocations] = useState([]);
  
  // 新規追加用の入力値
  const [newPaymentLocation, setNewPaymentLocation] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState('');
  const [newLocation, setNewLocation] = useState('');

  // 現在選択中のタブ
  const [activeTab, setActiveTab] = useState('userInfo');

  // データ削除関連の状態
  const [deleteDate, setDeleteDate] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [recordCounts, setRecordCounts] = useState({
    total: 0,
    targetDate: 0
  });

  // ユーザー基本情報の読み込み
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'settings', 'userInfo'));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setHeight(data.height || '');
          setBirthDate(data.birthDate || '');
          setGender(data.gender || 'male');
        }
      } catch (error) {
        console.error('ユーザー情報読み込みエラー:', error);
      }
    };
    loadUserInfo();
  }, []);

  // マスタデータの読み込み
  useEffect(() => {
    // 支払先の読み込み
    const unsubscribePaymentLocations = onSnapshot(
      query(collection(db, 'masterData', 'paymentLocations', 'items'), orderBy('name')),
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPaymentLocations(items);
      }
    );

    // 支払方法の読み込み
    const unsubscribePaymentMethods = onSnapshot(
      query(collection(db, 'masterData', 'paymentMethods', 'items'), orderBy('name')),
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPaymentMethods(items);
      }
    );

    // 場所の読み込み
    const unsubscribeLocations = onSnapshot(
      query(collection(db, 'masterData', 'locations', 'items'), orderBy('name')),
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLocations(items);
      }
    );

    return () => {
      unsubscribePaymentLocations();
      unsubscribePaymentMethods();
      unsubscribeLocations();
    };
  }, []);

  // 記録件数の取得
  useEffect(() => {
    const getRecordCounts = async () => {
      try {
        // 全記録数を取得
        const allRecordsSnapshot = await getDocs(collection(db, 'records'));
        const totalCount = allRecordsSnapshot.size;

        let targetCount = 0;
        if (deleteDate) {
          // 指定日付以前の記録数を取得
          const targetDateObj = new Date(deleteDate);
          const targetDateString = targetDateObj.toDateString();
          
          // 指定日以前のデータを検索
          const beforeDate = new Date(targetDateObj);
          beforeDate.setDate(beforeDate.getDate() + 1); // 指定日の翌日
          const beforeDateString = beforeDate.toDateString();
          
          const targetRecords = allRecordsSnapshot.docs.filter(doc => {
            const recordDate = doc.data().date;
            return recordDate < beforeDateString;
          });
          
          targetCount = targetRecords.length;
        }

        setRecordCounts({
          total: totalCount,
          targetDate: targetCount
        });
      } catch (error) {
        console.error('記録件数取得エラー:', error);
      }
    };

    getRecordCounts();
  }, [deleteDate]);

  // 年齢計算
  const calculateAge = () => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // 基礎代謝計算（Harris-Benedict式）
  const calculateBMR = () => {
    if (!height || !birthDate) return 0;
    const age = calculateAge();
    const heightNum = parseFloat(height);
    
    if (gender === 'male') {
      // 男性: BMR = 88.362 + (13.397 × 体重kg) + (4.799 × 身長cm) - (5.677 × 年齢)
      // 体重は仮で65kgとして計算（実際の体重は計量記録から取得する想定）
      return Math.round(88.362 + (13.397 * 65) + (4.799 * heightNum) - (5.677 * age));
    } else {
      // 女性: BMR = 447.593 + (9.247 × 体重kg) + (3.098 × 身長cm) - (4.330 × 年齢)
      return Math.round(447.593 + (9.247 * 55) + (3.098 * heightNum) - (4.330 * age));
    }
  };

  // ユーザー基本情報の保存
  const handleSaveUserInfo = async () => {
    setUserInfoSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'userInfo'), {
        height: parseFloat(height) || 0,
        birthDate: birthDate,
        gender: gender,
        updatedAt: new Date()
      });
      alert('ユーザー情報を保存しました！');
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました');
    } finally {
      setUserInfoSaving(false);
    }
  };

  // マスタデータの追加
  const handleAddMasterData = async (type, value) => {
    if (!value.trim()) return;
    
    try {
      let collectionPath = '';
      switch (type) {
        case 'paymentLocation':
          collectionPath = 'masterData/paymentLocations/items';
          break;
        case 'paymentMethod':
          collectionPath = 'masterData/paymentMethods/items';
          break;
        case 'location':
          collectionPath = 'masterData/locations/items';
          break;
        default:
          return;
      }

      await addDoc(collection(db, collectionPath), {
        name: value.trim(),
        createdAt: new Date()
      });

      // 入力フィールドをクリア
      switch (type) {
        case 'paymentLocation':
          setNewPaymentLocation('');
          break;
        case 'paymentMethod':
          setNewPaymentMethod('');
          break;
        case 'location':
          setNewLocation('');
          break;
        default:
          // デフォルトケース - 何もしない
          break;
      }

      alert('追加しました！');
    } catch (error) {
      console.error('追加エラー:', error);
      alert('追加に失敗しました');
    }
  };

  // マスタデータの削除
  const handleDeleteMasterData = async (type, id, name) => {
    const confirmDelete = window.confirm(`「${name}」を削除しますか？`);
    if (!confirmDelete) return;

    try {
      let collectionPath = '';
      switch (type) {
        case 'paymentLocation':
          collectionPath = 'masterData/paymentLocations/items';
          break;
        case 'paymentMethod':
          collectionPath = 'masterData/paymentMethods/items';
          break;
        case 'location':
          collectionPath = 'masterData/locations/items';
          break;
        default:
          return;
      }

      await deleteDoc(doc(db, collectionPath, id));
      alert('削除しました');
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  // レコード削除処理
  const handleDeleteRecords = async () => {
    if (!deleteDate) {
      alert('削除する日付を選択してください');
      return;
    }

    if (recordCounts.targetDate === 0) {
      alert('削除対象のレコードがありません');
      return;
    }

    const confirmMessage = `${deleteDate}以前のレコード ${recordCounts.targetDate}件を削除しますか？\n\nこの操作は取り消すことができません。`;
    const confirmed = window.confirm(confirmMessage);
    
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      // 指定日付以前の記録を取得
      const targetDateObj = new Date(deleteDate);
      const beforeDate = new Date(targetDateObj);
      beforeDate.setDate(beforeDate.getDate() + 1); // 指定日の翌日
      const beforeDateString = beforeDate.toDateString();

      const allRecordsSnapshot = await getDocs(collection(db, 'records'));
      const recordsToDelete = allRecordsSnapshot.docs.filter(doc => {
        const recordDate = doc.data().date;
        return recordDate < beforeDateString;
      });

      // バッチ処理で削除（Firestoreの制限で500件ずつ処理）
      const batchSize = 500;
      const batches = [];
      
      for (let i = 0; i < recordsToDelete.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchRecords = recordsToDelete.slice(i, i + batchSize);
        
        batchRecords.forEach(record => {
          batch.delete(record.ref);
        });
        
        batches.push(batch);
      }

      // すべてのバッチを実行
      await Promise.all(batches.map(batch => batch.commit()));

      alert(`${recordCounts.targetDate}件のレコードを削除しました`);
      setDeleteDate('');
      
    } catch (error) {
      console.error('レコード削除エラー:', error);
      alert('レコードの削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="settings-screen">
      <div className="record-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2>管理画面</h2>
        <div></div>
      </div>

      {/* タブメニュー */}
      <div className="tab-menu">
        <button 
          className={`tab-btn ${activeTab === 'userInfo' ? 'active' : ''}`}
          onClick={() => setActiveTab('userInfo')}
        >
          基本情報
        </button>
        <button 
          className={`tab-btn ${activeTab === 'masterData' ? 'active' : ''}`}
          onClick={() => setActiveTab('masterData')}
        >
          マスタデータ
        </button>
        <button 
          className={`tab-btn ${activeTab === 'dataManagement' ? 'active' : ''}`}
          onClick={() => setActiveTab('dataManagement')}
        >
          データ管理
        </button>
      </div>

      <div className="settings-content">
        {/* ユーザー基本情報タブ */}
        {activeTab === 'userInfo' && (
          <div className="user-info-section">
            <div className="form-group">
              <label>身長 (cm):</label>
              <input
                type="number"
                step="0.1"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="例: 170.5"
              />
            </div>

            <div className="form-group">
              <label>生年月日:</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
              {birthDate && (
                <div className="info-display">
                  現在の年齢: {calculateAge()}歳
                </div>
              )}
            </div>

            <div className="form-group">
              <label>性別:</label>
              <div className="gender-buttons">
                <button
                  className={`gender-btn ${gender === 'male' ? 'active' : ''}`}
                  onClick={() => setGender('male')}
                >
                  男性
                </button>
                <button
                  className={`gender-btn ${gender === 'female' ? 'active' : ''}`}
                  onClick={() => setGender('female')}
                >
                  女性
                </button>
              </div>
            </div>

            {/* 計算結果表示 */}
            {height && birthDate && (
              <div className="calculation-results">
                <h3>計算結果</h3>
                <div className="result-item">
                  <span className="result-label">基礎代謝:</span>
                  <span className="result-value">{calculateBMR()} kcal/日</span>
                </div>
                <div className="result-note">
                  ※基礎代謝は標準体重での概算値です。正確な値は体重測定後に再計算されます。
                </div>
              </div>
            )}

            <div className="save-section">
              <button 
                className="save-btn-large"
                onClick={handleSaveUserInfo}
                disabled={userInfoSaving}
              >
                {userInfoSaving ? '保存中...' : '基本情報を保存'}
              </button>
            </div>
          </div>
        )}

        {/* マスタデータタブ */}
        {activeTab === 'masterData' && (
          <div className="master-data-section">
            {/* 支払先管理 */}
            <div className="master-category">
              <h3>支払先・店舗</h3>
              <div className="add-item-form">
                <input
                  type="text"
                  value={newPaymentLocation}
                  onChange={(e) => setNewPaymentLocation(e.target.value)}
                  placeholder="新しい支払先を入力"
                />
                <button 
                  className="add-btn"
                  onClick={() => handleAddMasterData('paymentLocation', newPaymentLocation)}
                >
                  追加
                </button>
              </div>
              <div className="master-list">
                {paymentLocations.map(item => (
                  <div key={item.id} className="master-item">
                    <span className="item-name">{item.name}</span>
                    <button 
                      className="delete-item-btn"
                      onClick={() => handleDeleteMasterData('paymentLocation', item.id, item.name)}
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 支払方法管理 */}
            <div className="master-category">
              <h3>支払方法</h3>
              <div className="add-item-form">
                <input
                  type="text"
                  value={newPaymentMethod}
                  onChange={(e) => setNewPaymentMethod(e.target.value)}
                  placeholder="新しい支払方法を入力"
                />
                <button 
                  className="add-btn"
                  onClick={() => handleAddMasterData('paymentMethod', newPaymentMethod)}
                >
                  追加
                </button>
              </div>
              <div className="master-list">
                {paymentMethods.map(item => (
                  <div key={item.id} className="master-item">
                    <span className="item-name">{item.name}</span>
                    <button 
                      className="delete-item-btn"
                      onClick={() => handleDeleteMasterData('paymentMethod', item.id, item.name)}
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 場所管理 */}
            <div className="master-category">
              <h3>場所（移動先・移動元など）</h3>
              <div className="add-item-form">
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="新しい場所を入力"
                />
                <button 
                  className="add-btn"
                  onClick={() => handleAddMasterData('location', newLocation)}
                >
                  追加
                </button>
              </div>
              <div className="master-list">
                {locations.map(item => (
                  <div key={item.id} className="master-item">
                    <span className="item-name">{item.name}</span>
                    <button 
                      className="delete-item-btn"
                      onClick={() => handleDeleteMasterData('location', item.id, item.name)}
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* データ管理タブ */}
        {activeTab === 'dataManagement' && (
          <div className="data-management-section">
            {/* 記録統計 */}
            <div className="data-stats">
              <h3>📊 記録統計</h3>
              <div className="stats-info">
                <div className="stat-item">
                  <span className="stat-label">総記録数:</span>
                  <span className="stat-value">{recordCounts.total}件</span>
                </div>
              </div>
            </div>

            {/* レコード削除機能 */}
            <div className="data-delete-section">
              <h3>🗑️ レコード削除</h3>
              <div className="delete-warning">
                ⚠️ 指定した日付以前のすべてのレコードが削除されます。この操作は取り消すことができません。
              </div>
              
              <div className="delete-form">
                <div className="form-group">
                  <label>削除する日付を選択:</label>
                  <input
                    type="date"
                    value={deleteDate}
                    onChange={(e) => setDeleteDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]} // 今日まで
                  />
                  <div className="delete-help">
                    選択した日付以前のレコードがすべて削除されます
                  </div>
                </div>

                {deleteDate && (
                  <div className="delete-preview">
                    <div className="preview-info">
                      <strong>{deleteDate}以前のレコード: {recordCounts.targetDate}件</strong>が削除されます
                    </div>
                    {recordCounts.targetDate > 0 && (
                      <div className="delete-details">
                        • 削除後の残りレコード数: {recordCounts.total - recordCounts.targetDate}件
                      </div>
                    )}
                  </div>
                )}

                <div className="delete-action">
                  <button
                    className="delete-records-btn"
                    onClick={handleDeleteRecords}
                    disabled={!deleteDate || recordCounts.targetDate === 0 || isDeleting}
                  >
                    {isDeleting ? '削除中...' : `${recordCounts.targetDate}件のレコードを削除`}
                  </button>
                </div>
              </div>
            </div>

            {/* 注意事項 */}
            <div className="data-notes">
              <h4>注意事項</h4>
              <ul>
                <li>削除されたレコードは復元できません</li>
                <li>写真ファイルも同時に削除されます</li>
                <li>削除処理には時間がかかる場合があります</li>
                <li>削除前に必要なデータはバックアップしてください</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SettingsScreen;
