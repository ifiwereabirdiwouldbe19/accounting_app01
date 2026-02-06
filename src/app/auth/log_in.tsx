import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  KeyboardAvoidingView, // 追加
  Platform,             // 追加
  ScrollView,           // 追加
  TouchableWithoutFeedback, // 追加
  Keyboard              // 追加
} from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config';

const { width } = Dimensions.get('window');

const handlePress = (email: string, password: string): void => {
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log(userCredential.user.uid);
      router.replace('/public/home');
    })
    .catch((error) => {
      Alert.alert('ログインに失敗しました', 'メールアドレスとパスワードを確認してください。');
    });
};

const Login = (): JSX.Element => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    // キーボード回避のためのコンポーネントで全体を包む
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          contentContainerStyle={styles.container} 
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerArea}>
            <Text style={styles.brandTitle}>Eat fast</Text>
            <Text style={styles.subTitle}>早く仕事してください</Text>
          </View>

          <View style={styles.formArea}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>EMAIL</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(text) => { setEmail(text) }}
                placeholder="example@mail.com"
                placeholderTextColor="#9ca3af"
                autoCapitalize='none'
                keyboardType='email-address'
                textContentType='emailAddress'
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={(text) => { setPassword(text) }}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                secureTextEntry={true}
                textContentType='password'
              />
            </View>

            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={() => { handlePress(email, password) }}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>SIGN IN</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>アカウントをお持ちでないですか？それは残念ですね</Text>

            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, // ScrollView内で中央配置するために重要
    backgroundColor: '#ffffff',
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  headerArea: {
    marginBottom: 60,
  },
  brandTitle: {
    fontSize: 42,
    fontWeight: '200',
    color: '#111827',
    letterSpacing: -1,
  },
  subTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 10,
    letterSpacing: 0.5,
  },
  formArea: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  submitButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#111827',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    paddingBottom: 20, // 下部の余白を確保
  },
  footerText: {
    color: '#6b7280',
    fontSize: 13,
  },
  linkText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 5,
  },
});

export default Login;