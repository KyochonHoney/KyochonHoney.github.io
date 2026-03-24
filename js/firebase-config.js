/**
 * Firebase 설정 파일 (v12 최신 버전)
 * Import 방식으로 사용
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";

// Firebase 설정 (Firebase Console에서 받은 값)
const firebaseConfig = {
  apiKey: "AIzaSyByExFtzQhHz4GxYCuOgEhzaCqLhTC78hs",
  databaseURL: "https://fc-pir-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

console.log('🔥 Firebase v12 초기화 완료');

// Export
export { app, db };
