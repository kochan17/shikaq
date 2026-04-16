import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { useState } from 'react';

export default function LoginScreen(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 32 }}>
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            <Text style={{ fontSize: 36, fontFamily: 'Inter_700Bold', color: COLORS.navy, letterSpacing: -1 }}>shikaq</Text>
            <Text style={{ fontSize: 14, fontFamily: 'Inter_400Regular', color: COLORS.slate[500], marginTop: 8 }}>資格学習を、もっとスマートに</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.slate[200], borderRadius: 16, paddingHorizontal: 16, height: 56, marginBottom: 12, backgroundColor: COLORS.background }}>
            <Mail size={18} color={COLORS.slate[400]} />
            <TextInput placeholder="Email" placeholderTextColor={COLORS.slate[400]} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" style={{ flex: 1, marginLeft: 12, fontSize: 16, fontFamily: 'Inter_400Regular', color: COLORS.navy }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.slate[200], borderRadius: 16, paddingHorizontal: 16, height: 56, marginBottom: 24, backgroundColor: COLORS.background }}>
            <Lock size={18} color={COLORS.slate[400]} />
            <TextInput placeholder="Password" placeholderTextColor={COLORS.slate[400]} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} style={{ flex: 1, marginLeft: 12, fontSize: 16, fontFamily: 'Inter_400Regular', color: COLORS.navy }} />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={18} color={COLORS.slate[400]} /> : <Eye size={18} color={COLORS.slate[400]} />}
            </Pressable>
          </View>
          <Pressable style={{ backgroundColor: COLORS.navy, borderRadius: 16, height: 56, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.navy, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8, marginBottom: 16 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' }}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
          </Pressable>
          <Pressable onPress={() => setIsSignUp(!isSignUp)} style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontFamily: 'Inter_400Regular', color: COLORS.slate[500] }}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <Text style={{ fontFamily: 'Inter_600SemiBold', color: COLORS.coral }}>{isSignUp ? 'Sign In' : 'Sign Up'}</Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
