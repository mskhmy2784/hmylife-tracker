import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
  }

  // メール・パスワードでサインイン
  async signIn(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await this.initializeUserData(result.user);
      return result.user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // 新規ユーザー登録
  async signUp(email, password, displayName = '') {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // プロフィール更新
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      
      // Firestoreにユーザーデータを作成
      await this.createUserProfile(result.user);
      
      return result.user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Googleサインイン
  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      // 毎回アカウント選択画面を表示
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      await this.initializeUserData(result.user);
      return result.user;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // サインアウト
  async signOut() {
    try {
      await signOut(auth);
      this.currentUser = null;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // 認証状態の変更を監視
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      
      if (user) {
        await this.initializeUserData(user);
      }
      
      callback(user);
    });
  }

  // 現在のユーザーを取得
  getCurrentUser() {
    return auth.currentUser;
  }

  // ユーザープロフィールを作成
  async createUserProfile(user) {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userRef);
      
      if (!userSnapshot.exists()) {
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          createdAt: new Date(),
          updatedAt: new Date(),
          // プロフィール初期値
          profile: {
            height: null,
            birthday: null,
            gender: '',
            bloodType: '',
            activityLevel: '普通'
          },
          // 目標設定初期値
          targets: {
            weight: null,
            caloriesIntake: 2000,
            caloriesBurn: 300,
            sleepHours: 8,
            exerciseMinutes: 30
          },
          // 設定初期値
          settings: {
            enableNotifications: true,
            notificationTime: '22:00',
            theme: 'light',
            language: 'ja'
          }
        };
        
        await setDoc(userRef, userData);
        console.log('ユーザープロフィールを作成しました');
      }
    } catch (error) {
      console.error('ユーザープロフィール作成エラー:', error);
      throw error;
    }
  }

  // ユーザーデータの初期化
  async initializeUserData(user) {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userRef);
      
      if (!userSnapshot.exists()) {
        await this.createUserProfile(user);
      }
    } catch (error) {
      console.error('ユーザーデータ初期化エラー:', error);
    }
  }

  // エラーハンドリング
  handleAuthError(error) {
    let message = 'エラーが発生しました';
    
    switch (error.code) {
      case 'auth/user-not-found':
        message = 'ユーザーが見つかりません';
        break;
      case 'auth/wrong-password':
        message = 'パスワードが間違っています';
        break;
      case 'auth/email-already-in-use':
        message = 'このメールアドレスは既に使用されています';
        break;
      case 'auth/weak-password':
        message = 'パスワードが弱すぎます（6文字以上）';
        break;
      case 'auth/invalid-email':
        message = 'メールアドレスの形式が正しくありません';
        break;
      case 'auth/popup-closed-by-user':
        message = 'ログインがキャンセルされました';
        break;
      case 'auth/popup-blocked':
        message = 'ポップアップがブロックされました';
        break;
      case 'auth/network-request-failed':
        message = 'ネットワークエラーが発生しました';
        break;
      default:
        message = error.message || '認証エラーが発生しました';
    }
    
    return new Error(message);
  }
}

// シングルトンインスタンスをエクスポート
export const authService = new AuthService();
