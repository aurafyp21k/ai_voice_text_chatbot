// import { StatusBar } from 'expo-status-bar';
// import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Modal } from 'react-native';
// import { Picker } from '@react-native-picker/picker';
// import { useState, useRef } from 'react';
// import { GoogleGenerativeAI } from '@google/generative-ai';
// import * as Speech from 'expo-speech';
// import { WebView } from 'react-native-webview';
// import { SafeAreaView } from 'react-native-safe-area-context';

// // Initialize Gemini API
// const genAI = new GoogleGenerativeAI('AIzaSyCJeBrJ0liMxye8rEgScMfUqjv7mLEoRhQ');

// // Language configurations
// const LANGUAGES = {
//   'en-US': { name: 'English', code: 'en-US' },
//   'ur-PK': { name: 'اردو', code: 'ur-PK' },
//   'hi-IN': { name: 'हिंदी', code: 'hi-IN' },
//   'ar-SA': { name: 'العربية', code: 'ar-SA' },
//   'es-ES': { name: 'Español', code: 'es-ES' },
//   'fr-FR': { name: 'Français', code: 'fr-FR' },
// };

// // HTML for WebView with Web Speech API
// const getHtmlContent = (language) => `
// <!DOCTYPE html>
// <html>
// <head>
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <style>
//         body { margin: 0; padding: 0; }
//         #status { 
//             position: fixed;
//             bottom: 20px;
//             left: 50%;
//             transform: translateX(-50%);
//             background: rgba(0,0,0,0.7);
//             color: white;
//             padding: 10px 20px;
//             border-radius: 20px;
//             display: none;
//         }
//     </style>
// </head>
// <body>
//     <div id="status">Listening...</div>
//     <script>
//         let recognition = null;
        
//         if ('webkitSpeechRecognition' in window) {
//             recognition = new webkitSpeechRecognition();
//             recognition.continuous = false;
//             recognition.interimResults = false;
//             recognition.lang = '${language}';

//             recognition.onstart = () => {
//                 document.getElementById('status').style.display = 'block';
//                 window.ReactNativeWebView.postMessage('STARTED');
//             };

//             recognition.onend = () => {
//                 document.getElementById('status').style.display = 'none';
//                 window.ReactNativeWebView.postMessage('STOP');
//             };

//             recognition.onresult = (event) => {
//                 const transcript = event.results[0][0].transcript;
//                 window.ReactNativeWebView.postMessage(transcript);
//             };

//             recognition.onerror = (event) => {
//                 window.ReactNativeWebView.postMessage('ERROR: ' + event.error);
//             };
//         }

//         function startListening() {
//             if (recognition) {
//                 recognition.start();
//             } else {
//                 window.ReactNativeWebView.postMessage('ERROR: Speech recognition not supported');
//             }
//         }

//         // Start listening immediately when the page loads
//         startListening();
//     </script>
// </body>
// </html>
// `;

// export default function App() {
//   const [text, setText] = useState('');
//   const [messages, setMessages] = useState([]);
//   const [isSpeaking, setIsSpeaking] = useState(false);
//   const [showVoiceInput, setShowVoiceInput] = useState(false);
//   const [selectedLanguage, setSelectedLanguage] = useState('en-US');
//   const speechTimeoutRef = useRef(null);
//   const scrollViewRef = useRef(null);

//   const stopSpeaking = async () => {
//     try {
//       await Speech.stop();
//       setIsSpeaking(false);
//       if (speechTimeoutRef.current) {
//         clearTimeout(speechTimeoutRef.current);
//         speechTimeoutRef.current = null;
//       }
//     } catch (error) {
//       console.error('Error stopping speech:', error);
//     }
//   };

//   const handleWebViewMessage = (event) => {
//     const message = event.nativeEvent.data;
//     if (message === 'STARTED') {
//       stopSpeaking();
//     } else if (message === 'STOP') {
//       setShowVoiceInput(false);
//     } else if (message.startsWith('ERROR:')) {
//       alert(message);
//       setShowVoiceInput(false);
//     } else {
//       setText('');
//       handleSendMessage(message);
//       setShowVoiceInput(false);
//     }
//   };

//   const cleanTextForSpeech = (text) => {
//     return text
//       .replace(/\*/g, '')
//       .replace(/[\[\](){}]/g, '')
//       .replace(/[#@$%^&+=]/g, '')
//       .replace(/\n/g, ' ')
//       .replace(/\s+/g, ' ')
//       .trim();
//   };

