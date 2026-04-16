import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useAuth } from '@/hooks/useAuth';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { loginSchema, type LoginFormData } from '@/utils/validators/auth.validator';
import { colors } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error: authError } = useAuth();
  const { isConnected } = useNetworkStatus();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange',
  });

  const onSubmit = useCallback(
    async (data: LoginFormData) => {
      if (!isConnected) {
        Alert.alert(
          'No Internet Connection',
          'Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      try {
        clearErrors();
        const success = await login(data);
        
        if (success) {
          //I changed this /(tabs) to /
          router.replace('/');
        } else {
          setError('root', {
            type: 'manual',
            message: 'Invalid email or password',
          });
        }
      } catch (error) {
        setError('root', {
          type: 'manual',
          message: 'An unexpected error occurred. Please try again.',
        });
      }
    },
    [login, router, isConnected, clearErrors, setError]
  );

  const handleForgotPassword = useCallback(() => {
    Alert.alert(
      'Reset Password',
      'Enter your email address to receive password reset instructions.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send', onPress: () => {} },
      ]
    );
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow px-6 pb-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View 
            entering={FadeInDown.delay(100).duration(600)}
            className="items-center mt-12 mb-8"
          >
            <View className="w-20 h-20 bg-primary-500 rounded-2xl items-center justify-center mb-4">
              <Ionicons name="library" size={40} color="white" />
            </View>
            <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome Back
            </Text>
            <Text className="text-base text-gray-600 dark:text-gray-400 text-center">
              Sign in to continue your learning journey
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View 
            entering={FadeInUp.delay(300).duration(600)}
            className="space-y-5"
          >
            {authError && (
              <ErrorMessage 
                message={authError} 
                onDismiss={() => clearErrors('root')}
              />
            )}

            {errors.root && (
              <ErrorMessage 
                message={errors.root.message || 'An error occurred'} 
                onDismiss={() => clearErrors('root')}
              />
            )}

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email Address"
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  leftIcon={<Ionicons name="mail-outline" size={20} color={colors.gray[400]} />}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  editable={!isSubmitting}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.gray[400]} />}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={colors.gray[400]}
                      />
                    </TouchableOpacity>
                  }
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  editable={!isSubmitting}
                />
              )}
            />

            <TouchableOpacity
              onPress={handleForgotPassword}
              className="self-end"
              disabled={isSubmitting}
            >
              <Text className="text-primary-600 dark:text-primary-400 font-semibold">
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <Button
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting || !isConnected}
              className="mt-6"
              size="lg"
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-lg">Sign In</Text>
              )}
            </Button>

            {!isConnected && (
              <View className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                <Text className="text-yellow-800 dark:text-yellow-200 text-center">
                  No internet connection. Please check your network.
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Register Link */}
          <Animated.View 
            entering={FadeInUp.delay(500).duration(600)}
            className="flex-row justify-center items-center mt-8"
          >
            <Text className="text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
            </Text>
            <Link href="/register" asChild>
              <TouchableOpacity disabled={isSubmitting}>
                <Text className="text-primary-600 dark:text-primary-400 font-semibold">
                  Sign Up
                </Text>
              </TouchableOpacity>
            </Link>
          </Animated.View>

          {/* Demo Credentials */}
          <TouchableOpacity
            onPress={() => {
              control._formValues.email = 'demo@example.com';
              control._formValues.password = 'demo123456';
            }}
            className="mt-4"
            disabled={isSubmitting}
          >
            <Text className="text-center text-gray-500 dark:text-gray-500 text-sm">
              Use demo credentials
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}