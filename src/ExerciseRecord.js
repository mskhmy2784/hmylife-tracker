import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';

function ExerciseRecord({ onBack, onSave, editingRecord }) {
  const [recordTime, setRecordTime] = useState(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  });
  
  const [exerciseType, setExerciseType] = useState('ランニング');
  const [exerciseContent, setExerciseContent] = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [exerciseLocation, setExerciseLocation] = useState('');
  const [exerciseLocationInput, setExerciseLocationInput] = useState('');
  const [isCustomExerciseLocation, setIsCustomExerciseLocation] = useState(false);
  const [useLocationInfo, setUseLocationInfo] = useState(true);
  const [memo, setMemo] = useState('');

  // マスタデータの状態
  const [locations, setLocations] = useState([]);

  // 運動種類のマスタデータ（固定値）
  const exerciseTypes = [
    'ランニング',
    'ウォーキング',
    '筋トレ',
    '自転車',
    '水泳',
    'ヨガ',
    'ストレッチ',
    'その他'
  ];

  // マスタデータの読み込み
  useEffect(() => {
    // 場所の読み込み
    const unsubscribeLocations = onSnapshot(
      query(collection(db, 'masterData', 'locations', 'items'), orderBy('name')),
      (snapshot) => {
        const items = snapshot.docs.map(doc => doc.data().name);
        setLocations(items);
      },
      (error) => {
        console.error('場所マスタ読み込みエラー:', error);
        // エラー時はデフォルト値を使用
        setLocations([
          '自宅',
          'ジムA',
          '近所の公園',
          'プール',
          '会社のジム',
          'ヨガスタジオ'
        ]);
      }
    );

    return () => {
      unsubscribeLocations();
    };
  }, []);
