import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ActivityIndicator, 
  TouchableOpacity, Modal, TextInput, Alert, Dimensions, ScrollView, Animated
} from 'react-native';
import { LineChart } from "react-native-chart-kit";
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from "firebase/auth";

const screenWidth = Dimensions.get("window").width;

export default function List() {
  /**
   * UTCのISO文字列を日本時間の読みやすい形式に変換する
   * @param isoString "2026-01-31T15:00:00.000Z"
   */
  const printJST = (isoString: string) => {
    const date = new Date(isoString);

    // 日本語形式でフォーマット（24時間表記）
    const jstString = date.toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return jstString;
  };

  const router = useRouter();
  const auth = getAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<{name: string} | null>(null);

  // 編集用ステート
  const [editTitle, setEditTitle] = useState('');
  const [editWho, setEditWho] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState<'支出' | '入金'>('支出');

  const shakeAnim = useRef(new Animated.Value(0)).current;

  // ログイン中のユーザー情報を取得
  const fetchCurrentUser = async (email: string) => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/user/profile?email=${encodeURIComponent(email)}`);
      const result = await response.json();
      setCurrentUserProfile(result);
    } catch (error) {
      console.error("User fetch error:", error);
    }
  };

  // データ取得関数
  const fetchHistory = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/history`);
      const data = await response.json();
      
      const sanitizedData = data.map((item: any) => {
        const dateStr = printJST(item.日付);
        return {
          ...item,
          日付: dateStr 
        };
      });
      
      setHistory(sanitizedData);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
      if (auth.currentUser?.email) {
        fetchCurrentUser(auth.currentUser.email);
      }
    }, [])
  );

  // 権限チェック関数
  const hasPermission = (item: any) => {
    if (!item || !currentUserProfile) return false;
    if (currentUserProfile.name === "開発者") return true;
    return item.担当者 === currentUserProfile.name;
  };

  // 月ごとのデータ集計
  const monthlyData = useMemo(() => {
    const months: { [key: string]: any[] } = {};
    
    history.forEach(item => {
      const d = new Date(item.日付.replace(/\//g, '-')); 
      
      if (isNaN(d.getTime())) return;

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}/${month}`;
      
      if (!months[monthKey]) months[monthKey] = [];
      months[monthKey].push(item);
    });

    return Object.keys(months)
      .sort()
      .reverse()
      .map(key => ({ 
        month: key, 
        data: months[key].sort((a, b) => a.日付.localeCompare(b.日付))
      }));
  }, [history]);

  const currentMonth = monthlyData[currentMonthIndex];

  // グラフデータ
  const chartData = useMemo(() => {
    if (!currentMonth || currentMonth.data.length === 0) {
      return { labels: ["-"], datasets: [{ data: [0] }] };
    }
    const points = currentMonth.data.map(item => Math.floor(item.金庫残高));
    return {
      labels: points.map(() => ""),
      datasets: [{ data: points }]
    };
  }, [currentMonth]);

  const startShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };
  
  const handleSaveEdit = async () => {
    if (!selectedItem) return;
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/edit/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          名目: editTitle,
          支払い先: editWho,
          支出額: editType === '支出' ? Number(editAmount) : 0,
          入金額: editType === '入金' ? Number(editAmount) : 0,
          金庫残高: selectedItem.金庫残高
        }),
      });

      if (response.ok) {
        setModalVisible(false);
        setSelectedItem(null);
        fetchHistory();
      }
    } catch (error) {
      Alert.alert("通信エラー", "サーバーに接続できませんでした");
    }
  };

  const handleLongPress = (item: any) => {
    setSelectedItem(item);
    startShake();

    // 権限チェック
    if (!hasPermission(item)) {
      Alert.alert(
        "制限",
        "このデータの担当者ではないため、編集・削除権限がありません。",
        [{ text: "OK", onPress: () => setSelectedItem(null) }]
      );
      return;
    }

    Alert.alert(
      "操作を選択",
      `「${item.名目}」を編集または削除しますか？`,
      [
        { text: "編集", onPress: () => { 
          setEditTitle(item.名目); 
          setEditWho(item.支払い先 || '');
          setEditAmount(String(item.支出額 > 0 ? item.支出額 : item.入金額));
          setEditType(item.支出額 > 0 ? '支出' : '入金');
          setModalVisible(true); 
        }},
        { text: "削除", style: "destructive", onPress: () => handleDelete(item.id) },
        { text: "キャンセル", style: "cancel", onPress: () => setSelectedItem(null) }
      ]
    );
  };

  const handleDelete = async (id: number) => {
    await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/delete/${id}`, { method: 'DELETE' });
    fetchHistory();
  };

  if (loading) return <ActivityIndicator size="large" style={styles.loader} color="#3b82f6" />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>残高・履歴管理</Text>
      </View>

      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => monthlyData[currentMonthIndex + 1] && setCurrentMonthIndex(v => v + 1)}>
          <Ionicons name="chevron-back" size={24} color="#3b82f6" />
        </TouchableOpacity>
        <Text style={styles.monthText}>{currentMonth?.month || "データなし"}</Text>
        <TouchableOpacity onPress={() => currentMonthIndex > 0 && setCurrentMonthIndex(v => v - 1)}>
          <Ionicons name="chevron-forward" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.main}>
        <View style={styles.chartWrapper}>
          <LineChart
            data={chartData} width={screenWidth - 40} height={180}
            chartConfig={chartConfig} bezier fromZero
            style={{ borderRadius: 16 }}
          />
        </View>

        <View style={styles.listWrapper}>
          {currentMonth?.data.map((item: any) => {
            const canEdit = hasPermission(item);
            return (
              <Animated.View key={item.id} style={{ transform: [{ translateX: selectedItem?.id === item.id ? shakeAnim : 0 }] }}>
                <TouchableOpacity 
                  style={[
                    styles.listItem, 
                    selectedItem?.id === item.id && styles.selectedItem,
                    canEdit && styles.permittedGlow // 権限があるデータは緑色に光る
                  ]} 
                  onPress={() => router.push({ pathname: '/detail', params: { id: item.id } })}
                  onLongPress={() => handleLongPress(item)}
                >
                  <View>
                    <Text style={styles.date}>{item.日付}</Text>
                    <Text style={styles.itemTitle}>{item.名目}</Text>
                    <View style={styles.staffTag}>
                       <Ionicons name="person-outline" size={10} color="#9ca3af" />
                       <Text style={styles.staffName}> {item.担当者}</Text>
                    </View>
                  </View>
                  <View style={styles.amountContainer}>
                    <Text style={item.支出額 > 0 ? styles.expense : styles.income}>
                      {item.支出額 > 0 ? `-¥${item.支出額.toLocaleString()}` : `+¥${item.入金額.toLocaleString()}`}
                    </Text>
                    <Text style={styles.balance}>残高: ¥{item.金庫残高.toLocaleString()}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      {/* 編集モーダル */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>データを修正</Text>
            <TextInput style={styles.input} value={editTitle} onChangeText={setEditTitle} placeholder="名目" />
            <TextInput style={styles.input} value={editWho} onChangeText={setEditWho} placeholder="支払い先" />
            <TextInput style={styles.input} value={editAmount} onChangeText={setEditAmount} keyboardType="numeric" placeholder="金額" />
            <View style={styles.typeContainer}>
              <TouchableOpacity style={[styles.typeBtn, editType === '支出' && styles.typeBtnActiveExpense]} onPress={() => setEditType('支出')}>
                <Text style={editType === '支出' ? styles.typeTextActive : styles.typeText}>支出</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.typeBtn, editType === '入金' && styles.typeBtnActiveIncome]} onPress={() => setEditType('入金')}>
                <Text style={editType === '入金' ? styles.typeTextActive : styles.typeText}>入金</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}><Text style={styles.saveBtnText}>更新</Text></TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} onPress={() => { setModalVisible(false); setSelectedItem(null); }}><Text style={styles.closeBtnText}>キャンセル</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const chartConfig = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
  strokeWidth: 2,
  propsForDots: { r: "4", strokeWidth: "2", stroke: "#3b82f6" },
  decimalPlaces: 0,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loader: { flex: 1, justifyContent: 'center' },
  header: { padding: 20, paddingTop: 60, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#f3f4f6' },
  title: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: '#1f2937' },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#fff' },
  monthText: { fontSize: 16, fontWeight: 'bold', color: '#374151' },
  main: { flex: 1 },
  chartWrapper: { backgroundColor: 'white', margin: 10, padding: 10, borderRadius: 20, alignItems: 'center', elevation: 2 },
  listWrapper: { padding: 10 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: 'white', marginBottom: 10, borderRadius: 16, elevation: 1 },
  selectedItem: { backgroundColor: '#eff6ff', borderColor: '#3b82f6', borderWidth: 1 },
  // 権限があるデータ用の「緑色のぼやっとした光」
  permittedGlow: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  date: { fontSize: 11, color: '#9ca3af', marginBottom: 2 },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#374151' },
  staffTag: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  staffName: { fontSize: 10, color: '#9ca3af' },
  amountContainer: { alignItems: 'flex-end' },
  expense: { color: '#ef4444', fontWeight: 'bold', fontSize: 16 },
  income: { color: '#10b981', fontWeight: 'bold', fontSize: 16 },
  balance: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  modalBackdrop: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: 20 },
  modalContent: { backgroundColor: 'white', padding: 24, borderRadius: 24, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#f9fafb', padding: 14, borderRadius: 12, marginBottom: 12, fontSize: 16, borderWidth: 1, borderColor: '#f3f4f6' },
  typeContainer: { flexDirection: 'row', marginBottom: 20 },
  typeBtn: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#f3f4f6', marginHorizontal: 5, borderRadius: 12 },
  typeBtnActiveExpense: { backgroundColor: '#ef4444' },
  typeBtnActiveIncome: { backgroundColor: '#10b981' },
  typeText: { color: '#6b7280', fontWeight: '600' },
  typeTextActive: { color: '#fff', fontWeight: '600' },
  modalButtons: { flexDirection: 'row', gap: 10 },
  saveBtn: { flex: 2, backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
  closeBtn: { flex: 1, backgroundColor: '#f3f4f6', padding: 16, borderRadius: 12, alignItems: 'center' },
  closeBtnText: { color: '#4b5563' },
});