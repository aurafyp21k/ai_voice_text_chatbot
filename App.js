import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useState, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as Speech from 'expo-speech';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI('AIzaSyCJeBrJ0liMxye8rEgScMfUqjv7mLEoRhQ');

// Language configurations
const LANGUAGES = {
  'en-US': { name: 'English', code: 'en-US' },
  'ur-PK': { name: 'اردو', code: 'ur-PK' },
  'hi-IN': { name: 'हिंदी', code: 'hi-IN' },
  'ar-SA': { name: 'العربية', code: 'ar-SA' },
  'es-ES': { name: 'Español', code: 'es-ES' },
  'fr-FR': { name: 'Français', code: 'fr-FR' },
};

// HTML for WebView with Web Speech API
const getHtmlContent = (language) => `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; }
        #status { 
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            display: none;
        }
    </style>
</head>
<body>
    <div id="status">Listening...</div>
    <script>
        let recognition = null;
        
        if ('webkitSpeechRecognition' in window) {
            recognition = new webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = '${language}';

            recognition.onstart = () => {
                document.getElementById('status').style.display = 'block';
                window.ReactNativeWebView.postMessage('STARTED');
            };

            recognition.onend = () => {
                document.getElementById('status').style.display = 'none';
                window.ReactNativeWebView.postMessage('STOP');
            };

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                window.ReactNativeWebView.postMessage(transcript);
            };

            recognition.onerror = (event) => {
                window.ReactNativeWebView.postMessage('ERROR: ' + event.error);
            };
        }

        function startListening() {
            if (recognition) {
                recognition.start();
            } else {
                window.ReactNativeWebView.postMessage('ERROR: Speech recognition not supported');
            }
        }

        // Start listening immediately when the page loads
        startListening();
    </script>
</body>
</html>
`;