//   const scrollToBottom = () => {
//     if (scrollViewRef.current) {
//       scrollViewRef.current.scrollToEnd({ animated: true });
//     }
//   };

//   const handleSendMessage = async (message) => {
//     if (!message.trim()) return;

//     await stopSpeaking();

//     const userMessage = { text: message, sender: 'user', language: selectedLanguage };
//     setMessages(prev => [...prev, userMessage]);
//     scrollToBottom();

//     try {
//       const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
//       // Create a context from previous messages
//       const recentMessages = messages.slice(-4); // Get last 4 messages for context
//       const context = recentMessages.map(msg => 
//         `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`
//       ).join('\n');
      
//       // Define categories and their disclaimers
//       const categories = {
//         medical: {
//           keywords: ['pain', 'sick', 'disease', 'symptom', 'doctor', 'hospital', 'medicine', 'treatment', 'diagnosis', 'illness', 'health', 'medical'],
//           disclaimer: 'IMPORTANT: I am an AI assistant and cannot provide medical advice. For medical concerns, please consult a qualified healthcare professional. I can only provide general information. Please note that any information provided should not be considered as medical advice.',
//           guidance: 'Please provide general information about the medical condition and any relevant symptoms. Include basic information about the condition, its causes, and common treatments. Remember to emphasize the importance of consulting a qualified healthcare professional for accurate diagnosis and treatment.'
//         },
//         mechanical: {
//           keywords: ['engine', 'repair', 'fix', 'broken', 'machine', 'mechanical', 'vehicle', 'car', 'motor', 'part', 'maintenance', 'technical', 'heated', 'overheating', 'temperature', 'coolant', 'oil', 'brake', 'transmission', 'battery', 'tire', 'wheel', 'suspension', 'exhaust', 'fuel', 'gas', 'petrol', 'diesel'],
//           disclaimer: 'IMPORTANT: I am an AI assistant and can only provide general guidance. For specific mechanical issues, please consult a qualified mechanic or technician. Always ensure safety first and follow proper procedures. Here are some general steps you can take, but remember to prioritize safety and consult a professional if needed:',
//           guidance: 'Please provide general troubleshooting steps and preventive measures for the issue. Include basic safety checks, common causes, and immediate actions that can be taken. Focus on steps that can help prevent further damage while waiting for professional help. Remember to emphasize safety and the importance of professional consultation for proper diagnosis and repair.'
//         }
//       };

//       // Check message category
//       let category = 'general';
//       let disclaimer = '';
//       let guidance = '';
      
//       for (const [cat, data] of Object.entries(categories)) {
//         if (data.keywords.some(keyword => message.toLowerCase().includes(keyword))) {
//           category = cat;
//           disclaimer = data.disclaimer;
//           guidance = data.guidance || '';
//           break;
//         }
//       }
      
//       const prompt = category !== 'general'
//         ? `${disclaimer}\n\n${guidance}\n\nPrevious conversation context:\n${context}\n\nPlease provide a clear, concise, and accurate response to the following query in ${LANGUAGES[selectedLanguage].name}. Consider the previous conversation context when responding. Avoid using special characters, markdown, or formatting symbols in your response. Current query: ${message}`
//         : `Previous conversation context:\n${context}\n\nPlease provide a clear, concise, and accurate response to the following query in ${LANGUAGES[selectedLanguage].name}. Consider the previous conversation context when responding. Avoid using special characters, markdown, or formatting symbols in your response. Current query: ${message}`;
      
//       const result = await model.generateContent(prompt);
//       const response = result.response.text();

//       const aiMessage = { text: response, sender: 'ai', language: selectedLanguage };
//       setMessages(prev => [...prev, aiMessage]);
//       scrollToBottom();

//       const cleanResponse = cleanTextForSpeech(response);
//       await Speech.speak(cleanResponse, {
//         language: selectedLanguage,
//         pitch: 1.0,
//         rate: 0.9,
//         onStart: () => setIsSpeaking(true),
//         onDone: () => setIsSpeaking(false),
//         onError: () => setIsSpeaking(false),
//       });
//     } catch (error) {
//       console.error('Error:', error);
//       const errorMessage = { text: 'Sorry, I encountered an error.', sender: 'ai', language: selectedLanguage };
//       setMessages(prev => [...prev, errorMessage]);
//       scrollToBottom();
//     }
//   };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <View style={styles.container}>
//         <View style={styles.languageSelector}>
//           <Text style={styles.languageLabel}>Language:</Text>
//           <Picker
//             selectedValue={selectedLanguage}
//             style={styles.picker}
//             onValueChange={(itemValue) => {
//               setSelectedLanguage(itemValue);
//               stopSpeaking();
//             }}
//           >
//             {Object.entries(LANGUAGES).map(([code, { name }]) => (
//               <Picker.Item key={code} label={name} value={code} />
//             ))}
//           </Picker>
//         </View>

