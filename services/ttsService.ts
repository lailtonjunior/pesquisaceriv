/**
 * Serviço de Text-to-Speech (Síntese de Voz)
 * Integração: Eleven Labs com Fallback para Sistema Nativo
 */

// --- CONFIGURAÇÃO ELEVEN LABS ---
// Sua chave de API configurada (com fallback para variável de ambiente se necessário)
const ELEVEN_API_KEY = process.env.REACT_APP_ELEVEN_LABS_API_KEY || 'sk_fed0fae2a8f4d5c357ebbba9e676c4a79ce5eb6df6ae5cf1'; 

// ID da voz (Padrão: "Rachel"). 
const VOICE_ID = 'IKpiSijWzlhOL6uX83EH'; 

const USE_ELEVEN_LABS = !!ELEVEN_API_KEY && ELEVEN_API_KEY.length > 10;

// --- CONFIGURAÇÃO SISTEMA (FALLBACK) ---
const SYSTEM_RATE = 0.9; 
const SYSTEM_PITCH = 1.0;
const SYSTEM_LANG = 'pt-BR';

// Cache para evitar gastar créditos (e banda) com frases repetidas
// Armazena: texto -> Blob URL
const audioCache = new Map<string, string>();

// Referência para o áudio HTML5 atual (Eleven Labs)
let currentAudioElement: HTMLAudioElement | null = null;
// Timestamp da última requisição para gerenciar condições de corrida (race conditions)
let lastRequestTime = 0;

// --- FUNÇÕES DO SISTEMA NATIVO (FALLBACK) ---

let cachedSystemVoice: SpeechSynthesisVoice | null = null;

const getBestSystemVoice = (): SpeechSynthesisVoice | null => {
  if (cachedSystemVoice) return cachedSystemVoice;

  const voices = window.speechSynthesis.getVoices();
  const ptVoices = voices.filter(voice => voice.lang.includes('pt-BR') || voice.lang.includes('pt'));

  if (ptVoices.length === 0) return null;

  cachedSystemVoice = ptVoices[0];
  return cachedSystemVoice;
};

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedSystemVoice = null;
    getBestSystemVoice();
  };
}

const playSystemTTS = (text: string): void => {
  if (!('speechSynthesis' in window)) return;
  
  // Cancela qualquer fala do sistema anterior
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = SYSTEM_LANG;
  utterance.rate = SYSTEM_RATE;
  utterance.pitch = SYSTEM_PITCH;

  const voice = getBestSystemVoice();
  if (voice) {
    utterance.voice = voice;
  }

  console.log('🔊 Usando voz do sistema (Fallback)');
  window.speechSynthesis.speak(utterance);
};

// --- FUNÇÕES ELEVEN LABS ---

const fetchElevenLabsAudio = async (text: string): Promise<string> => {
  // Verifica cache primeiro para economizar créditos
  if (audioCache.has(text)) {
    return audioCache.get(text)!;
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVEN_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: text,
      model_id: "eleven_multilingual_v2", // Modelo otimizado para português
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    // Se der erro 401 (Unauthorized) ou 402 (Payment Required), o catch principal vai tratar
    throw new Error(`Eleven Labs Error: ${response.status} - ${errorData.detail?.message || 'Unknown error'}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  
  // Salva no cache
  audioCache.set(text, url);
  return url;
};

// --- FUNÇÃO PRINCIPAL DE FALA ---

export const speak = async (text: string): Promise<void> => {
  const requestTime = Date.now();
  lastRequestTime = requestTime;

  // 1. Cancelar qualquer áudio tocando atualmente
  cancelSpeech();

  // 2. Se não tiver chave configurada, vai direto pro sistema
  if (!USE_ELEVEN_LABS) {
    playSystemTTS(text);
    return;
  }

  try {
    // 3. Tenta buscar o áudio da Eleven Labs
    const audioUrl = await fetchElevenLabsAudio(text);

    // VERIFICAÇÃO CRÍTICA: Se uma nova requisição foi feita enquanto o fetch ocorria, aborta esta.
    if (lastRequestTime !== requestTime) {
      return;
    }

    // Cria e toca o áudio HTML5
    const audio = new Audio(audioUrl);
    currentAudioElement = audio;
    
    // Tratamento de erro na reprodução do elemento de áudio (ex: bloqueio do navegador)
    audio.onerror = (e) => {
      // Verifica novamente se ainda é a requisição atual antes de fazer fallback
      if (lastRequestTime === requestTime) {
         console.warn("Erro no player de áudio, tentando fallback", e);
         playSystemTTS(text);
      }
    };

    // Tocar
    await audio.play();

  } catch (error) {
    // Só executa o fallback se esta ainda for a requisição mais recente
    if (lastRequestTime === requestTime) {
        console.warn("⚠️ Falha na Eleven Labs (possivelmente sem créditos), ativando fallback do sistema:", error);
        playSystemTTS(text);
    }
  }
};

export const cancelSpeech = (): void => {
  // Para áudio HTML5 (Eleven Labs)
  if (currentAudioElement) {
    currentAudioElement.pause();
    currentAudioElement.currentTime = 0;
    currentAudioElement = null;
  }
  
  // Para áudio do Sistema
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};