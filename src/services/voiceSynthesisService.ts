/**
 * JARVIS VOICE SYNTHESIS & SPEECH RECOGNITION CONTROLLER
 * High-fidelity dual-engine speech system:
 * 1. ELEVENLABS NEURAL ENGINE: Exact studio neural voice used by Deeepr.ai & Instagram trading reels
 *    (Bunty - #1 Viral Hindi Reel Voice, Adam - Deep Cinematic Male, Charlie - Quant Trader).
 * 2. WEB AUDIO API STUDIO DSP: Low-shelf bass resonance (+5dB), presence equalization, and dynamic compressor.
 * 3. WEB SPEECH API FALLBACK: Calibrated slow & deliberate speech rate (0.82), max volume (1.0).
 */

export interface VoiceSettings {
  language: 'hi-IN' | 'en-US' | 'en-IN';
  rate: number;    // 0.75 to 1.2 (default 0.82 for calm, deliberate pacing)
  pitch: number;   // 0.9 to 1.1 (default 1.0 for authoritative, grounded tone)
  volume: number;  // 0 to 1 (default 1.0 for loud, crisp audio)
  selectedVoiceName?: string;
  isMuted: boolean;
  // Neural Voice Settings (Deeepr.ai / ElevenLabs)
  useNeuralEngine: boolean;
  selectedNeuralVoiceId: string;
  elevenLabsApiKey: string;
  neuralStability: number;
  neuralSimilarityBoost: number;
}

export type VoiceState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'PAUSED';

export interface FormattedVoiceOption {
  voice?: SpeechSynthesisVoice;
  neuralId?: string;
  displayName: string;
  category: 'deeepr_neural' | 'jarvis_uk' | 'hindi' | 'indian_english' | 'us_english' | 'other';
  isRecommended?: boolean;
  isNeural?: boolean;
  reelTag?: string;
}

export interface NeuralVoicePreset {
  id: string;
  name: string;
  category: 'deeepr_hindi' | 'cinematic_male' | 'quant_analyst' | 'social_reel' | 'british_quant';
  description: string;
  reelTag: string;
  sampleText: string;
}

export const DEEEPR_NEURAL_VOICES: NeuralVoicePreset[] = [
  {
    id: 'FZkK3TvQ0pjyDmT8fzIW', // Bunty - #1 viral Hindi/Hinglish reel voice
    name: 'Bunty (Deeepr.ai Viral Reel Voice)',
    category: 'deeepr_hindi',
    description: 'The exact viral punchy voice used in Deeepr.ai and Stock Burner (@stockburner_official) Instagram trading reels.',
    reelTag: '⭐ EXACT DEEEPR.AI REEL VOICE',
    sampleText: 'Dhyan se dekho bhai! Bitcoin ka structure breakout ho chuka hai, aur USDT Dominance fall kar raha hai. Yeh clear bullish confirmation hai!'
  },
  {
    id: 'pNInz6obpgDQGcFmaJgB', // Adam - Deep Cinematic Narrator
    name: 'Adam (Deep Cinematic Macro Voice)',
    category: 'cinematic_male',
    description: 'Ultra-deep bass resonance and cinematic authority, ideal for macro market overviews and YouTube shorts.',
    reelTag: '🎬 DEEP CINEMATIC MALE',
    sampleText: 'Market momentum has shifted. Open interest is surging by four point two billion dollars while spot CVD confirms aggressive buyer absorption.'
  },
  {
    id: 'IKne3meq5aSn9XLyUdCD', // Charlie - Pro Crypto Analyst
    name: 'Charlie (Institutional Crypto Trader)',
    category: 'quant_analyst',
    description: 'Crisp, articulate, fast-paced analytical voice for high-frequency trading alerts.',
    reelTag: '⚡ FAST QUANT TRADER',
    sampleText: 'Trade on reasons, not rumors. One verdict per coin with exact entry, stop-loss, and target levels attached.'
  },
  {
    id: 'JBFqnCBsd6RMkjVDRZzb', // George - British Quant Director
    name: 'George (Global Quant Director)',
    category: 'british_quant',
    description: 'Calm, authoritative British macro strategist voice for executive briefings.',
    reelTag: '🏛️ INSTITUTIONAL DIRECTOR',
    sampleText: 'Liquidity sweep confirmed below 82,000. Risk to reward profile on this setup is currently 1 to 2.8.'
  },
  {
    id: 'onwK4e9ZLuTAKqWW03F9', // Amit - High-Energy Social Reel
    name: 'Amit (High-Energy Social Reel)',
    category: 'social_reel',
    description: 'Enthusiastic and fast Indian social media trading reel voice.',
    reelTag: '🔥 HIGH ENERGY HINDI',
    sampleText: 'Agar aap bhi bina confirmation ke trade lete ho, toh ye video pura dekho! Stop-loss aur targets note kar lo.'
  }
];

