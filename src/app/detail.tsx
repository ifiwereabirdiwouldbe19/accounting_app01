import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  ActivityIndicator, Alert, Dimensions, Modal, TextInput 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from "firebase/auth";

const { width } = Dimensions.get('window');

export default function Detail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const auth = getAuth();
  
  // 状態管理
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<{name: string} | null>(null);

  // 編集用ステート
  const [editTitle, setEditTitle] = useState('');
  const [editWho, setEditWho] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState<'支出' | '入金'>('支出');

  const printJST = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // ログイン中のユーザー情報をラズパイDBから取得
  const fetchCurrentUser = async (email: string) => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/user/profile?email=${encodeURIComponent(email)}`);
      const result = await response.json();
      setCurrentUserProfile(result);
    } catch (error) {
      console.error("User fetch error:", error);
    }
  };

  // データ詳細取得
  const fetchDetail = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/history/${id}`);
      if (!response.ok) throw new Error('データ取得に失敗しました');
      const result = await response.json();
      
      setData(result);
      setEditTitle(result.名目 || '');
      setEditWho(result.支払い先 || '');
      const amount = result.支出額 > 0 ? result.支出額 : result.入金額;
      setEditAmount(String(amount || 0));
      setEditType(result.支出額 > 0 ? '支出' : '入金');
    } catch (error) {
      console.error(error);
      Alert.alert("エラー", "データの取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchDetail();
    if (auth.currentUser?.email) {
      fetchCurrentUser(auth.currentUser.email);
    }
  }, [id]);

  // --- 権限チェック ---
  const hasPermission = () => {
    if (!data || !currentUserProfile) return false;
    if (currentUserProfile.name === "開発者") return true;
    return data.担当者 === currentUserProfile.name;
  };

  const handleSaveEdit = async () => {
    if (!hasPermission()) {
      Alert.alert("権限がありません", "自分が作成したデータ以外は編集できません。");
      return;
    }
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/edit/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          名目: editTitle,
          支払い先: editWho,
          支出額: editType === '支出' ? Number(editAmount) : 0,
          入金額: editType === '入金' ? Number(editAmount) : 0,
          金庫残高: data.金庫残高
        }),
      });

      if (response.ok) {
        Alert.alert("成功", "データを更新しました");
        setModalVisible(false);
        fetchDetail();
      } else {
        Alert.alert("失敗", "更新できませんでした");
      }
    } catch (error) {
      Alert.alert("エラー", "サーバーに接続できませんでした");
    }
  };

  const handleDelete = () => {
    if (!hasPermission()) {
      Alert.alert("権限がありません", "自分が作成したデータ以外は削除できません。");
      return;
    }
    Alert.alert("削除の確認", "このデータを完全に削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      { 
        text: "削除", 
        style: "destructive", 
        onPress: async () => {
          try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/delete/${id}`, { method: 'DELETE' });
            if (response.ok) {
              Alert.alert("完了", "削除しました", [{ text: "OK", onPress: () => router.back() }]);
            }
          } catch (error) {
            Alert.alert("エラー", "通信に失敗しました");
          }
        }
      }
    ]);
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  if (!data) return <View style={styles.centered}><Text>データが見つかりません</Text></View>;

  const isExpense = (data.支出額 || 0) > 0;
  const canEdit = hasPermission();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={28} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>取引明細</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.amountCard}>
          <Text style={styles.label}>決済金額</Text>
          <Text style={[styles.amountText, isExpense ? styles.expense : styles.income]}>
            {isExpense ? `-¥${Number(data.支出額).toLocaleString()}` : `+¥${Number(data.入金額).toLocaleString()}`}
          </Text>
          <View style={[styles.badge, isExpense ? styles.badgeExp : styles.badgeInc]}>
            <Text style={styles.badgeText}>{isExpense ? '支出' : '入金'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本情報</Text>
          <DetailRow label="日付" value={printJST(data.日付)} />
          <DetailRow label="名目" value={data.名目} />
          <DetailRow label="支払い先" value={data.支払い先 || '---'} />
          <DetailRow label="担当者" value={data.担当者} isLast />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>会計詳細</Text>
          <DetailRow label="請求額" value={`¥${Number(data.請求額 || 0).toLocaleString()}`} />
          <DetailRow label="おつり" value={`¥${Number(data.おつり || 0).toLocaleString()}`} />
          <DetailRow label="決済後の残高" value={`¥${Number(data.金庫残高 || 0).toLocaleString()}`} valueStyle={styles.balanceText} isLast />
        </View>

        <View style={styles.actionArea}>
          <TouchableOpacity 
            style={[styles.editButton, !canEdit && styles.disabledBtn]} 
            onPress={() => canEdit ? setModalVisible(true) : Alert.alert("制限", "他者のデータは編集できません")}
          >
            <Ionicons name="create-outline" size={20} color={canEdit ? "#3b82f6" : "#9ca3af"} />
            <Text style={[styles.editText, !canEdit && styles.disabledText]}>この記録を編集する</Text>
            {!canEdit && <Ionicons name="lock-closed" size={14} color="#9ca3af" style={{marginLeft: 5}} />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={canEdit ? "#ef4444" : "#9ca3af"} />
            <Text style={[styles.deleteText, !canEdit && styles.disabledText]}>この記録を削除する</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 編集モーダル */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>データを編集</Text>
            <Text style={styles.modalLabel}>名目</Text>
            <TextInput style={styles.input} value={editTitle} onChangeText={setEditTitle} />
            <Text style={styles.modalLabel}>支払い先</Text>
            <TextInput style={styles.input} value={editWho} onChangeText={setEditWho} />
            <Text style={styles.modalLabel}>金額</Text>
            <TextInput style={styles.input} value={editAmount} onChangeText={setEditAmount} keyboardType="numeric" />
            <View style={styles.typeContainer}>
              {/* 【修正箇所】setEditType に修正 */}
              <TouchableOpacity 
                style={[styles.typeBtn, editType === '支出' && styles.typeBtnActiveExp]} 
                onPress={() => setEditType('支出')}
              >
                <Text style={editType === '支出' ? styles.typeTextActive : styles.typeText}>支出</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeBtn, editType === '入金' && styles.typeBtnActiveInc]} 
                onPress={() => setEditType('入金')}
              >
                <Text style={editType === '入金' ? styles.typeTextActive : styles.typeText}>入金</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}><Text style={styles.saveBtnText}>保存</Text></TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}><Text style={styles.closeBtnText}>閉じる</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const DetailRow = ({ label, value, isLast, valueStyle }: any) => (
  <View style={[styles.row, !isLast && styles.rowBorder]}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={[styles.rowValue, valueStyle]}>{value || '---'}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 10, backgroundColor: '#fff' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  iconButton: { padding: 8 },
  scrollContent: { paddingBottom: 40 },
  amountCard: { backgroundColor: '#fff', margin: 16, padding: 24, borderRadius: 24, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  label: { fontSize: 13, color: '#6b7280', marginBottom: 8 },
  amountText: { fontSize: 32, fontWeight: '800', marginBottom: 12 },
  expense: { color: '#ef4444' },
  income: { color: '#10b981' },
  badge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 12 },
  badgeExp: { backgroundColor: '#fee2e2' },
  badgeInc: { backgroundColor: '#d1fae5' },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  section: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginTop: 16, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16 },
  rowBorder: { borderBottomWidth: 1, borderColor: '#f3f4f6' },
  rowLabel: { color: '#6b7280', fontSize: 15 },
  rowValue: { color: '#111827', fontSize: 15, fontWeight: '500' },
  balanceText: { color: '#3b82f6', fontWeight: 'bold' },
  actionArea: { marginTop: 30, paddingHorizontal: 16 },
  editButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#d1d5db' },
  editText: { color: '#3b82f6', fontWeight: 'bold', marginLeft: 8 },
  disabledBtn: { borderColor: '#e5e7eb' },
  disabledText: { color: '#9ca3af' },
  deleteButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12, padding: 16 },
  deleteText: { color: '#ef4444', fontWeight: 'bold', marginLeft: 8 },
  modalBackdrop: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 16 },
  typeContainer: { flexDirection: 'row', marginBottom: 20 },
  typeBtn: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#f3f4f6', marginHorizontal: 4, borderRadius: 10 },
  typeBtnActiveExp: { backgroundColor: '#ef4444' },
  typeBtnActiveInc: { backgroundColor: '#10b981' },
  typeText: { color: '#4b5563', fontWeight: 'bold' },
  typeTextActive: { color: '#fff' },
  modalButtons: { flexDirection: 'row' },
  saveBtn: { flex: 2, backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, marginRight: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
  closeBtn: { flex: 1, backgroundColor: '#f3f4f6', padding: 16, borderRadius: 12, alignItems: 'center' },
  closeBtnText: { color: '#4b5563', fontWeight: 'bold' },
});