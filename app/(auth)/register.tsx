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
import { Checkbox } from '@/components/ui/Checkbox';
import { useAuth } from '@/hooks/useAuth';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { registerSchema, type RegisterFormData } from '@/utils/validators/auth.validator';
import { colors } from '@/constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading, error: authError } = useAuth();
  const { isConnected } = useNetworkStatus();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  const password = watch('password');

  const onSubmit = useCallback(
    async (data: RegisterFormData) => {
      if (!isConnected) {
        Alert.alert(
          'No Internet Connection',
          'Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (!acceptedTerms) {
        Alert.alert(
          'Terms & Conditions',
          'Please accept the Terms & Conditions to continue.',
          [{ text: 'OK' }]
        );
        return;
      }

      try {
        clearErrors();
        const { confirmPassword, ...registerData } = data;
        const success = await register(registerData);
        
        if (success) {
          Alert.alert(
            'Registration Successful',
            'Your account has been created successfully.',
            [
              {
                text: 'Continue',
                onPress: () => router.replace('/(tabs)'),
              },
            ]
          );
        }
      } catch (error: any) {
        if (error.message?.includes('email')) {
          setError('email', {
            type: 'manual',
            message: 'This email is already registered',
          });
        } else {
          setError('root', {
            type: 'manual',
            message: 'Registration failed. Please try again.',
          });
        }
      }
    },
    [register, router, isConnected, acceptedTerms, clearErrors, setError]
  );

  const passwordStrength = useCallback((pass: string) => {
    if (!pass) return { strength: 0, label: '' };
    
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
    
    return {
      strength,
      label: labels[strength],
      color: colors[strength],
    };
  }, []);

  const strength = passwordStrength(password);

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
            className="items-center mt-12 mb-6"
          >
            <View className="w-20 h-20 bg-primary-500 rounded-2xl items-center justify-center mb-4">
              <Ionicons name="person-add-outline" size={40} color="white" />
            </View>
            <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Create Account
            </Text>
            <Text className="text-base text-gray-600 dark:text-gray-400 text-center">
              Join us and start your learning journey
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View 
            entering={FadeInUp.delay(300).duration(600)}
            className="space-y-4"
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
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Full Name"
                  placeholder="Enter your full name"
                  autoCapitalize="words"
                  autoComplete="name"
                  leftIcon={<Ionicons name="person-outline" size={20} color={colors.gray[400]} />}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.name?.message}
                  editable={!isSubmitting}
                />
              )}
            />

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
                <View>
                  <Input
                    label="Password"
                    placeholder="Create a password"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password-new"
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
                  
                  {value && (
                    <View className="mt-2">
                      <View className="flex-row items-center space-x-2">
                        <View className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <View
                            className="h-full rounded-full"
                            style={{
                              width: `${(strength.strength / 4) * 100}%`,
                              backgroundColor: strength.color,
                            }}
                          />
                        </View>
                        {strength.label && (
                          <Text
                            className="text-xs font-medium"
                            style={{ color: strength.color }}
                          >
                            {strength.label}
                          </Text>
                        )}
                      </View>
                      <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Use 8+ characters with letters, numbers & symbols
                      </Text>
                    </View>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                  leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.gray[400]} />}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={colors.gray[400]}
                      />
                    </TouchableOpacity>
                  }
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                  editable={!isSubmitting}
                />
              )}
            />

            <View className="flex-row items-start mt-2">
              <Checkbox
                checked={acceptedTerms}
                onValueChange={setAcceptedTerms}
                disabled={isSubmitting}
              />
              <View className="flex-1 ml-3">
                <Text className="text-sm text-gray-600 dark:text-gray-400">
                  I agree to the{' '}
                  <Text className="text-primary-600 dark:text-primary-400">
                    Terms of Service
                  </Text>{' '}
                  and{' '}
                  <Text className="text-primary-600 dark:text-primary-400">
                    Privacy Policy
                  </Text>
                </Text>
              </View>
            </View>

            <Button
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting || !isConnected}
              className="mt-4"
              size="lg"
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-lg">Create Account</Text>
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

          {/* Login Link */}
          <Animated.View 
            entering={FadeInUp.delay(500).duration(600)}
            className="flex-row justify-center items-center mt-6"
          >
            <Text className="text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
            </Text>
            <Link href="/login" asChild>
              <TouchableOpacity disabled={isSubmitting}>
                <Text className="text-primary-600 dark:text-primary-400 font-semibold">
                  Sign In
                </Text>
              </TouchableOpacity>
            </Link>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}