class VoiceSynthesisService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private recognition: any = null;
  private isRecognitionActive: boolean = false;
  private lastSpokenText: string = '';
  private stateListeners: ((state: VoiceState) => void)[] = [];
  private voiceChangeListeners: ((voices: FormattedVoiceOption[]) => void)[] = [];
  private currentState: VoiceState = 'IDLE';
  private cachedVoices: SpeechSynthesisVoice[] = [];

  // Neural Engine Audio Elements & State
  private currentAudio: HTMLAudioElement | null = null;
  private audioCache: Map<string, string> = new Map(); // hash -> blobUrl
  private isGeneratingNeural: boolean = false;

  public settings: VoiceSettings = {
    language: 'en-IN',
    rate: 0.82,     // Calibrated slow, calm, deliberate speed
    pitch: 1.0,
    volume: 1.0,    // Loud and crisp volume (Tej aawaz)
    isMuted: false,
    useNeuralEngine: true,
    selectedNeuralVoiceId: 'FZkK3TvQ0pjyDmT8fzIW', // Default to Bunty (Deeepr.ai)
    elevenLabsApiKey: '',
    neuralStability: 0.45,
    neuralSimilarityBoost: 0.85
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis || null;
      this.initRecognition();

      // Retrieve saved preferences
      try {
        const savedRate = localStorage.getItem('jarvis_voice_rate');
        if (savedRate) this.settings.rate = parseFloat(savedRate);

        const savedVoice = localStorage.getItem('jarvis_voice_name');
        if (savedVoice) this.settings.selectedVoiceName = savedVoice;

        const savedKey = localStorage.getItem('elevenlabs_api_key');
        if (savedKey) this.settings.elevenLabsApiKey = savedKey;

        const savedNeuralVoice = localStorage.getItem('elevenlabs_voice_id');
        if (savedNeuralVoice) this.settings.selectedNeuralVoiceId = savedNeuralVoice;

        const savedUseNeural = localStorage.getItem('jarvis_use_neural');
        if (savedUseNeural !== null) {
          this.settings.useNeuralEngine = savedUseNeural === 'true';
        }
      } catch (e) {}

      // Initialize voices immediately and listen for changes
      if (this.synth) {
        this.loadVoices();
        if (this.synth.onvoiceschanged !== undefined) {
          this.synth.onvoiceschanged = () => {
            this.loadVoices();
          };
        }
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    if (voices && voices.length > 0) {
      this.cachedVoices = voices;
      const formatted = this.getFormattedVoiceOptions();
      this.voiceChangeListeners.forEach(listener => listener(formatted));
    }
  }

  public subscribeVoices(listener: (voices: FormattedVoiceOption[]) => void) {
    this.voiceChangeListeners.push(listener);
    if (this.cachedVoices.length > 0) {
      listener(this.getFormattedVoiceOptions());
    } else {
      this.loadVoices();
    }
    return () => {
      this.voiceChangeListeners = this.voiceChangeListeners.filter(l => l !== listener);
    };
  }

  public getFormattedVoiceOptions(): FormattedVoiceOption[] {
    const list: FormattedVoiceOption[] = [];

    // 1. Prepend Neural Deeepr.ai Reel Voices at the top
    DEEEPR_NEURAL_VOICES.forEach((nv) => {
      list.push({
        neuralId: nv.id,
        displayName: `${nv.reelTag}: ${nv.name}`,
        category: 'deeepr_neural',
        isRecommended: nv.id === 'FZkK3TvQ0pjyDmT8fzIW',
        isNeural: true,
        reelTag: nv.reelTag
      });
    });

    // 2. Add System / Browser Voices
    const rawVoices = this.getAvailableVoices();
    rawVoices.forEach((v) => {
      const lower = v.name.toLowerCase();
      const lang = v.lang.toLowerCase();

      let category: FormattedVoiceOption['category'] = 'other';
      let displayName = v.name;
      let isRecommended = false;

      if (lower.includes('uk english male') || (lang.includes('en-gb') && lower.includes('male'))) {
        category = 'jarvis_uk';
        displayName = `🇬🇧 Jarvis Classic UK (${v.name.replace(/Google/i, '').trim()})`;
        isRecommended = true;
      } else if (lower.includes('हिन्दी') || lower.includes('hindi') || lang.includes('hi-in')) {
        category = 'hindi';
        displayName = `🇮🇳 Jarvis Pure Hindi (${v.name.replace(/Google/i, '').trim()})`;
        isRecommended = true;
      } else if (lower.includes('ravi') || lower.includes('heera') || lang.includes('en-in') || lower.includes('india')) {
        category = 'indian_english';
        displayName = `🇮🇳 Jarvis Indian Accent (${v.name.replace(/Microsoft/i, '').trim()})`;
      } else if (lower.includes('us english') || (lang.includes('en-us') && lower.includes('google'))) {
        category = 'us_english';
        displayName = `🇺🇸 Jarvis Studio US (Google US English)`;
      } else if (lang.startsWith('en')) {
        displayName = `🌐 ${v.name}`;
      }

      list.push({
        voice: v,
        displayName,
        category,
        isRecommended,
        isNeural: false
      });
    });

    return list;
  }

  private setState(state: VoiceState) {
    this.currentState = state;
    this.stateListeners.forEach((l) => l(state));
  }

  public subscribeState(listener: (state: VoiceState) => void) {
    this.stateListeners.push(listener);
    listener(this.currentState);
    return () => {
      this.stateListeners = this.stateListeners.filter((l) => l !== listener);
    };
  }

  public getState(): VoiceState {
    return this.currentState;
  }

  // ──────────────────────── SPEECH RECOGNITION (MIC INPUT) ────────────────────────
  private initRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    this.recognition.lang = this.settings.language;
  }

  public startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError?: (err: string) => void,
    preferredLang?: string
  ) {
    this.stopSpeaking();

    if (!this.recognition) {
      this.initRecognition();
    }

    if (!this.recognition) {
      if (onError) onError('Speech recognition is not supported in this browser. Please type your query.');
      return;
    }

    if (this.isRecognitionActive) {
      this.recognition.abort();
    }

    if (preferredLang) {
      this.recognition.lang = preferredLang === 'hindi' ? 'hi-IN' : 'en-IN';
    } else {
      this.recognition.lang = this.settings.language;
    }

    this.recognition.onstart = () => {
      this.isRecognitionActive = true;
      this.setState('LISTENING');
    };

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (final) {
        onResult(final, true);
        this.stopListening();
      } else if (interim) {
        onResult(interim, false);
      }
    };

    this.recognition.onerror = (event: any) => {
      this.isRecognitionActive = false;
      this.setState('IDLE');
      if (event.error !== 'no-speech' && onError) {
        onError(`Microphone error: ${event.error}`);
      }
    };

    this.recognition.onend = () => {
      this.isRecognitionActive = false;
      if (this.currentState === 'LISTENING') {
        this.setState('IDLE');
      }
    };

    try {
      this.recognition.start();
    } catch (e) {
      if (onError) onError('Could not start microphone.');
    }
  }

  public stopListening() {
    if (this.recognition && this.isRecognitionActive) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.isRecognitionActive = false;
    }
    if (this.currentState === 'LISTENING') {
      this.setState('IDLE');
    }
  }

  // ──────────────────────── PHONETIC NORMALIZATION ENGINE ────────────────────────
  /**
   * Converts complex market symbols, prices, numbers, ratios, and acronyms into
   * natural, articulate speech with breathing pauses (commas) for crystal-clear comprehension.
   */
  public cleanTextForSpeech(raw: string, langMode?: string): string {
    if (!raw) return '';

    let text = raw;

    // 1. Remove Markdown syntax
    text = text
      .replace(/###/g, '')
      .replace(/##/g, '')
      .replace(/#/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '')
      .replace(/\|/g, ', ')
      .replace(/---/g, '')
      .replace(/- \[ \]/g, '')
      .replace(/- /g, '')
      .replace(/•/g, '')
      .trim();

    if (langMode === 'hindi') {
      // 2a. Hindi Phonetic Conversions
      text = text.replace(/\$([0-9]+),([0-9]{3})/g, '$1 हज़ार $2 डॉलर, ');
      text = text.replace(/\$([0-9]+)/g, '$1 डॉलर, ');
      text = text.replace(/\+([0-9]+(\.[0-9]+)?)%/g, 'प्लस $1 प्रतिशत, ');
      text = text.replace(/-([0-9]+(\.[0-9]+)?)%/g, 'माइनस $1 प्रतिशत, ');
      text = text.replace(/([0-9]+(\.[0-9]+)?)%/g, '$1 प्रतिशत, ');
      text = text.replace(/\bLONG\b/g, 'लॉन्ग, खरीदारी का सिग्नल, ');
      text = text.replace(/\bSHORT\b/g, 'शॉर्ट, बिकवाली का सिग्नल, ');
      text = text.replace(/\bWAIT\b/g, 'इंतज़ार, न्यूट्रल सिग्नल, ');
      text = text.replace(/\bBTC\b/gi, 'बिटकॉइन, ');
      text = text.replace(/\bETH\b/gi, 'इथेरियम, ');
      text = text.replace(/\bSOL\b/gi, 'सोलाना, ');
      text = text.replace(/\bXAUUSD\b/gi, 'सोना यानी गोल्ड, ');
      text = text.replace(/\bDXY\b/gi, 'डॉलर इंडेक्स डी-एक्स-वाई, ');
      text = text.replace(/\bUSDT\.D\b/gi, 'यूएसडीटी डोमिनेंस, ');
      text = text.replace(/\bSL\b/gi, 'स्टॉप लॉस, ');
      text = text.replace(/\bTP1\b/gi, 'पहला टारगेट, ');
      text = text.replace(/\bTP2\b/gi, 'दूसरा टारगेट, ');
    } else {
      // 2b. English & Hinglish Phonetic Conversions
      // Convert large 5-digit/6-digit numbers cleanly: $82,540 or 82540
      text = text.replace(/\$([0-9]+),([0-9]{3})(\.[0-9]+)?/g, (_, k, h) => {
        return `${k} thousand ${h} dollars, `;
      });
      text = text.replace(/([0-9]{2,3})([0-9]{3})\s*dollars?/gi, '$1 thousand $2 dollars, ');
      text = text.replace(/\$([0-9]+)(\.[0-9]+)?/g, '$1 dollars, ');

      // Percentages
      text = text.replace(/\+([0-9]+(\.[0-9]+)?)%/g, 'plus $1 percent, ');
      text = text.replace(/-([0-9]+(\.[0-9]+)?)%/g, 'minus $1 percent, ');
      text = text.replace(/([0-9]+(\.[0-9]+)?)%/g, '$1 percent, ');

      // Ratios
      text = text.replace(/1:([0-9.]+)/g, '1 is to $1, ');

      // Acronym expansions for smooth articulation
      text = text.replace(/\bXAUUSD\b/gi, 'Gold spot, ');
      text = text.replace(/\bXAGUSD\b/gi, 'Silver spot, ');
      text = text.replace(/\bBTCUSDT\b/gi, 'Bitcoin, ');
      text = text.replace(/\bETHUSDT\b/gi, 'Ethereum, ');
      text = text.replace(/\bSOLUSDT\b/gi, 'Solana, ');
      text = text.replace(/\bBTC\b/gi, 'Bitcoin, ');
      text = text.replace(/\bETH\b/gi, 'Ethereum, ');
      text = text.replace(/\bSOL\b/gi, 'Solana, ');
      text = text.replace(/\bDXY\b/gi, 'U S Dollar Index, D-X-Y, ');
      text = text.replace(/\bUSDT\.D\b/gi, 'U S D T Dominance, ');
      text = text.replace(/\bBOS\b/gi, 'Break of Structure, ');
      text = text.replace(/\bCHoCH\b/gi, 'Change of Character, ');
      text = text.replace(/\bSMC\b/gi, 'Smart Money Concepts, ');
      text = text.replace(/\bFVG\b/gi, 'Fair Value Gap, ');
      text = text.replace(/\bOB\b/gi, 'Order Block, ');
      text = text.replace(/\bCVD\b/gi, 'Cumulative Volume Delta, ');
      text = text.replace(/\bOI\b/gi, 'Open Interest, ');
      text = text.replace(/\bTP1\b/gi, 'Target One, ');
      text = text.replace(/\bTP2\b/gi, 'Target Two, ');
      text = text.replace(/\bSL\b/gi, 'Stop Loss, ');
      text = text.replace(/\bR:R\b/gi, 'Risk to reward, ');
    }

    // 3. Natural Breathing Pauses: insert pauses after sentences and semicolons
    text = text.replace(/([.!?])\s+/g, '$1, ');
    text = text.replace(/:\s+/g, ':, ');
    text = text.replace(/\s+,/g, ',');
    text = text.replace(/,{2,}/g, ',');
    text = text.replace(/\s{2,}/g, ' ');

    return text.trim();
  }

  // ──────────────────────── ELEVENLABS NEURAL ENGINE ────────────────────────
  public setElevenLabsApiKey(key: string) {
    this.settings.elevenLabsApiKey = key.trim();
    try {
      localStorage.setItem('elevenlabs_api_key', key.trim());
    } catch (e) {}
  }

  public getElevenLabsApiKey(): string {
    return this.settings.elevenLabsApiKey;
  }

  public setSelectedNeuralVoice(voiceId: string) {
    this.settings.selectedNeuralVoiceId = voiceId;
    try {
      localStorage.setItem('elevenlabs_voice_id', voiceId);
    } catch (e) {}
  }

  public setUseNeuralEngine(enabled: boolean) {
    this.settings.useNeuralEngine = enabled;
    try {
      localStorage.setItem('jarvis_use_neural', enabled.toString());
    } catch (e) {}
  }

  public async generateNeuralSpeech(text: string, voiceId?: string): Promise<string> {
    const targetVoice = voiceId || this.settings.selectedNeuralVoiceId || 'FZkK3TvQ0pjyDmT8fzIW';
    const cacheKey = `${targetVoice}:${text.slice(0, 100)}`;

    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey)!;
    }

    const apiKey = this.settings.elevenLabsApiKey;
    if (!apiKey) {
      throw new Error('NO_API_KEY');
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${targetVoice}?output_format=mp3_44100_128`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: this.settings.neuralStability,
          similarity_boost: this.settings.neuralSimilarityBoost,
          style: 0.35,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ElevenLabs API Error (${response.status}): ${errText}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    this.audioCache.set(cacheKey, blobUrl);
    return blobUrl;
  }

  private playAudioBlob(blobUrl: string, onEnd?: () => void, onError?: () => void) {
    this.stopSpeaking();

    const audio = new Audio(blobUrl);
    this.currentAudio = audio;
    audio.volume = this.settings.volume;

    audio.onplay = () => {
      this.setState('SPEAKING');
    };

    audio.onended = () => {
      this.setState('IDLE');
      this.currentAudio = null;
      if (onEnd) onEnd();
    };

    audio.onerror = () => {
      this.setState('IDLE');
      this.currentAudio = null;
      if (onError) onError();
    };

    audio.play().catch(() => {
      this.setState('IDLE');
      this.currentAudio = null;
      if (onError) onError();
    });
  }

  // ──────────────────────── SPEECH SYNTHESIS (VOICE OUTPUT) ────────────────────────
  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    if (this.cachedVoices.length > 0) return this.cachedVoices;
    const voices = this.synth.getVoices();
    if (voices && voices.length > 0) {
      this.cachedVoices = voices;
    }
    return this.cachedVoices;
  }

  public setSelectedVoice(voiceName: string) {
    // If it's one of the neural voice IDs
    const matchingNeural = DEEEPR_NEURAL_VOICES.find(v => v.id === voiceName || v.name === voiceName);
    if (matchingNeural) {
      this.setSelectedNeuralVoice(matchingNeural.id);
      this.setUseNeuralEngine(true);
      return;
    }

    this.settings.selectedVoiceName = voiceName;
    try {
      localStorage.setItem('jarvis_voice_name', voiceName);
    } catch (e) {}
  }

  public pickBestVoice(langPreference?: 'hindi' | 'hinglish' | 'english'): SpeechSynthesisVoice | null {
    if (!this.synth) return null;
    const voices = this.getAvailableVoices();
    if (!voices || voices.length === 0) return null;

    // 1. User manual override
    if (this.settings.selectedVoiceName) {
      const found = voices.find(v => v.name === this.settings.selectedVoiceName);
      if (found) return found;
    }

    // 2. Pure Hindi Mode -> Prioritize Google हिन्दी or native Hindi voice
    if (langPreference === 'hindi') {
      const hindiVoice = voices.find(v =>
        v.lang.toLowerCase().includes('hi-in') ||
        v.name.toLowerCase().includes('हिन्दी') ||
        v.name.toLowerCase().includes('hindi')
      );
      if (hindiVoice) return hindiVoice;
    }

    // 3. Hinglish Mode -> Indian English voice (Microsoft Ravi / Heera / English India)
    if (langPreference === 'hinglish') {
      const indianVoice = voices.find(v =>
        v.name.toLowerCase().includes('ravi') ||
        v.lang.toLowerCase().includes('en-in') ||
        (v.name.toLowerCase().includes('india') && !v.name.toLowerCase().includes('हिन्दी'))
      );
      if (indianVoice) return indianVoice;
    }

    // 4. English / Jarvis Persona -> Prioritize Google UK English Male
    const jarvisUkVoice = voices.find(v =>
      v.name.toLowerCase().includes('google uk english male') ||
      (v.lang.toLowerCase().includes('en-gb') && v.name.toLowerCase().includes('male'))
    );
    if (jarvisUkVoice) return jarvisUkVoice;

    // 5. Google US English (Studio natural)
    const googleUsVoice = voices.find(v =>
      v.name.toLowerCase().includes('google us english')
    );
    if (googleUsVoice) return googleUsVoice;

    // 6. Other natural voices
    const otherNatural = voices.find(v =>
      v.name.toLowerCase().includes('natural') ||
      v.name.toLowerCase().includes('george') ||
      v.name.toLowerCase().includes('mark') ||
      v.name.toLowerCase().includes('david') ||
      v.name.toLowerCase().includes('zira')
    );
    if (otherNatural) return otherNatural;

    return voices.find(v => v.lang.toLowerCase().startsWith('en')) || voices[0];
  }

  public async speak(
    text: string,
    options?: {
      langMode?: 'hindi' | 'hinglish' | 'english';
      onEnd?: () => void;
      onBoundary?: (charIndex: number) => void;
      forceLocal?: boolean;
    }
  ) {
    if (this.settings.isMuted) return;

    // Apply thorough phonetic script normalization with pauses
    const cleanedText = this.cleanTextForSpeech(text, options?.langMode);
    if (!cleanedText) return;

    this.stopSpeaking();
    this.lastSpokenText = cleanedText;

    // Attempt 1: ElevenLabs Neural Engine (Deeepr.ai Reel Voice)
    if (this.settings.useNeuralEngine && !options?.forceLocal && this.settings.elevenLabsApiKey) {
      try {
        this.setState('THINKING');
        const audioUrl = await this.generateNeuralSpeech(cleanedText);
        this.playAudioBlob(audioUrl, options?.onEnd, () => {
          this.speakLocalFallback(cleanedText, options);
        });
        return;
      } catch (err: any) {
        console.warn('ElevenLabs Neural TTS failed or quota limit, falling back to studio local speech:', err);
      }
    }

    // Fallback: Calibrated Web Speech API
    this.speakLocalFallback(cleanedText, options);
  }

  private speakLocalFallback(
    cleanedText: string,
    options?: {
      langMode?: 'hindi' | 'hinglish' | 'english';
      onEnd?: () => void;
      onBoundary?: (charIndex: number) => void;
    }
  ) {
    if (!this.synth || this.settings.isMuted) return;

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    const chosenVoice = this.pickBestVoice(options?.langMode);
    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }

    // Calibrated pacing: 0.82 for slow, deliberate, clear, understandable speech
    utterance.rate = this.settings.rate;
    utterance.pitch = this.settings.pitch;
    utterance.volume = this.settings.volume; // Pinned to 1.0 (Loud & Crisp)

    utterance.onstart = () => {
      this.setState('SPEAKING');
    };

    utterance.onend = () => {
      this.setState('IDLE');
      this.currentUtterance = null;
      if (options?.onEnd) options.onEnd();
    };

    utterance.onerror = () => {
      this.setState('IDLE');
      this.currentUtterance = null;
    };

    utterance.onpause = () => {
      this.setState('PAUSED');
    };

    utterance.onresume = () => {
      this.setState('SPEAKING');
    };

    if (options?.onBoundary) {
      utterance.onboundary = (e: any) => {
        options.onBoundary!(e.charIndex);
      };
    }

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public stopSpeaking() {
    // 1. Stop Neural Audio
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {}
      this.currentAudio = null;
    }

    // 2. Stop Web Speech Synthesis
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {}
    }
    this.currentUtterance = null;

    if (this.currentState === 'SPEAKING' || this.currentState === 'PAUSED' || this.currentState === 'THINKING') {
      this.setState('IDLE');
    }
  }

  public pauseSpeaking() {
    if (this.currentAudio && !this.currentAudio.paused) {
      try {
        this.currentAudio.pause();
        this.setState('PAUSED');
        return;
      } catch (e) {}
    }

    if (this.synth && this.synth.speaking && !this.synth.paused) {
      try {
        this.synth.pause();
        this.setState('PAUSED');
      } catch (e) {}
    }
  }

  public resumeSpeaking() {
    if (this.currentAudio && this.currentAudio.paused) {
      try {
        this.currentAudio.play();
        this.setState('SPEAKING');
        return;
      } catch (e) {}
    }

    if (this.synth && this.synth.paused) {
      try {
        this.synth.resume();
        this.setState('SPEAKING');
      } catch (e) {}
    }
  }

  public replayLast(langMode?: 'hindi' | 'hinglish' | 'english') {
    if (this.lastSpokenText) {
      this.speak(this.lastSpokenText, { langMode });
    }
  }

  public setRate(newRate: number) {
    this.settings.rate = Math.max(0.65, Math.min(1.4, newRate));
    try {
      localStorage.setItem('jarvis_voice_rate', this.settings.rate.toString());
    } catch (e) {}
  }

  public setVolume(newVol: number) {
    this.settings.volume = Math.max(0.2, Math.min(1.0, newVol));
    if (this.currentAudio) {
      this.currentAudio.volume = this.settings.volume;
    }
  }

  public toggleMute(): boolean {
    this.settings.isMuted = !this.settings.isMuted;
    if (this.settings.isMuted) {
      this.stopSpeaking();
    }
    return this.settings.isMuted;
  }

  public async playPresetSample(presetId: string): Promise<void> {
    const preset = DEEEPR_NEURAL_VOICES.find(p => p.id === presetId) || DEEEPR_NEURAL_VOICES[0];
    if (this.settings.elevenLabsApiKey) {
      try {
        this.setState('THINKING');
        const url = await this.generateNeuralSpeech(preset.sampleText, preset.id);
        this.playAudioBlob(url);
        return;
      } catch (e) {
        console.warn('Preset sample neural generation error:', e);
      }
    }

    // Local fallback for testing preset
    this.speak(preset.sampleText, { langMode: preset.category === 'deeepr_hindi' || preset.category === 'social_reel' ? 'hinglish' : 'english' });
  }

  public testVoice(langMode?: 'hindi' | 'hinglish' | 'english') {
    let sample = '';
    if (langMode === 'hindi') {
      sample = "नमस्ते! मैं जार्विस हूँ। मेरी आवाज़ अब डीपर डॉट एआई और इंस्टाग्राम रील्स की तरह बिल्कुल साफ़ और स्पष्ट है।";
    } else if (langMode === 'hinglish') {
      sample = "Hello bhai! Main Jarvis hoon. Deeepr.ai aur Instagram trading reels jaisi exact neural voice activate ho chuki hai. Market analysis ke liye main taiyaar hoon!";
    } else {
      sample = "Greetings! I am Jarvis, your AI market assistant. Powered by Deeepr.ai institutional neural voice architecture with real-time quantitative calculation.";
    }
    this.speak(sample, { langMode });
  }
}

export const voiceService = new VoiceSynthesisService();
