import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from "firebase/auth";

const { width } = Dimensions.get('window');

export default function Index() {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>('不審者');

  const auth = getAuth();

  // ユーザープロファイルから名前を取得
  const fetchUserProfile = async (email: string) => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/user/profile?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      if (data && data.name) {
        setUserName(data.name);
      }
    } catch (error) {
      console.error('ユーザー情報取得エラー:', error);
    }
  };

  const fetchBalance = async () => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL + '/api/balance';
      if (!apiUrl) {
        console.error('API URLが設定されていません');
        return;
      }
      const response = await fetch(apiUrl);
      const data = await response.json();
      setBalance(data.金庫残高);
    } catch (error) {
      console.error('取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // ユーザー情報の取得
    if (auth.currentUser?.email) {
      fetchUserProfile(auth.currentUser.email);
    }

    fetchBalance();
    const interval = setInterval(() => {
      fetchBalance();
    }, 3000); 

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greetingText}>{userName} ！</Text>
        <Text style={styles.subGreeting}>今日も眠いね。</Text>
      </View>
      
      <View style={styles.main}>
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Ionicons name="shield-checkmark-sharp" size={18} color="#1f2937" />
            <Text style={styles.cardTitle}>現在の金庫残高</Text>
          </View>

          {loading && balance === null ? (
            <ActivityIndicator size="large" color="#1f2937" style={styles.loader} />
          ) : (
            <Text style={styles.cardValue}>
              {balance !== null ? `¥ ${balance.toLocaleString()}` : '----'}
            </Text>
          )}

          <View style={styles.footerInfo}>
            <Text style={styles.updateText}>
              最終同期: {new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#ffffff' 
  },
  header: { 
    paddingHorizontal: 30, 
    paddingTop: 80, 
    paddingBottom: 20 
  },
  greetingText: { 
    fontSize: 28, 
    fontWeight: '300', 
    color: '#111827',
    letterSpacing: 1
  },
  subGreeting: { 
    fontSize: 14, 
    color: '#6b7280', 
    marginTop: 8,
    fontWeight: '400'
  },
  main: { 
    flex: 1, 
    paddingHorizontal: 20,
    justifyContent: 'center'
  },
  card: { 
    padding: 30, 
    backgroundColor: '#ffffff', 
    borderRadius: 2, // 角をあえて鋭くすることでモダンな高級感を演出
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 20, 
    elevation: 2 
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    opacity: 0.7
  },
  cardTitle: { 
    fontSize: 13, 
    color: '#374151', 
    marginLeft: 8,
    letterSpacing: 2,
    fontWeight: '600'
  },
  cardValue: { 
    fontSize: 48, 
    fontWeight: '200', // 細めのフォントで高級感を表現
    color: '#111827',
    textAlign: 'right'
  },
  loader: {
    marginVertical: 10
  },
  footerInfo: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#f9fafb',
    paddingTop: 15,
    alignItems: 'flex-end'
  },
  updateText: {
    fontSize: 11,
    color: '#9ca3af',
    letterSpacing: 0.5
  }
});