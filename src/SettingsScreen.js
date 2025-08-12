import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy 
} from 'firebase/firestore';
import PersonalSettingsScreen from './PersonalSettingsScreen';

function SettingsScreen({ onBack }) {
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  
  // マスタデータ
  const [stores, setStores] = useState([]);
  const [exerciseTypes, setExerciseTypes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [transportMethods, setTransportMethods] = useState([]);
  
  // 入力用state
  const [newItemName, setNewItemName] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editingName, setEditingName] = useState('');

  // マスタデータタブ設定
  const masterDataTabs = [
    { id: 'personal', name: '個人設定', collection: null },
    { id: 'stores', name: '店舗', collection: 'master_stores' },
    { id: 'exercise', name: '運動種類', collection: 'master_exercise_types' },
    { id: 'locations', name: '場所', collection: 'master_locations' },
    { id: 'transport', name: '交通手段', collection: 'master_transport_methods' }
  ];

  const getCurrentCollection = () => {
    const tab = masterDataTabs.find(tab => tab.id === activeTab);
    return tab?.collection || 'master_stores';
  };

  const getCurrentData = () => {
    if (activeTab === 'personal') return [];
    switch (activeTab) {
      case 'stores': return stores;
      case 'exercise': return exerciseTypes;
      case 'locations': return locations;
      case 'transport': return transportMethods;
      default: return stores;
    }
  };

  const setCurrentData = (data) => {
    if (activeTab === 'personal') return;
    switch (activeTab) {
      case 'stores': setStores(data); break;
      case 'exercise': setExerciseTypes(data); break;
      case 'locations': setLocations(data); break;
      case 'transport': setTransportMethods(data); break;
      default: setStores(data); break;
    }
  };

  // データ読み込み
  useEffect(() => {
    if (activeTab === 'personal') {
      setLoading(false);
      return;
    }
    
    const collectionName = getCurrentCollection();
    console.log('データ読み込み開始:', collectionName);
    
    const q = query(
      collection(db, collectionName),
      orderBy('order', 'asc')
    );

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const data = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        
        setCurrentData(data);
        setLoading(false);
      },
      (error) => {
        console.error('Firestoreエラー:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeTab, getCurrentCollection, setCurrentData]);

  // アイテム追加
  const handleAddItem = async () => {
    if (!newItemName.trim()) return;

    try {
      const currentData = getCurrentData();
      const newOrder = currentData.length > 0 ? 
        Math.max(...currentData.map(item => item.order || 0)) + 1 : 1;

      await addDoc(collection(db, getCurrentCollection()), {
        name: newItemName.trim(),
        order: newOrder,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      setNewItemName('');
    } catch (error) {
      console.error('追加エラー:', error);
      alert('追加に失敗しました');
    }
  };

  // アイテム更新
  const handleUpdateItem = async (itemId) => {
    if (!editingName.trim()) return;

    try {
      await updateDoc(doc(db, getCurrentCollection(), itemId), {
        name: editingName.trim(),
        updatedAt: new Date()
      });

      setEditingItem(null);
      setEditingName('');
    } catch (error) {
      console.error('更新エラー:', error);
      alert('更新に失敗しました');
    }
  };

  // アイテム削除
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('このアイテムを削除しますか？')) return;

    try {
      await deleteDoc(doc(db, getCurrentCollection(), itemId));
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  // ドラッグ&ドロップでの順序変更
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (dragIndex === dropIndex) return;

    const currentData = getCurrentData();
    const reorderedData = [...currentData];
    const [draggedItem] = reorderedData.splice(dragIndex, 1);
    reorderedData.splice(dropIndex, 0, draggedItem);

    // 順序を更新
    const updatePromises = reorderedData.map((item, index) =>
      updateDoc(doc(db, getCurrentCollection(), item.id), {
        order: index + 1,
        updatedAt: new Date()
      })
    );

    try {
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('順序更新エラー:', error);
      alert('順序の更新に失敗しました');
    }
  };

  // 編集開始
  const startEdit = (item) => {
    setEditingItem(item.id);
    setEditingName(item.name);
  };

  // 編集キャンセル
  const cancelEdit = () => {
    setEditingItem(null);
    setEditingName('');
  };

  return (
    <div className="settings-screen">
      <div className="settings-header">
        <button className="back-btn" onClick={onBack}>← 戻る</button>
        <h2>設定・マスタデータ管理</h2>
      </div>

      {/* タブ */}
      <div className="settings-tabs">
        {masterDataTabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* 個人設定画面 */}
      {activeTab === 'personal' && (
        <PersonalSettingsScreen onBack={() => setActiveTab('stores')} />
      )}

      {/* マスタデータ管理画面 */}
      {activeTab !== 'personal' && (
        <div className="settings-content">
          {/* 新規追加 */}
          <div className="add-item-section">
            <h3>新しい{masterDataTabs.find(t => t.id === activeTab)?.name}を追加</h3>
            <div className="add-item-form">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={`${masterDataTabs.find(t => t.id === activeTab)?.name}名を入力`}
                onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
              />
              <button className="add-btn" onClick={handleAddItem}>
                追加
              </button>
            </div>
          </div>

          {/* アイテム一覧 */}
          <div className="items-list-section">
            <h3>
              {masterDataTabs.find(t => t.id === activeTab)?.name}一覧
              <span className="drag-hint">（ドラッグで順序変更）</span>
            </h3>
            
            {loading ? (
              <div className="loading">読み込み中...</div>
            ) : (
              <div className="items-list">
                {getCurrentData().map((item, index) => (
                  <div
                    key={item.id}
                    className="item-row"
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    <div className="drag-handle">⋮⋮</div>
                    
                    {editingItem === item.id ? (
                      <div className="edit-form">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleUpdateItem(item.id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          autoFocus
                        />
                        <button 
                          className="save-btn"
                          onClick={() => handleUpdateItem(item.id)}
                        >
                          保存
                        </button>
                        <button 
                          className="cancel-btn"
                          onClick={cancelEdit}
                        >
                          キャンセル
                        </button>
                      </div>
                    ) : (
                      <div className="item-display">
                        <span className="item-name">{item.name}</span>
                        <div className="item-actions">
                          <button 
                            className="edit-btn"
                            onClick={() => startEdit(item)}
                          >
                            編集
                          </button>
                          <button 
                            className="delete-btn"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {getCurrentData().length === 0 && (
                  <div className="empty-state">
                    まだアイテムがありません
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsScreen;
