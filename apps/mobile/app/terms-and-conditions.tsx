import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TermsAndConditionsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6">
        {/* Header */}
        <View className="flex-row items-center justify-between py-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-blue-custom font-medium">Back</Text>
          </TouchableOpacity>
          <Text className="text-xl font-heading text-gray-800">Terms and Conditions</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Content */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <Text className="text-lg font-heading text-gray-800 mb-4">
            Terms and Conditions
          </Text>
          <Text className="text-sm text-gray-600 mb-4">
            Effective Date: January 2025
          </Text>

          <View className="space-y-4">
            <View>
              <Text className="text-base font-medium text-gray-800 mb-2">
                1. Acceptance of Terms
              </Text>
              <Text className="text-sm text-gray-600 leading-6">
                By creating an account and using aluuna.ai ("aluuna", "we", "us", or "our"), you ("you", "user", or "member") agree to be bound by these Terms and Conditions ("Terms"). If you do not agree, do not use our website, mobile application, or any related services (collectively, the "Service").
              </Text>
            </View>

            <View>
              <Text className="text-base font-medium text-gray-800 mb-2">
                2. Nature of Service
              </Text>
              <Text className="text-sm text-gray-600 leading-6">
                aluuna provides a digital platform for self-reflection, journaling, and personal growth, enhanced by artificial intelligence ("AI") and voice technologies. The Service offers features such as voice and text journaling, AI-powered conversational responses and insights, memory and emotional trend tracking, therapeutic guidance, and self-development tools.
              </Text>
              <Text className="text-sm text-gray-600 leading-6 mt-2">
                <Text className="font-medium">aluuna is not a substitute for professional mental health care, diagnosis, or treatment.</Text> If you are in crisis or need immediate help, contact a mental health professional or emergency services.
              </Text>
            </View>

            <View>
              <Text className="text-base font-medium text-gray-800 mb-2">
                3. Eligibility
              </Text>
              <Text className="text-sm text-gray-600 leading-6">
                You must be at least 18 years old, or have the consent of a parent or legal guardian, to use the Service. By using aluuna, you represent and warrant that you meet these requirements.
              </Text>
            </View>

            <View>
              <Text className="text-base font-medium text-gray-800 mb-2">
                4. Account Registration
              </Text>
              <Text className="text-sm text-gray-600 leading-6">
                You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your login credentials. By signing up, you agree to these Terms and our Privacy Policy.
              </Text>
            </View>

            <View>
              <Text className="text-base font-medium text-gray-800 mb-2">
                5. User Content and Data
              </Text>
              <Text className="text-sm text-gray-600 leading-6">
                You retain ownership of the content you submit (e.g., journal entries, responses, profile data). By submitting content, you grant aluuna a non-exclusive, worldwide, royalty-free license to use, store, process, and analyze your data to provide and improve the Service. aluuna may use anonymized and aggregated data for research, analytics, and product development.
              </Text>
            </View>

            <View>
              <Text className="text-base font-medium text-gray-800 mb-2">
                6. Privacy and Data Security
              </Text>
              <Text className="text-sm text-gray-600 leading-6">
                aluuna is committed to protecting your privacy. We use industry-standard security measures to protect your data, but cannot guarantee absolute security. You are responsible for keeping your account information secure.
              </Text>
            </View>

            <View>
              <Text className="text-base font-medium text-gray-800 mb-2">
                7. Use of AI and Voice Technologies
              </Text>
              <Text className="text-sm text-gray-600 leading-6">
                The Service uses AI (including OpenAI's GPT models) to generate responses, insights, and summaries. Voice input is processed using third-party services (e.g., Whisper API) for transcription. AI-generated content is for informational and self-reflective purposes only and should not be considered professional advice.
              </Text>
            </View>

            <View>
              <Text className="text-base font-medium text-gray-800 mb-2">
                8. Crisis and Emergency Disclaimer
              </Text>
              <Text className="text-sm text-gray-600 leading-6">
                aluuna is <Text className="font-medium">not</Text> designed for crisis intervention or emergency support. If you indicate frequent or current suicidal thoughts, you will receive a strong advisory message to seek professional help.
              </Text>
              <Text className="text-sm text-gray-600 leading-6 mt-2">
                <Text className="font-medium">If you are experiencing a mental health crisis, suicidal thoughts, or require immediate assistance, contact a mental health professional or emergency services.</Text> aluuna and its creators are not liable for any actions taken or not taken based on the Service's content.
              </Text>
            </View>

            <View>
              <Text className="text-base font-medium text-gray-800 mb-2">
                9. User Responsibilities
              </Text>
              <Text className="text-sm text-gray-600 leading-6">
                You agree to use the Service only for lawful and personal purposes. You will not use the Service to harass, abuse, or harm others, or to submit false or misleading information. You are responsible for your interactions with the Service and any decisions you make based on its content.
              </Text>
            </View>

            <View>
              <Text className="text-base font-medium text-gray-800 mb-2">
                10. Intellectual Property
              </Text>
              <Text className="text-sm text-gray-600 leading-6">
                All content, software, and intellectual property in the Service (excluding your submitted content) are owned by aluuna.ai or its licensors. You may not copy, modify, distribute, or create derivative works from the Service without our written permission.
              </Text>
            </View>

            <View>
              <Text className="text-base font-medium text-gray-800 mb-2">
                11. Feedback and Suggestions
              </Text>
              <Text className="text-sm text-gray-600 leading-6">
                If you provide feedback or suggestions, you grant aluuna the right to use them without restriction or compensation.
              </Text>
            </View>

            <View>
              <Text className="text-base font-medium text-gray-800 mb-2">
                12. Third-Party Services
              </Text>
              <Text className="text-sm text-gray-600 leading-6">
                The Service may integrate with third-party APIs and services (e.g., OpenAI, Whisper, TTS). aluuna is not responsible for the content, privacy, or security practices of third-party services.
              </Text>
            </View>

            <View>
              <Text className="text-base font-medium text-gray-800 mb-2">
                13. Limitation of Liability
              </Text>
              <Text className="text-sm text-gray-600 leading-6">
                To the maximum extent permitted by law, aluuna.ai and its affiliates are not liable for any direct, indirect, incidental, special, or consequential damages arising from your use of the Service. The Service is provided "as is" and "as available" without warranties of any kind.
              </Text>
            </View>

            <View>
              <Text className="text-base font-medium text-gray-800 mb-2">
                14. Indemnification
              </Text>
              <Text className="text-sm text-gray-600 leading-6">
                You agree to indemnify and hold harmless aluuna.ai, its affiliates, and their officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.
              </Text>
            </View>

            <View>
              <Text className="text-base font-medium text-gray-800 mb-2">
                15. Modifications to the Service and Terms
              </Text>
              <Text className="text-sm text-gray-600 leading-6">
                aluuna may update or discontinue the Service at any time without notice. We may modify these Terms at any time. Continued use of the Service constitutes acceptance of the new Terms.
              </Text>
            </View>

            <View>
              <Text className="text-base font-medium text-gray-800 mb-2">
                16. Termination
              </Text>
              <Text className="text-sm text-gray-600 leading-6">
                We reserve the right to suspend or terminate your account at our discretion, with or without notice, for any violation of these Terms or misuse of the Service.
              </Text>
            </View>

            <View>
              <Text className="text-base font-medium text-gray-800 mb-2">
                17. Governing Law
              </Text>
              <Text className="text-sm text-gray-600 leading-6">
                These Terms are governed by applicable laws. Any disputes will be resolved in the appropriate courts.
              </Text>
            </View>

            <View>
              <Text className="text-base font-medium text-gray-800 mb-2">
                18. Contact
              </Text>
              <Text className="text-sm text-gray-600 leading-6">
                For questions, support, or legal inquiries, contact:
              </Text>
              <Text className="text-sm text-gray-600 leading-6 mt-1">
                aluuna.ai{'\n'}
                Email: support@aluuna.ai
              </Text>
            </View>

            <View className="py-6">
              <Text className="text-sm text-gray-600 leading-6">
                By using aluuna, you acknowledge that you have read, understood, and agree to these Terms and Conditions.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
} 