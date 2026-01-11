/**
 * Serviço de Text-to-Speech (Síntese de Voz)
 * Configurado para usar a voz padrão do sistema para maior compatibilidade.
 */

const RATE = 0.9; 
const PITCH = 1.0;
const LANG = 'pt-BR';

let cachedVoice: SpeechSynthesisVoice | null = null;

const getBestVoice = (): SpeechSynthesisVoice | null => {
  if (cachedVoice) return cachedVoice;

  const voices = window.speechSynthesis.getVoices();
  const ptVoices = voices.filter(voice => voice.lang.includes('pt-BR') || voice.lang.includes('pt'));

  if (ptVoices.length === 0) return null;

  // Seleciona a primeira voz em português disponível (padrão do sistema)
  cachedVoice = ptVoices[0];
  return cachedVoice;
};

// Listener para navegadores que carregam vozes de forma assíncrona
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null;
    getBestVoice();
  };
}

export const speak = (text: string): void => {
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANG;
  utterance.rate = RATE;
  utterance.pitch = PITCH;

  const voice = getBestVoice();
  if (voice) {
    utterance.voice = voice;
  }

  window.speechSynthesis.speak(utterance);
};

export const cancelSpeech = (): void => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};