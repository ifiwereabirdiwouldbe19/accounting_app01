import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ActivityIndicator, 
  TouchableOpacity, Alert, ScrollView 
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { Ionicons } from '@expo/vector-icons';

export default function Settings() {
  const router = useRouter();
  const auth = getAuth();
  
  const [userName, setUserName] = useState<string>('読み込み中...');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserNameFromPi = async (email: string) => {
    try {
      setLoading(true);
      // ラズパイAPIにメールアドレスをクエリとして送信
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/user/profile?email=${encodeURIComponent(email)}`
      );
      const data = await response.json();
      setUserName(data.name || "名前未設定");
    } catch (error) {
      console.error("API Error:", error);
      setUserName("オフライン表示");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      // 1. Firebaseの認証状態を監視
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user && user.email) {
          setUserEmail(user.email);
          // 2. 取得したメールアドレスを使ってラズパイDBと照合
          fetchUserNameFromPi(user.email);
        } else {
          setUserName("未ログイン");
          setLoading(false);
        }
      });
      return () => unsubscribe();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert("ログアウト", "ログアウトしますか？", [
      { text: "キャンセル", style: "cancel" },
      { text: "ログアウト", style: "destructive", onPress: () => signOut(auth).then(() => router.replace('/auth/log_in')) }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>設定</Text></View>
      <ScrollView style={styles.main}>
        <View style={styles.card}>
          <View style={styles.userSection}>
            <View style={styles.avatar}><Ionicons name="person" size={32} color="#3b82f6" /></View>
            <View>
              <Text style={styles.cardTitle}>ログイン中のユーザー名</Text>
              {loading ? <ActivityIndicator size="small" color="#3b82f6" /> : <Text style={styles.cardValue}>{userName}</Text>}
              <Text style={styles.emailText}>{userEmail}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>ログアウト</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 20, paddingTop: 60, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#f3f4f6', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  main: { flex: 1, padding: 16 },
  card: { padding: 20, backgroundColor: 'white', borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  userSection: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, backgroundColor: '#eff6ff', borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cardTitle: { fontSize: 12, color: '#9ca3af', fontWeight: '600' },
  cardValue: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  emailText: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  logoutBtn: { marginTop: 20, backgroundColor: 'white', padding: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#fee2e2' },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: 'bold' }
});