import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, Alert, Image } from 'react-native'; // Imageを追加
import React, { useState } from 'react';


export default function App() {

  return (
    <View style={styles.container}>
      <Text style={styles.header}>AWS EC2 データ＆画像取得アプリ</Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    fontSize: 20,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  dataText: {
    marginVertical: 15,
    fontSize: 16,
    textAlign: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    width: '100%',
  },
  image: {
    width: 250, // 適切なサイズに調整
    height: 250, // 適切なサイズに調整
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#000',
  },
  imagePlaceholder: {
    marginVertical: 20,
    fontSize: 14,
    color: '#999',
  }
});