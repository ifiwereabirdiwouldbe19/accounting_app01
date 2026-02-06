import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from "firebase/auth";

export default function AddScreen() {
  const router = useRouter();
  const auth = getAuth();

  const [type, setType] = useState<'支出' | '入金'>('支出');
  const [item, setItem] = useState('');
  const [payee, setPayee] = useState('');
  const [amount, setAmount] = useState('');
  const [currentBalance, setCurrentBalance] = useState(0);
  
  // 担当者情報の管理
  const [userName, setUserName] = useState<string>('読み込み中...');
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // 1. ラズパイDBからメールアドレスをキーに実名を取得
  const fetchUserNameFromPi = async (email: string) => {
    try {
      setIsLoadingUser(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/user/profile?email=${encodeURIComponent(email)}`
      );
      const data = await response.json();
      setUserName(data.name || "名称未設定");
    } catch (error) {
      console.error('担当者名取得失敗:', error);
      setUserName("オフライン担当者");
    } finally {
      setIsLoadingUser(false);
    }
  };

  // 2. 最新の残高を取得
  const fetchLatestBalance = async () => {
    try {
      const response = await fetch(process.env.EXPO_PUBLIC_API_URL + '/api/balance');
      const data = await response.json();
      setCurrentBalance(data.金庫残高 || 0);
    } catch (error) {
      console.error('残高取得失敗:', error);
    }
  };

  useEffect(() => {
    fetchLatestBalance();
    
    // Firebaseのログイン状態を確認して名前を取得
    const user = auth.currentUser;
    if (user && user.email) {
      fetchUserNameFromPi(user.email);
    } else {
      setUserName("未ログイン");
      setIsLoadingUser(false);
    }
  }, []);

  const handleSave = async () => {
    const numAmount = parseInt(amount) || 0;
    if (numAmount <= 0 || item === '') {
      Alert.alert('入力エラー', '名目と金額を正しく入力してください');
      return;
    }

    const newBalance = type === '支出' 
      ? currentBalance - numAmount 
      : currentBalance + numAmount;

    // 【時差対策】日本時間のハイフン区切り日付を生成
    const dateString = new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'Asia/Tokyo'
    }).format(new Date()).replace(/\//g, '-'); 

    const newData = {
      日付: dateString,
      名目: item,
      支払い先: payee,
      請求額: type === '支出' ? numAmount : 0,
      渡したお金: 0,
      おつり: 0,
      支出額: type === '支出' ? numAmount : 0,
      入金額: type === '入金' ? numAmount : 0,
      仮入金額: 0,
      金庫残高: newBalance,
      担当者: userName // ← ラズパイDBから取得した名前をセット
    };

    try {
      const response = await fetch(process.env.EXPO_PUBLIC_API_URL + '/api/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      });

      if (response.ok) {
        Alert.alert('保存完了', `担当者：${userName}で ¥${numAmount.toLocaleString()} を記録しました。`);
        setItem('');
        setPayee('');
        setAmount('');
        setCurrentBalance(newBalance);
      }
    } catch (error) {
      Alert.alert('エラー', '保存に失敗しました');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* 追加：洗練されたヘッダー */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>新規記録</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 担当者表示バッジ */}
        <View style={styles.userBadge}>
          <Ionicons name="person-circle" size={22} color="#3b82f6" />
          <Text style={styles.userBadgeText}> 操作中の担当者: {userName}</Text>
        </View>

        <Text style={styles.label}>種別を選択</Text>
        <View style={styles.typeContainer}>
          <TouchableOpacity 
            style={[styles.typeButton, type === '支出' && styles.activeExpense]} 
            onPress={() => setType('支出')}
          >
            <Text style={type === '支出' ? styles.activeText : styles.inactiveText}>支出 (-)</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeButton, type === '入金' && styles.activeIncome]} 
            onPress={() => setType('入金')}
          >
            <Text style={type === '入金' ? styles.activeText : styles.inactiveText}>入金 (+)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.balanceInfo}>
          <Text style={styles.balanceLabel}>現在の残高予測</Text>
          <Text style={styles.balanceValue}>¥{currentBalance.toLocaleString()}</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>名目</Text>
          <TextInput style={styles.input} value={item} onChangeText={setItem} placeholder="例: コンビニ、売上など" placeholderTextColor="#9ca3af" />
          
          <Text style={styles.inputLabel}>支払い先</Text>
          <TextInput 
            style={styles.input} 
            value={payee} 
            onChangeText={setPayee} 
            placeholder="例: Amazon、JR東日本など" 
            placeholderTextColor="#9ca3af"
          />
          
          <Text style={styles.inputLabel}>金額</Text>
          <TextInput 
            style={[styles.input, styles.amountInput]} 
            value={amount} 
            onChangeText={setAmount} 
            keyboardType="numeric" 
            placeholder="0" 
            placeholderTextColor="#9ca3af"
          />
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, (isLoadingUser || !item || !amount) && styles.disabledButton]} 
          onPress={handleSave}
          disabled={isLoadingUser || !item || !amount}
        >
          {isLoadingUser ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>この内容で保存する</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider} />
        
        <TouchableOpacity 
          style={styles.settlementButton} 
          onPress={() => router.push('/settlement')}
        >
          <Ionicons name="calculator-outline" size={20} color="#6b7280" style={{ marginRight: 8 }} />
          <Text style={styles.settlementButtonText}>本日の精算（現金実査・PDF作成）を行う</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { 
    paddingTop: 60, 
    paddingBottom: 20, 
    backgroundColor: 'white', 
    alignItems: 'center', 
    borderBottomWidth: 1, 
    borderColor: '#f3f4f6' 
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  container: { flex: 1, padding: 20 },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
    alignSelf: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  userBadgeText: { color: '#3b82f6', fontWeight: 'bold', fontSize: 13 },
  label: { fontSize: 14, color: '#6b7280', marginBottom: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  typeContainer: { flexDirection: 'row', marginBottom: 25, borderRadius: 12, backgroundColor: '#e5e7eb', padding: 4 },
  typeButton: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 10 },
  activeExpense: { backgroundColor: '#ef4444' },
  activeIncome: { backgroundColor: '#10b981' },
  activeText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  inactiveText: { color: '#6b7280', fontSize: 15 },
  balanceInfo: { marginBottom: 25, alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 16, elevation: 1 },
  balanceLabel: { fontSize: 12, color: '#9ca3af', marginBottom: 4 },
  balanceValue: { fontSize: 28, fontWeight: 'bold', color: '#1f2937' },
  inputGroup: { backgroundColor: 'white', padding: 20, borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  inputLabel: { fontSize: 13, color: '#9ca3af', marginBottom: 5, fontWeight: '600' },
  input: { borderBottomWidth: 1.5, borderColor: '#f3f4f6', paddingVertical: 10, fontSize: 17, marginBottom: 20, color: '#1f2937' },
  amountInput: { color: '#3b82f6', fontWeight: 'bold', fontSize: 24 },
  saveButton: { backgroundColor: '#3b82f6', paddingVertical: 18, borderRadius: 16, marginTop: 30, alignItems: 'center', elevation: 4, shadowColor: '#3b82f6', shadowOpacity: 0.3, shadowRadius: 10 },
  disabledButton: { backgroundColor: '#cbd5e1', elevation: 0 },
  saveButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 35 },
  settlementButton: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderStyle: 'dashed',
  },
  settlementButtonText: { color: '#6b7280', fontSize: 15, fontWeight: '600' },
});