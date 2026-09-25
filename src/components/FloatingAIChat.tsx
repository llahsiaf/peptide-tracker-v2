import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Settings,
  Key,
  Check,
  ChevronLeft,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBioStackStore } from '../store/useBioStackStore';
import { useLanguage } from '../i18n/LanguageContext';
import { COLORS } from '../theme';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

export const FloatingAIChat: React.FC = () => {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState<'chat' | 'settings'>('chat');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai'>('gemini');

  const { inventory, settings, updateSettings } = useBioStackStore();

  const isEn = language === 'en';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text:
        language === 'en'
          ? 'Hello. I am BioStack AI Assistant. I can help you review your schedule, inventory, history, and tracker statistics. For privacy, online mode remains OFF until you enable it.'
          : 'Halo. Saya BioStack AI Assistant. Saya dapat membantu membaca jadwal, inventory, riwayat, dan statistik tracker Anda. Untuk privasi, mode online tetap OFF sampai Anda mengaktifkannya.',
      time: '00:00',
    },
  ]);

  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text:
          language === 'en'
            ? 'Hello. I am BioStack AI Assistant. I can help you review your schedule, inventory, history, and tracker statistics. For privacy, online mode remains OFF until you enable it.'
            : 'Halo. Saya BioStack AI Assistant. Saya dapat membantu membaca jadwal, inventory, riwayat, dan statistik tracker Anda. Untuk privasi, mode online tetap OFF sampai Anda mengaktifkannya.',
        time: '00:00',
      },
    ]);
  }, [language]);

  useEffect(() => {
    AsyncStorage.getItem('@biostack_api_key').then((val) => {
      if (val) setApiKey(val);
    });
    AsyncStorage.getItem('@biostack_ai_provider').then((val) => {
      if (val === 'gemini' || val === 'openai') setAiProvider(val);
    });
  }, []);

  const saveSettings = async () => {
    await AsyncStorage.setItem('@biostack_api_key', apiKey.trim());
    await AsyncStorage.setItem('@biostack_ai_provider', aiProvider);
    updateSettings({ aiProvider });
    setActiveView('chat');
    Alert.alert(
      language === 'en' ? 'Success' : 'Sukses',
      language === 'en'
        ? 'API Key settings saved successfully.'
        : 'Pengaturan API Key berhasil disimpan.'
    );
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
      time: timeNow,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      let replyText = '';

      if (apiKey.trim()) {
        if (!settings?.allowAiNetwork) {
          setMessages((prev) => [
            ...prev,
            {
              id: `ai-private-${Date.now()}`,
              sender: 'ai',
              text:
                language === 'en'
                  ? 'Online AI mode is OFF to preserve privacy. Enable "Allow online AI connection" in BioStack Settings if you wish to send queries to the AI provider.'
                  : 'Mode AI online sedang OFF untuk menjaga privasi. Aktifkan “Izinkan koneksi AI online” di Pengaturan BioStack bila Anda ingin mengirim pertanyaan ke provider AI.',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
          return;
        }
        if (aiProvider === 'gemini') {
          const geminiPrompt =
            language === 'en'
              ? `You are a professional biohacking and peptide pharmacology consultant for the BioStack PRO app. Answer concisely, based on clinical science, in English without emoji characters. User query: "${userText}"`
              : `Anda adalah konsultan biohacking dan farmakologi peptida profesional untuk aplikasi BioStack PRO. Jawab secara ringkas, berbasis sains klinis, gunakan bahasa Indonesia formal tanpa karakter emoji. Pertanyaan pengguna: "${userText}"`;

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: geminiPrompt,
                      },
                    ],
                  },
                ],
              }),
            }
          );
          const data = await response.json();
          replyText =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            (language === 'en'
              ? 'Sorry, received no response from Gemini API.'
              : 'Maaf, tidak mendapat respon dari Gemini API.');
        } else {
          const openaiSys =
            language === 'en'
              ? 'You are a smart peptide pharmacology assistant for BioStack PRO. Answer concisely, scientifically, and do not use emojis.'
              : 'Anda adalah asisten cerdas farmakologi peptida BioStack PRO. Jawab ringkas, ilmiah, dan jangan gunakan karakter emoji sama sekali.';

          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey.trim()}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: openaiSys,
                },
                { role: 'user', content: userText },
              ],
            }),
          });
          const data = await response.json();
          replyText =
            data?.choices?.[0]?.message?.content ||
            (language === 'en'
              ? 'Sorry, received no response from OpenAI.'
              : 'Maaf, tidak mendapat respon dari OpenAI.');
        }
      } else {
        const lower = userText.toLowerCase();
        const isEn = language === 'en';
        if (lower.includes('bac') || lower.includes('larut') || lower.includes('water') || lower.includes('air')) {
          replyText = isEn
            ? 'BAC Water Guide: Slowly introduce Bacteriostatic Water along the inner vial wall (avoid spraying directly onto peptide powder to prevent denaturing amino acid chains).'
            : 'Panduan BAC Water: Masukkan Bacteriostatic Water secara perlahan menyusuri dinding kaca vial (jangan disemprot langsung ke serbuk peptida untuk mencegah denaturasi rantai asam amino).';
        } else if (lower.includes('rotasi') || lower.includes('titik') || lower.includes('suntik') || lower.includes('rotation') || lower.includes('site') || lower.includes('inject')) {
          replyText = isEn
            ? 'Rotation Protocol: Rotate across the 4 abdominal quadrants or thigh/arm/glute areas at least 2.5 cm from previous injection sites to prevent scar tissue and lipohypertrophy.'
            : 'Protokol Rotasi: Rotasikan 4 kuadran perut (RUQ, LUQ, RLQ, LLQ) atau area paha/lengan/bokong minimal berjarak 2.5 cm dari bekas tusukan sebelumnya untuk menghindari penumpukan jaringan parut (lipohipertrofi).';
        } else if (lower.includes('bpc') || lower.includes('tb500')) {
          replyText = isEn
            ? 'BPC-157 Protocol: Standard dose is 250 - 500 mcg per day subcutaneously, often combined with TB-500 for connective tissue, tendon, and ligament recovery.'
            : 'Protokol Regenerasi BPC-157: Dosis standar berkisar 250 - 500 mcg per hari via subkutan, sering dikombinasikan dengan TB-500 untuk pemulihan ligamen dan tendon.';
        } else {
          replyText = isEn
            ? `Smart Assistant: You can configure a Google Gemini API Key in settings for live AI discussions. Active fridge stock: ${inventory.length} vials.`
            : `Catatan Pintar: Anda dapat memasukkan Google Gemini API Key pada menu pengaturan di kanan atas untuk konsultasi AI interaktif daring. Stok aktif kulkas Anda saat ini: ${inventory.length} vial.`;
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text:
            language === 'en'
              ? 'Failed to connect to API. Please make sure the API Key is valid or use built-in offline mode.'
              : 'Gagal terhubung ke API. Pastikan API Key valid atau gunakan mode offline bawaan.',
          time: timeNow,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          setActiveView('chat');
          setIsOpen(true);
        }}
        style={styles.floatingButton}
      >
        <Sparkles size={20} color="#231716" />
      </TouchableOpacity>

      <Modal visible={isOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.chatCard}>
            {/* Tampilan 1: Layar Chat */}
            {activeView === 'chat' && (
              <>
                <View style={styles.chatHeader}>
                  <View style={styles.headerTitleRow}>
                    <View style={styles.botIconWrap}>
                      <Bot size={18} color={COLORS.accent} />
                    </View>
                    <View>
                      <Text style={styles.headerTitle}>BioStack AI Expert</Text>
                                      <Text style={styles.headerSubtitle}>
                        {apiKey && settings?.allowAiNetwork
                          ? `Connected (${aiProvider.toUpperCase()})`
                          : settings?.allowAiNetwork
                            ? 'Offline Knowledge Mode'
                            : 'Privacy Mode • Online AI OFF'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.headerActions}>
                    <TouchableOpacity
                      onPress={() => setActiveView('settings')}
                      style={styles.iconBtn}
                    >
                      <Settings size={18} color="#94a3b8" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setIsOpen(false)}
                      style={styles.iconBtn}
                    >
                      <X size={18} color="#94a3b8" />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView
                  style={styles.messagesScroll}
                  contentContainerStyle={styles.messagesContainer}
                  showsVerticalScrollIndicator={false}
                >
                  {messages.map((m) => (
                    <View
                      key={m.id}
                      style={[
                        styles.messageBubble,
                        m.sender === 'user' ? styles.userBubble : styles.aiBubble,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          m.sender === 'user' ? styles.userMessageText : styles.aiMessageText,
                        ]}
                      >
                        {m.text}
                      </Text>
                      <Text style={styles.messageTime}>{m.time}</Text>
                    </View>
                  ))}
                  {isLoading && (
                    <View style={styles.loadingBubble}>
                      <ActivityIndicator size="small" color={COLORS.accent} />
                      <Text style={styles.loadingText}>
                        {language === 'en' ? 'Preparing clinical response...' : 'Menyiapkan respon klinis...'}
                      </Text>
                    </View>
                  )}
                </ScrollView>

                <View style={styles.inputBar}>
                  <TextInput
                    style={styles.textInput}
                    placeholder={language === 'en' ? 'Ask about dosage or peptides...' : 'Tanya seputar dosis atau peptida...'}
                    placeholderTextColor="#64748b"
                    value={inputText}
                    onChangeText={setInputText}
                    onSubmitEditing={handleSendMessage}
                  />
                  <TouchableOpacity
                    disabled={isLoading || !inputText.trim()}
                    onPress={handleSendMessage}
                    style={[
                      styles.sendBtn,
                      (!inputText.trim() || isLoading) && styles.sendBtnDisabled,
                    ]}
                  >
                    <Send size={15} color="#231716" />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Tampilan 2: Layar Pengaturan API Key (In-View) */}
            {activeView === 'settings' && (
              <View style={styles.settingsContainer}>
                <View style={styles.chatHeader}>
                  <View style={styles.headerTitleRow}>
                    <TouchableOpacity
                      onPress={() => setActiveView('chat')}
                      style={styles.backBtn}
                    >
                      <ChevronLeft size={20} color={COLORS.accent} />
                    </TouchableOpacity>
                    <View>
                      <Text style={styles.headerTitle}>
                        {language === 'en' ? 'API Key Settings' : 'Pengaturan API Key'}
                      </Text>
                      <Text style={styles.headerSubtitle}>
                        {language === 'en' ? 'AI Engine Connection' : 'Koneksi Engine AI'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.iconBtn}>
                    <X size={18} color="#94a3b8" />
                  </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.settingsBody} showsVerticalScrollIndicator={false}>
                  <View style={styles.infoBox}>
                    <Key size={18} color={COLORS.accent} />
                    <Text style={styles.settingsDesc}>
                      {language === 'en'
                        ? 'Enter Google Gemini API Key (or OpenAI). The key is stored locally and securely on your device.'
                        : 'Masukkan Google Gemini API Key (atau OpenAI). Kunci tersimpan secara lokal dan privat di perangkat Anda.'}
                    </Text>
                  </View>

                  <Text style={styles.fieldLabel}>
                    {language === 'en' ? 'Select AI Provider:' : 'Pilih Provider AI:'}
                  </Text>
                  <View style={styles.providerRow}>
                    <TouchableOpacity
                      onPress={() => setAiProvider('gemini')}
                      style={[styles.providerBtn, aiProvider === 'gemini' && styles.providerBtnActive]}
                    >
                      <Text style={[styles.providerBtnText, aiProvider === 'gemini' && styles.providerBtnTextActive]}>
                        Google Gemini
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setAiProvider('openai')}
                      style={[styles.providerBtn, aiProvider === 'openai' && styles.providerBtnActive]}
                    >
                      <Text style={[styles.providerBtnText, aiProvider === 'openai' && styles.providerBtnTextActive]}>
                        OpenAI ChatGPT
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.fieldLabel}>API Key:</Text>
                  <TextInput
                    style={styles.keyInput}
                    placeholder={language === 'en' ? 'Paste API Key here...' : 'Tempel API Key di sini...'}
                    placeholderTextColor="#475569"
                    value={apiKey}
                    onChangeText={setApiKey}
                    autoCapitalize="none"
                    secureTextEntry
                  />

                  <View style={styles.settingsPrivacyNote}>
                    <Text style={styles.settingsPrivacyText}>
                      {language === 'en'
                        ? 'Online AI connection is only used when privacy permission in BioStack Settings is enabled. API key is not included in BioStack data backup.'
                        : 'Koneksi AI online hanya digunakan saat izin privasi di Pengaturan BioStack diaktifkan. API key tidak masuk ke backup data BioStack.'}
                    </Text>
                  </View>

                  <TouchableOpacity onPress={saveSettings} style={styles.saveKeyBtn}>
                    <Check size={16} color="#231716" />
                    <Text style={styles.saveKeyBtnText}>
                      {language === 'en' ? 'Save Settings' : 'Simpan Pengaturan'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setActiveView('chat')} style={styles.cancelSettingsBtn}>
                    <Text style={styles.cancelSettingsText}>
                      {language === 'en' ? 'Back to Chat' : 'Kembali ke Chat'}
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 92,
    right: 18,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    zIndex: 999,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  chatCard: {
    height: '82%',
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  botIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(223, 138, 58, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    padding: 6,
  },
  backBtn: {
    padding: 4,
    marginRight: 4,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContainer: {
    padding: 14,
    gap: 10,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 14,
    gap: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.accent,
    borderBottomRightRadius: 2,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 2,
  },
  messageText: {
    fontSize: 12,
    lineHeight: 18,
  },
  userMessageText: {
    color: '#231716',
    fontWeight: '700',
  },
  aiMessageText: {
    color: '#e2e8f0',
  },
  messageTime: {
    fontSize: 8,
    color: '#64748b',
    alignSelf: 'flex-end',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: COLORS.cardElevated,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  loadingText: {
    fontSize: 11,
    color: COLORS.muted,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgDarker,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: COLORS.text,
    fontSize: 12,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.cardElevated,
  },
  settingsContainer: {
    flex: 1,
  },
  settingsBody: {
    padding: 16,
    gap: 12,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(223, 138, 58, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(223, 138, 58, 0.2)',
    borderRadius: 12,
    padding: 12,
  },
  settingsDesc: {
    flex: 1,
    fontSize: 11,
    color: COLORS.muted,
    lineHeight: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.muted,
    marginTop: 4,
  },
  providerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  providerBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.cardElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  providerBtnActive: {
    backgroundColor: 'rgba(223, 138, 58, 0.16)',
    borderColor: COLORS.accent,
  },
  providerBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.muted,
  },
  providerBtnTextActive: {
    color: COLORS.accent,
  },
  keyInput: {
    backgroundColor: COLORS.bgDarker,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    color: COLORS.text,
    fontSize: 12,
  },
  settingsPrivacyNote: {
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(223, 138, 58, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(223, 138, 58, 0.18)',
  },
  settingsPrivacyText: {
    fontSize: 9,
    lineHeight: 14,
    color: '#94a3b8',
  },
  saveKeyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  saveKeyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#231716',
  },
  cancelSettingsBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelSettingsText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
});