export default function App() {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const speechTimeoutRef = useRef(null);
  const scrollViewRef = useRef(null);

  const stopSpeaking = async () => {
    try {
      await Speech.stop();
      setIsSpeaking(false);
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = null;
      }
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  };

  const handleWebViewMessage = (event) => {
    const message = event.nativeEvent.data;
    if (message === 'STARTED') {
      stopSpeaking();
    } else if (message === 'STOP') {
      setShowVoiceInput(false);
    } else if (message.startsWith('ERROR:')) {
      alert(message);
      setShowVoiceInput(false);
    } else {
      setText('');
      handleSendMessage(message);
      setShowVoiceInput(false);
    }
  };

  const cleanTextForSpeech = (text) => {
    return text
      .replace(/\*/g, '')
      .replace(/[\[\](){}]/g, '')
      .replace(/[#@$%^&+=]/g, '')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    await stopSpeaking();

    const userMessage = { text: message, sender: 'user', language: selectedLanguage };
    setMessages(prev => [...prev, userMessage]);
    scrollToBottom();

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // Create a context from previous messages
      const recentMessages = messages.slice(-4); // Get last 4 messages for context
      const context = recentMessages.map(msg => 
        `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`
      ).join('\n');
      
      // Define categories and their disclaimers
      const categories = {
        medical: {
          keywords: ['pain', 'sick', 'disease', 'symptom', 'doctor', 'hospital', 'medicine', 'treatment', 'diagnosis', 'illness', 'health', 'medical'],
          disclaimer: 'IMPORTANT: I am an AI assistant and cannot provide medical advice. For medical concerns, please consult a qualified healthcare professional. I can only provide general information. Please note that any information provided should not be considered as medical advice.',
          guidance: 'Please provide general information about the medical condition and any relevant symptoms. Include basic information about the condition, its causes, and common treatments. Remember to emphasize the importance of consulting a qualified healthcare professional for accurate diagnosis and treatment.'
        },
        mechanical: {
          keywords: ['engine', 'repair', 'fix', 'broken', 'machine', 'mechanical', 'vehicle', 'car', 'motor', 'part', 'maintenance', 'technical', 'heated', 'overheating', 'temperature', 'coolant', 'oil', 'brake', 'transmission', 'battery', 'tire', 'wheel', 'suspension', 'exhaust', 'fuel', 'gas', 'petrol', 'diesel'],
          disclaimer: 'IMPORTANT: I am an AI assistant and can only provide general guidance. For specific mechanical issues, please consult a qualified mechanic or technician. Always ensure safety first and follow proper procedures. Here are some general steps you can take, but remember to prioritize safety and consult a professional if needed:',
          guidance: 'Please provide general troubleshooting steps and preventive measures for the issue. Include basic safety checks, common causes, and immediate actions that can be taken. Focus on steps that can help prevent further damage while waiting for professional help. Remember to emphasize safety and the importance of professional consultation for proper diagnosis and repair.'
        }
      };

      // Check message category
      let category = 'general';
      let disclaimer = '';
      let guidance = '';
      
      for (const [cat, data] of Object.entries(categories)) {
        if (data.keywords.some(keyword => message.toLowerCase().includes(keyword))) {
          category = cat;
          disclaimer = data.disclaimer;
          guidance = data.guidance || '';
          break;
        }
      }
      
      const prompt = category !== 'general'
        ? `${disclaimer}\n\n${guidance}\n\nPrevious conversation context:\n${context}\n\nPlease provide a clear, concise, and accurate response to the following query in ${LANGUAGES[selectedLanguage].name}. Consider the previous conversation context when responding. Avoid using special characters, markdown, or formatting symbols in your response. Current query: ${message}`
        : `Previous conversation context:\n${context}\n\nPlease provide a clear, concise, and accurate response to the following query in ${LANGUAGES[selectedLanguage].name}. Consider the previous conversation context when responding. Avoid using special characters, markdown, or formatting symbols in your response. Current query: ${message}`;
      
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      const aiMessage = { text: response, sender: 'ai', language: selectedLanguage };
      setMessages(prev => [...prev, aiMessage]);
      scrollToBottom();

      const cleanResponse = cleanTextForSpeech(response);
      await Speech.speak(cleanResponse, {
        language: selectedLanguage,
        pitch: 1.0,
        rate: 0.9,
        onStart: () => setIsSpeaking(true),
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = { text: 'Sorry, I encountered an error.', sender: 'ai', language: selectedLanguage };
      setMessages(prev => [...prev, errorMessage]);
      scrollToBottom();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.languageSelector}>
          <Text style={styles.languageLabel}>Language:</Text>
          <Picker
            selectedValue={selectedLanguage}
            style={styles.picker}
            onValueChange={(itemValue) => {
              setSelectedLanguage(itemValue);
              stopSpeaking();
            }}
          >
            {Object.entries(LANGUAGES).map(([code, { name }]) => (
              <Picker.Item key={code} label={name} value={code} />
            ))}
          </Picker>
        </View>

        <ScrollView 
          ref={scrollViewRef}
          style={styles.chatContainer}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
        >
          {messages.map((message, index) => (
            <View
              key={index}
              style={[
                styles.messageBubble,
                message.sender === 'user' ? styles.userMessage : styles.aiMessage,
              ]}
            >
              <Text style={[
                styles.messageText,
                message.sender === 'user' ? styles.userMessageText : styles.aiMessageText,
                { writingDirection: message.language === 'ur-PK' ? 'rtl' : 'ltr' }
              ]}>
                {message.text}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              { writingDirection: selectedLanguage === 'ur-PK' ? 'rtl' : 'ltr' }
            ]}
            value={text}
            onChangeText={(newText) => {
              setText(newText);
              stopSpeaking();
            }}
            placeholder="Type a message..."
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => {
              handleSendMessage(text);
              setText('');
            }}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.voiceButton, isSpeaking && styles.voiceButtonActive]}
            onPress={() => {
              stopSpeaking();
              setShowVoiceInput(true);
            }}
          >
            <Text style={styles.voiceButtonText}>
              {isSpeaking ? '🔊' : '🎤'}
            </Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={showVoiceInput}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            stopSpeaking();
            setShowVoiceInput(false);
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>Speak now...</Text>
              <WebView
                source={{ html: getHtmlContent(selectedLanguage) }}
                onMessage={handleWebViewMessage}
                style={styles.webview}
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  stopSpeaking();
                  setShowVoiceInput(false);
                }}
              >
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <StatusBar style="auto" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  languageLabel: {
    fontSize: 25,
    marginRight: 10,
    // padding: 20,
  },
  picker: {
    flex: 1,
    height: 50,
  },
  chatContainer: {
    flex: 1,
    padding: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
  },
  messageText: {
    fontSize: 16,
  },
  userMessageText: {
    color: '#fff',
  },
  aiMessageText: {
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    justifyContent: 'center',
    marginRight: 10,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  voiceButton: {
    backgroundColor: '#34C759',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  voiceButtonActive: {
    backgroundColor: '#FF3B30',
  },
  voiceButtonText: {
    color: '#fff',
    fontSize: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
  },
  webview: {
    width: 1,
    height: 1,
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
});
