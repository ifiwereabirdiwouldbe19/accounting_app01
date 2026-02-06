import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      {/* 下メニューのあるグループを非表示にする（メニュー自体にヘッダーがあるため） */}
      <Stack.Screen name="public" options={{ headerShown: false }} />
      
      {/* ログイン画面などは単体の画面として設定 */}
      <Stack.Screen name="auth/log_in" options={{ title: 'ログイン' }} />
      
      {/* モーダル表示などが必要な場合はここに追加 */}
    </Stack>
  );
}