//         <ScrollView 
//           ref={scrollViewRef}
//           style={styles.chatContainer}
//           onContentSizeChange={scrollToBottom}
//           onLayout={scrollToBottom}
//         >
//           {messages.map((message, index) => (
//             <View
//               key={index}
//               style={[
//                 styles.messageBubble,
//                 message.sender === 'user' ? styles.userMessage : styles.aiMessage,
//               ]}
//             >
//               <Text style={[
//                 styles.messageText,
//                 message.sender === 'user' ? styles.userMessageText : styles.aiMessageText,
//                 { writingDirection: message.language === 'ur-PK' ? 'rtl' : 'ltr' }
//               ]}>
//                 {message.text}
//               </Text>
//             </View>
//           ))}
//         </ScrollView>

//         <View style={styles.inputContainer}>
//           <TextInput
//             style={[
//               styles.input,
//               { writingDirection: selectedLanguage === 'ur-PK' ? 'rtl' : 'ltr' }
//             ]}
//             value={text}
//             onChangeText={(newText) => {
//               setText(newText);
//               stopSpeaking();
//             }}
//             placeholder="Type a message..."
//             multiline
//           />
//           <TouchableOpacity
//             style={styles.sendButton}
//             onPress={() => {
//               handleSendMessage(text);
//               setText('');
//             }}
//           >
//             <Text style={styles.sendButtonText}>Send</Text>
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={[styles.voiceButton, isSpeaking && styles.voiceButtonActive]}
//             onPress={() => {
//               stopSpeaking();
//               setShowVoiceInput(true);
//             }}
//           >
//             <Text style={styles.voiceButtonText}>
//               {isSpeaking ? '🔊' : '🎤'}
//             </Text>
//           </TouchableOpacity>
//         </View>

//         <Modal
//           visible={showVoiceInput}
//           transparent={true}
//           animationType="fade"
//           onRequestClose={() => {
//             stopSpeaking();
//             setShowVoiceInput(false);
//           }}
//         >
//           <View style={styles.modalContainer}>
//             <View style={styles.modalContent}>
//               <Text style={styles.modalText}>Speak now...</Text>
//               <WebView
//                 source={{ html: getHtmlContent(selectedLanguage) }}
//                 onMessage={handleWebViewMessage}
//                 style={styles.webview}
//               />
//               <TouchableOpacity
//                 style={styles.closeButton}
//                 onPress={() => {
//                   stopSpeaking();
//                   setShowVoiceInput(false);
//                 }}
//               >
//                 <Text style={styles.closeButtonText}>Cancel</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </Modal>

//         <StatusBar style="auto" />
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//   },
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//   },
//   languageSelector: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 10,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#ddd',
//   },
//   languageLabel: {
//     fontSize: 25,
//     marginRight: 10,
//     // padding: 20,
//   },
//   picker: {
//     flex: 1,
//     height: 50,
//   },
//   chatContainer: {
//     flex: 1,
//     padding: 10,
//   },
//   messageBubble: {
//     maxWidth: '80%',
//     padding: 10,
//     borderRadius: 10,
//     marginVertical: 5,
//   },
//   userMessage: {
//     alignSelf: 'flex-end',
//     backgroundColor: '#007AFF',
//   },
//   aiMessage: {
//     alignSelf: 'flex-start',
//     backgroundColor: '#E5E5EA',
//   },
//   messageText: {
//     fontSize: 16,
//   },
//   userMessageText: {
//     color: '#fff',
//   },
//   aiMessageText: {
//     color: '#000',
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     padding: 10,
//     backgroundColor: '#fff',
//     borderTopWidth: 1,
//     borderTopColor: '#ddd',
//     alignItems: 'center',
//   },
//   input: {
//     flex: 1,
//     backgroundColor: '#f0f0f0',
//     borderRadius: 20,
//     paddingHorizontal: 15,
//     paddingVertical: 8,
//     marginRight: 10,
//     maxHeight: 100,
//   },
//   sendButton: {
//     backgroundColor: '#007AFF',
//     borderRadius: 20,
//     paddingHorizontal: 15,
//     paddingVertical: 8,
//     justifyContent: 'center',
//     marginRight: 10,
//   },
//   sendButtonText: {
//     color: '#fff',
//     fontSize: 16,
//   },
//   voiceButton: {
//     backgroundColor: '#34C759',
//     borderRadius: 20,
//     paddingHorizontal: 15,
//     paddingVertical: 8,
//     justifyContent: 'center',
//   },
//   voiceButtonActive: {
//     backgroundColor: '#FF3B30',
//   },
//   voiceButtonText: {
//     color: '#fff',
//     fontSize: 20,
//   },
//   modalContainer: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   modalContent: {
//     backgroundColor: 'white',
//     borderRadius: 20,
//     padding: 20,
//     width: '80%',
//     alignItems: 'center',
//   },
//   modalText: {
//     fontSize: 18,
//     marginBottom: 20,
//   },
//   webview: {
//     width: 1,
//     height: 1,
//   },
//   closeButton: {
//     marginTop: 20,
//     padding: 10,
//     backgroundColor: '#FF3B30',
//     borderRadius: 10,
//   },
//   closeButtonText: {
//     color: 'white',
//     fontSize: 16,
//   },
// });


