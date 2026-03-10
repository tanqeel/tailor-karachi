import { useState, useCallback, useRef } from 'react';
import { useLang } from '@/contexts/LanguageContext';

interface UseVoiceOptions {
  onResult?: (transcript: string) => void;
  onCommand?: (transcript: string) => void;
  continuous?: boolean;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    length: number;
    [key: number]: {
      isFinal: boolean;
      [key: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: unknown) => void;
  onend: () => void;
}

interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
}

export function useVoice({ onResult, onCommand, continuous = false }: UseVoiceOptions = {}) {
  const { isUrdu } = useLang();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const isSupported = typeof window !== 'undefined' &&
    (!!(window as WindowWithSpeechRecognition).SpeechRecognition ||
      !!(window as WindowWithSpeechRecognition).webkitSpeechRecognition);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    if (!isSupported) return;
    stop();

    const Win = window as WindowWithSpeechRecognition;
    const SpeechRecognition = Win.SpeechRecognition || Win.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    // Support both Urdu and English by using Urdu primary (most users) with English fallback
    recognition.lang = isUrdu ? 'ur-PK' : 'en-US';
    recognition.interimResults = true;
    recognition.continuous = continuous;
    recognition.maxAlternatives = 1;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(finalTranscript);
        onResult?.(finalTranscript);
        onCommand?.(finalTranscript);
      } else if (interimTranscript) {
        setTranscript(interimTranscript);
      }
    };

    recognition.onerror = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    setListening(true);
    setTranscript('');
    recognition.start();
  }, [isSupported, isUrdu, continuous, onResult, onCommand, stop]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  return { listening, transcript, start, stop, toggle, isSupported };
}
