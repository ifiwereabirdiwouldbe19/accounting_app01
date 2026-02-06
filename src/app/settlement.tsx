import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getAuth } from "firebase/auth";


export default function Settlement() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [theoreticalBalance, setTheoreticalBalance] = useState(0);
  const [actualCash, setActualCash] = useState('');
  const [currentUserProfile, setCurrentUserProfile] = useState<{name: string} | null>(null);

  const auth = getAuth();

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

  // データ取得
  const fetchData = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/settlement/prepare`);
      const data = await response.json();
      
      setTransactions(data.transactions || []);
      setTheoreticalBalance(data.theoreticalBalance || 0);
    } catch (err) {
      Alert.alert("エラー", "サーバーに接続できません");
    } finally {
      setLoading(false);
    }
  };

  const printJST = (isoString: string) => {
    const date = new Date(isoString);
    const jstString = date.toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return jstString;
  };

  useFocusEffect(useCallback(() => { 
    fetchData(); 
    if (auth.currentUser?.email) {
      fetchCurrentUser(auth.currentUser.email);
    }
  }, []));

  // 権限チェック
  const hasSettlementPermission = () => {
    if (!currentUserProfile) return false;
    const name = currentUserProfile.name;
    return name === process.env.EXPO_PUBLIC_ADMIN_NAME_OF_IT || name === "開発者";
  };

  const currentVariance = (Number(actualCash) || 0) - theoreticalBalance;

  // PDF生成と共有
  const generateAndSharePDF = async () => {
    const sortedExpenses = transactions.filter(t => t.支出額 > 0).sort((a, b) => b.支出額 - a.支出額);
    const totalExpense = sortedExpenses.reduce((sum, t) => sum + t.支出額, 0);
    const tableRowsHtml = transactions.map(t => `
      <tr>
        <td style="text-align: center; color: #94a3b8; font-family: monospace;">${t.id}</td>
        <td style="white-space: nowrap;">${printJST(t.日付)}</td>
        <td style="text-align: center;">
          <span class="tag ${t.支出額 > 0 ? 'tag-out' : 'tag-in'}">${t.支出額 > 0 ? '支出' : '入金'}</span>
        </td>
        <td style="text-align: center; font-weight: bold; color: #475569;">${t.担当者 || '不明'}</td>
        <td>
          <div style="font-weight: bold; color: #0f172a;">${t.支払い先 || '---'}</div>
          <div style="font-size: 9px; color: #64748b;">${t.名目}</div>
        </td>
        <td style="text-align: right; color: #22c55e; font-weight: 600;">
          ${t.入金額 > 0 ? '+' + t.入金額.toLocaleString() : '-'}
        </td>
        <td style="text-align: right; color: #ef4444; font-weight: 600;">
          ${t.支出額 > 0 ? '-' + t.支出額.toLocaleString() : '-'}
        </td>
        <td style="text-align: right; font-weight: 700; background: #f8fafc; color: #334155;">
          ¥${(t.金庫残高 || 0).toLocaleString()}
        </td>
      </tr>
    `).join('');

    const denpyoHtml = transactions.filter(t => t.支出額 > 0).map(t => `
      <div class="denpyo-card">
        <div class="denpyo-header"><span class="denpyo-title">出金伝票</span><span style="font-size: 8px;">No. ${t.id}</span></div>
        <div style="text-align: right; font-size: 9px; margin-bottom: 2px;">${printJST(t.日付)}</div>
        <div class="denpyo-row"><div class="denpyo-label">支払先</div><div class="denpyo-value">${t.支払い先 || ''}</div></div>
        <div class="denpyo-row"><div class="denpyo-label">摘要</div><div class="denpyo-value">${t.名目 || ''}</div></div>
        <div class="amount-area">
          <div style="width:30px; font-size:9px; text-align:center;">金額</div>
          <div class="amount-val">￥${t.支出額.toLocaleString()} -</div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: flex-end;">
          <div style="border: 1px solid #000; width: 40px; height: 35px; color: #ccc; text-align:center; font-size: 10px; line-height: 35px;">受領印</div>
          <div class="stamp-grid">
            <div class="stamp-box"><div style="border-bottom:1px solid #000; background:#f0f0f0;">承認</div></div>
            <div class="stamp-box"><div style="border-bottom:1px solid #000; background:#f0f0f0;">係</div><div style="padding-top:5px;">${t.担当者 || '不明'}</div></div>
          </div>
        </div>
      </div>
    `).join('');

    const html = `
      <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            @page { size: A4; margin: 10mm; }
            body { font-family: 'Inter', "MS UI Gothic", sans-serif; padding: 20px; color: #1e293b; background: #fff; }
            .report-page { page-break-after: always; }
            .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 4px solid #0f172a; padding-bottom: 10px; margin-bottom: 20px; }
            .title-area h1 { font-size: 28px; font-weight: 900; margin: 0; color: #0f172a; }
            .hero-section { display: flex; gap: 15px; margin-bottom: 20px; }
            .total-expense-card { flex: 2; background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; position: relative; overflow: hidden; }
            .hero-amount { font-size: 48px; font-weight: 900; color: #0f172a; }
            .charts-row { display: flex; gap: 20px; margin-bottom: 20px; align-items: center; background: #0f172a; color: #fff; padding: 15px; border-radius: 12px; }
            .bar-bg { background: #334155; height: 6px; border-radius: 3px; margin-top: 4px; }
            .bar-fill { background: #38bdf8; height: 100%; border-radius: 3px; }
            .table-container { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; }
            th { background: #f8fafc; padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; }
            .tag { padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; }
            .tag-out { background: #fee2e2; color: #ef4444; }
            .tag-in { background: #dcfce7; color: #22c55e; }
            .denpyo-section { page-break-before: always; padding-top: 20px; }
            .denpyo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .denpyo-card { border: 1px solid #000; padding: 10px; page-break-inside: avoid; height: 170px; }
            .denpyo-header { border-bottom: 2px solid #000; display: flex; justify-content: space-between; font-weight: bold; }
            .denpyo-row { display: flex; border-bottom: 1px solid #000; font-size: 9px; }
            .denpyo-label { width: 45px; border-right: 1px solid #000; padding: 2px; background: #f9f9f9; }
            .amount-area { display: flex; border: 1px solid #000; margin: 5px 0; align-items: center; font-weight: bold; }
            .stamp-grid { display: flex; justify-content: flex-end; }
            .stamp-box { width: 35px; height: 35px; border: 1px solid #000; border-right: none; font-size: 7px; text-align: center; }
            .stamp-box:last-child { border-right: 1px solid #000; }
          </style>
        </head>
        <body>
          <div class="report-page">
            <div class="header">
              <div class="title-area"><h1>精算報告書</h1></div>
              <div style="font-size: 10px; color: #64748b;">ID: #${Date.now().toString().slice(-6)}</div>
            </div>
            <div class="hero-section">
              <div class="total-expense-card">
                <span style="font-size:12px; color:#64748b;">今回の合計支出額</span><br>
                <span class="hero-amount">¥${totalExpense.toLocaleString()}</span>
              </div>
              <div style="flex:1; display:flex; flex-direction:column; gap:5px;">
                <div style="border:1px solid #e2e8f0; padding:10px; border-radius:8px; display:flex; justify-content:space-between; font-size:12px;">
                  <small>担当</small><strong>${currentUserProfile?.name || '---'}</strong>
                </div>
                <div style="border:1px solid #e2e8f0; padding:10px; border-radius:8px; display:flex; justify-content:space-between; font-size:12px;">
                  <small>残高</small><strong>¥${theoreticalBalance.toLocaleString()}</strong>
                </div>
              </div>
            </div>
            <div class="table-container">
              <table>
              <thead>
      <tr>
        <th style="width: 5%; text-align: center;">ID</th>
        <th style="width: 12%;">日付</th>
        <th style="width: 8%; text-align: center;">種別</th>
        <th style="width: 10%; text-align: center;">担当</th>
        <th style="width: 25%;">支払先 / 摘要</th>
        <th style="width: 12%; text-align: right;">入金</th>
        <th style="width: 12%; text-align: right;">出金</th>
        <th style="width: 16%; text-align: right; background: #f1f5f9;">行残高</th>
      </tr>
    </thead>
                <tbody>${tableRowsHtml}</tbody>
              </table>
            </div>
          </div>
          <div class="denpyo-section">
            <div class="denpyo-grid">${denpyoHtml}</div>
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) {
      console.error(e);
      Alert.alert("PDFエラー", "PDFの生成に失敗しました");
    }
  };

  const handleConfirm = () => {
    // 権限チェックを追加
    if (!hasSettlementPermission()) {
      return Alert.alert("アクセス制限", "精算確定の権限がありません。管理者のみ実行可能です。");
    }

    if (!actualCash) {
      return Alert.alert("エラー", "実査金額（手元現金）を入力してください");
    }

    Alert.alert(
      "精算の最終確認",
      `以下の内容で精算を確定しますか？\n\n` +
      `帳簿残高: ¥${theoreticalBalance.toLocaleString()}\n` +
      `実査金額: ¥${Number(actualCash).toLocaleString()}\n` +
      `過不足額: ¥${currentVariance.toLocaleString()}\n\n` +
      `※確定後、取引データは「精算済み」としてロックされます。`,
      [
        { text: "戻る", style: "cancel" },
        { 
          text: "確定してPDF出力", 
          onPress: () => performSettlement(), 
          style: "default" 
        }
      ],
      { cancelable: true }
    );
  };

  const performSettlement = async () => {
    if (!actualCash) return Alert.alert("エラー", "実査金額を入力してください");
    
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/settlement/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theoretical_balance: theoreticalBalance,
          actual_cash: Number(actualCash),
          variance: currentVariance,
          responsible_person: currentUserProfile?.name || "未登録"
        }),
      });

      const result = await res.json();

      if (res.ok) {
        await generateAndSharePDF();
        setActualCash('');
        fetchData();
        Alert.alert("完了", "精算データを保存し、報告書を作成しました。");
      } else {
        throw new Error(result.error);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("エラー", "精算処理に失敗しました。");
    }
  };

  if (loading) return <ActivityIndicator size="large" style={styles.loader} />;

  const canExecute = hasSettlementPermission();

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>精算・監査</Text>

        <View style={styles.card}>
          <Text style={styles.label}>1. 未精算取引の確認</Text>
          {transactions.length === 0 ? (
            <Text style={styles.noData}>対象の取引はありません</Text>
          ) : (
            transactions.map((item) => (
              <View key={item.id} style={styles.row}>
                <View>
                  <Text style={styles.itemTitle}>{item.名目}</Text>
                  <Text style={styles.itemDate}>{item.日付.split('T')[0]}</Text>
                </View>
                <Text style={item.支出額 > 0 ? styles.minus : styles.plus}>
                  {item.支出額 > 0 ? `-¥${item.支出額.toLocaleString()}` : `+¥${item.入金額.toLocaleString()}`}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>2. 現金実査</Text>
          <View style={styles.infoRow}>
            <Text>帳簿上の理論残高:</Text>
            <Text style={styles.boldText}>¥{theoreticalBalance.toLocaleString()}</Text>
          </View>
          <TextInput
            style={[styles.input, !canExecute && { backgroundColor: '#f1f5f9', color: '#94a3b8' }]}
            placeholder={canExecute ? "¥ 手元の現金を記入" : "権限がありません"}
            keyboardType="numeric"
            value={actualCash}
            onChangeText={setActualCash}
            editable={canExecute}
          />
          <View style={styles.varianceBox}>
            <Text>過不足額:</Text>
            <Text style={[styles.varianceText, { color: currentVariance < 0 ? '#ef4444' : '#10b981' }]}>
              ¥{currentVariance.toLocaleString()}
            </Text>
          </View>
        </View>

        {!canExecute && (
          <View style={styles.lockInfo}>
            <Ionicons name="lock-closed" size={16} color="#ef4444" />
            <Text style={styles.lockText}> 確定権限がありません（管理者のみ）</Text>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.btn, !canExecute && { backgroundColor: '#94a3b8' }]} 
          onPress={handleConfirm}
          activeOpacity={canExecute ? 0.7 : 1}
        >
          <Ionicons name={canExecute ? "checkmark-done" : "lock-closed-outline"} size={20} color="white" />
          <Text style={styles.btnText}>{canExecute ? "精算を確定してPDF出力" : "権限がないため実行できません"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 16 },
  loader: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 40, marginBottom: 20 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16 },
  label: { fontSize: 14, color: '#666', fontWeight: 'bold', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemTitle: { fontSize: 16, fontWeight: '500' },
  itemDate: { fontSize: 12, color: '#999' },
  plus: { color: '#10b981', fontWeight: 'bold' },
  minus: { color: '#ef4444', fontWeight: 'bold' },
  noData: { textAlign: 'center', color: '#999', padding: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 },
  boldText: { fontWeight: 'bold', fontSize: 16 },
  input: { backgroundColor: '#f9fafb', padding: 15, borderRadius: 10, fontSize: 20, textAlign: 'center', borderWidth: 1, borderColor: '#ddd' },
  varianceBox: { alignItems: 'center', marginTop: 15 },
  varianceText: { fontSize: 26, fontWeight: 'bold' },
  btn: { backgroundColor: '#4f46e5', flexDirection: 'row', padding: 18, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 50 },
  btnText: { color: 'white', fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
  lockInfo: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  lockText: { color: '#ef4444', fontSize: 12, fontWeight: 'bold' }
});