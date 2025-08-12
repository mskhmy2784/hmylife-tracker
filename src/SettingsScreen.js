import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, doc, setDoc, getDoc, addDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

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
      </div>
    </div>
  );
}

export default SettingsScreen;
