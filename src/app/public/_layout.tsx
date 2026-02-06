import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // アイコンライブラリをインポート

const TopTabs = withLayoutContext(createMaterialTopTabNavigator().Navigator);

export default function PublicLayout() {
  return (
    <TopTabs
      tabBarPosition="bottom" 
      screenOptions={({ route }) => ({
        // 現在のタブが選択されているかどうかでアイコンの色や形を変える設定
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if( route.name === 'ex_in' ) {
            iconName = focused ? 'book' : 'book-outline';
          }else if (route.name === 'list') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-circle-outline';
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
        tabBarActiveTintColor: '#000',   // 選択されている時の色
        tabBarInactiveTintColor: 'gray', // 選択されていない時の色
        tabBarIndicatorStyle: { backgroundColor: '#000', height: 2, top: 0 }, // インジケーターを上に配置
        tabBarLabelStyle: { fontSize: 10, fontWeight: 'bold' },
        tabBarShowIcon: true, // アイコンを表示する設定
        tabBarStyle: { 
          backgroundColor: '#fff', 
          paddingBottom: Platform.OS === 'ios' ? 25 : 5,
          height: Platform.OS === 'ios' ? 90 : 70, // アイコンが入る分、高さを少し出す
        },
      })}
    >
      <TopTabs.Screen name="home" options={{ title: 'ホーム' }} />
      <TopTabs.Screen name="ex_in" options={{ title: '入出金' }} />
      <TopTabs.Screen name="list" options={{ title: 'リスト' }} />
      <TopTabs.Screen name="settings" options={{ title: '設定' }} />
    </TopTabs>
  );
}