import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Modal, Alert, ActivityIndicator, ImageBackground } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useState, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as Speech from 'expo-speech';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
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

const getHtmlContent = (language) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>
  <script>
    let recognition = null;
    
    function initSpeechRecognition() {
      if (!('webkitSpeechRecognition' in window)) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          error: 'Speech recognition not supported'
        }));
        return;
      }

      recognition = new webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = '${language}';

      recognition.onstart = () => {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'status',
          status: 'started'
        }));
      };

      recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        const transcript = result[0].transcript;
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'result',
          text: transcript,
          isFinal: result.isFinal
        }));
      };

      recognition.onerror = (event) => {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          error: event.error
        }));
      };

      recognition.onend = () => {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'status',
          status: 'ended'
        }));
      };
    }

    function startRecording() {
      if (!recognition) {
        initSpeechRecognition();
      }
      recognition.start();
    }

    function stopRecording() {
      if (recognition) {
        recognition.stop();
      }
    }

    // Initialize when the page loads
    initSpeechRecognition();
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
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState(null);
  const speechTimeoutRef = useRef(null);
  const scrollViewRef = useRef(null);
  const webViewRef = useRef(null);
  const lastResultsRef = useRef([]);

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

  const startRecording = () => {
    try {
      setIsRecording(true);
      setRecordingError(null);
      lastResultsRef.current = [];
      webViewRef.current?.injectJavaScript('startRecording();');
    } catch (error) {
      console.error('Error starting recording:', error);
      setRecordingError('Error starting recording');
      Alert.alert('Failed to start recording', error.message);
    }
  };

  const stopRecording = () => {
    try {
      setIsRecording(false);
      webViewRef.current?.injectJavaScript('stopRecording();');
    } catch (error) {
      console.error('Error stopping recording:', error);
      setRecordingError('Error stopping recording');
      Alert.alert('Failed to stop recording', error.message);
    }
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('WebView message:', data);

      switch (data.type) {
        case 'result':
          if (data.isFinal) {
            lastResultsRef.current = [...lastResultsRef.current, data.text];
            if (lastResultsRef.current.length > 3) {
              lastResultsRef.current.shift();
            }
            setText(data.text);
          }
          break;
        case 'error':
          setRecordingError(data.error);
          Alert.alert('Recording Error', data.error);
          break;
        case 'status':
          if (data.status === 'ended') {
            setIsRecording(false);
            setTimeout(() => {
              if (lastResultsRef.current.length > 0) {
                const finalText = lastResultsRef.current.reduce((a, b) => 
                  a.length > b.length ? a : b
                );
                if (finalText.trim()) {
                  handleSendMessage(finalText);
                  setText('');
                }
                lastResultsRef.current = [];
              }
              setShowVoiceInput(false);
            }, 1000);
          }
          break;
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
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
      
      const recentMessages = messages.slice(-4);
      const context = recentMessages.map(msg => 
        `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`
      ).join('\n');
      
      const prompt = `Previous conversation context:\n${context}\n\nPlease provide a clear, concise, and accurate response to the following query in ${LANGUAGES[selectedLanguage].name}. Consider the previous conversation context when responding. Avoid using special characters, markdown, or formatting symbols in your response. Current query: ${message}`;
      
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      const aiMessage = { text: response, sender: 'ai', language: selectedLanguage };
      setMessages(prev => [...prev, aiMessage]);
      scrollToBottom();

      const cleanResponse = response
        .replace(/\*/g, '')
        .replace(/[\[\](){}]/g, '')
        .replace(/[#@$%^&+=]/g, '')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

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

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#6a11cb', '#2575fc']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Gemini AI Assistant</Text>
            <View style={styles.languageSelector}>
              <MaterialIcons name="language" size={20} color="#fff" />
              <Picker
                selectedValue={selectedLanguage}
                style={styles.picker}
                dropdownIconColor="#fff"
                onValueChange={(itemValue) => {
                  setSelectedLanguage(itemValue);
                  stopSpeaking();
                }}
              >
                {Object.entries(LANGUAGES).map(([code, { name }]) => (
                  <Picker.Item 
                    key={code} 
                    label={name} 
                    value={code} 
                    color={selectedLanguage === code ? '#2575fc' : '#333'}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Chat Container */}
          <View style={styles.mainContent}>
            <ScrollView 
              ref={scrollViewRef}
              style={styles.chatContainer}
              contentContainerStyle={styles.chatContentContainer}
              onContentSizeChange={scrollToBottom}
              onLayout={scrollToBottom}
              showsVerticalScrollIndicator={false}
            >
              {messages.length === 0 ? (
                <View style={styles.welcomeContainer}>
                  <Ionicons name="chatbubbles" size={60} color="#fff" />
                  <Text style={styles.welcomeText}>How can I help you today?</Text>
                  <Text style={styles.welcomeSubtext}>Ask me anything in your preferred language</Text>
                </View>
              ) : (
                messages.map((message, index) => (
                  <View
                    key={index}
                    style={[
                      styles.messageBubble,
                      message.sender === 'user' ? styles.userMessage : styles.aiMessage,
                    ]}
                  >
                    <View style={styles.messageHeader}>
                      <Text style={styles.senderText}>
                        {message.sender === 'user' ? 'You' : 'Gemini'}
                      </Text>
                      <Text style={styles.languageIndicator}>
                        {LANGUAGES[message.language].name}
                      </Text>
                    </View>
                    <Text style={[
                      styles.messageText,
                      message.sender === 'user' ? styles.userMessageText : styles.aiMessageText,
                      { writingDirection: message.language === 'ur-PK' ? 'rtl' : 'ltr' }
                    ]}>
                      {message.text}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Input Area */}
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
                placeholderTextColor="#999"
                multiline
              />
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.voiceButton]}
                  onPress={() => {
                    stopSpeaking();
                    setShowVoiceInput(true);
                    startRecording();
                  }}
                >
                  <MaterialIcons 
                    name={isSpeaking ? "volume-up" : "keyboard-voice"} 
                    size={24} 
                    color="#fff" 
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.sendButton]}
                  onPress={() => {
                    handleSendMessage(text);
                    setText('');
                  }}
                  disabled={!text.trim()}
                >
                  <Ionicons name="send" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Voice Input Modal */}
          <Modal
            visible={showVoiceInput}
            transparent={true}
            animationType="fade"
            onRequestClose={() => {
              stopRecording();
              setShowVoiceInput(false);
            }}
          >
            <View style={styles.modalOverlay}>
              <LinearGradient
                colors={['rgba(106, 17, 203, 0.9)', 'rgba(37, 117, 252, 0.9)']}
                style={styles.modalContainer}
              >
                <View style={styles.modalContent}>
                  <View style={styles.recordingIndicator}>
                    {isRecording ? (
                      <>
                        <View style={styles.recordingPulse}></View>
                        <FontAwesome name="microphone" size={60} color="#fff" />
                      </>
                    ) : (
                      <FontAwesome name="microphone-slash" size={60} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.modalText}>
                    {isRecording ? 'Listening... Speak now' : 'Recording stopped'}
                  </Text>
                  {recordingError && (
                    <Text style={styles.errorText}>{recordingError}</Text>
                  )}
                  <View style={styles.modalButtons}>
                    {isRecording ? (
                      <TouchableOpacity
                        style={[styles.modalButton, styles.stopButton]}
                        onPress={stopRecording}
                      >
                        <Text style={styles.modalButtonText}>Stop</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.modalButton, styles.startButton]}
                        onPress={startRecording}
                      >
                        <Text style={styles.modalButtonText}>Start Again</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.modalButton, styles.closeButton]}
                      onPress={() => {
                        stopRecording();
                        setShowVoiceInput(false);
                      }}
                    >
                      <Text style={styles.modalButtonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </Modal>

          <WebView
            ref={webViewRef}
            source={{ html: getHtmlContent(selectedLanguage) }}
            style={{ width: 0, height: 0 }}
            onMessage={handleWebViewMessage}
          />

          <StatusBar style="light" />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
safeArea: {
  flex: 1,
  backgroundColor: '#6a11cb',
},
background: {
  flex: 1,
},
container: {
  flex: 1,
  paddingHorizontal: 16,
  paddingTop: 16,
},
header: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20,
},
headerTitle: {
  fontSize: 22,
  fontWeight: 'bold',
  color: '#fff',
},
languageSelector: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  borderRadius: 20,
  paddingHorizontal: 10,
},
picker: {
  height: 40,
  width: 120,
  color: '#fff',
},
mainContent: {
  flex: 1,
  marginBottom: 16,
},
chatContainer: {
  flex: 1,
  marginBottom: 12,
  borderRadius: 20,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  padding: 16,
},
chatContentContainer: {
  paddingBottom: 16,
},
welcomeContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  padding: 40,
},
welcomeText: {
  fontSize: 22,
  fontWeight: '600',
  color: '#fff',
  marginTop: 20,
  textAlign: 'center',
},
welcomeSubtext: {
  fontSize: 16,
  color: 'rgba(255, 255, 255, 0.7)',
  marginTop: 8,
  textAlign: 'center',
},
messageBubble: {
  borderRadius: 16,
  padding: 12,
  marginBottom: 12,
  maxWidth: '80%',
},
userMessage: {
  alignSelf: 'flex-end',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  borderBottomRightRadius: 4,
},
aiMessage: {
  alignSelf: 'flex-start',
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  borderBottomLeftRadius: 4,
},
messageHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 4,
},
senderText: {
  fontSize: 12,
  fontWeight: 'bold',
},
userMessageText: {
  color: '#333',
},
aiMessageText: {
  color: '#fff',
},
languageIndicator: {
  fontSize: 10,
  color: '#999',
  fontStyle: 'italic',
},
messageText: {
  fontSize: 16,
  lineHeight: 22,
},
inputContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  borderRadius: 25,
  paddingHorizontal: 16,
  paddingVertical: 8,
},
input: {
  flex: 1,
  minHeight: 40,
  maxHeight: 120,
  color: '#fff',
  fontSize: 16,
  paddingVertical: 8,
},
buttonContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  marginLeft: 8,
},
actionButton: {
  width: 40,
  height: 40,
  borderRadius: 20,
  justifyContent: 'center',
  alignItems: 'center',
  marginLeft: 8,
},
sendButton: {
  backgroundColor: '#4CAF50',
},
voiceButton: {
  backgroundColor: '#FF5722',
},
modalOverlay: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
},
modalContainer: {
  width: '80%',
  borderRadius: 20,
  padding: 20,
  alignItems: 'center',
},
modalContent: {
  width: '100%',
  alignItems: 'center',
},
recordingIndicator: {
  position: 'relative',
  marginBottom: 30,
},
recordingPulse: {
  position: 'absolute',
  top: -15,
  left: -15,
  right: -15,
  bottom: -15,
  borderRadius: 60,
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  zIndex: -1,
  animationKeyframes: {
    '0%': { transform: [{ scale: 1 }], opacity: 1 },
    '100%': { transform: [{ scale: 1.5 }], opacity: 0 },
  },
  animationDuration: '1500ms',
  animationIterationCount: 'infinite',
},
modalText: {
  fontSize: 18,
  color: '#fff',
  marginBottom: 20,
  textAlign: 'center',
},
errorText: {
  color: '#ffeb3b',
  marginBottom: 20,
  textAlign: 'center',
},
modalButtons: {
  flexDirection: 'row',
  justifyContent: 'center',
  width: '100%',
},
modalButton: {
  paddingVertical: 12,
  paddingHorizontal: 24,
  borderRadius: 25,
  marginHorizontal: 8,
  minWidth: 100,
  justifyContent: 'center',
  alignItems: 'center',
},
startButton: {
  backgroundColor: '#4CAF50',
},
stopButton: {
  backgroundColor: '#F44336',
},
closeButton: {
  backgroundColor: '#607D8B',
},
modalButtonText: {
  color: '#fff',
  fontWeight: 'bold',
},
});
