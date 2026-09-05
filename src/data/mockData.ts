import { SubtitleItem, VoiceProfile } from '../types';

export const VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'voice-sophea',
    name: 'Sophea (សុភា)',
    language: 'km-KH',
    gender: 'Female',
    accent: 'Phnom Penh Neutral',
    description: 'Natural documentary narration, clear diction and soothing cadence',
    sampleText: 'សូមស្វាគមន៍មកកាន់ការផ្សាយព័ត៌មានបច្ចេកវិទ្យា AI ជំនាន់ថ្មី។',
    speed: 1.0,
    pitch: 1.0,
    tag: 'Documentary • Neural HD'
  },
  {
    id: 'voice-dara',
    name: 'Dara (តារា)',
    language: 'km-KH',
    gender: 'Male',
    accent: 'Khmer Standard',
    description: 'Expressive cinematic voice, suitable for movie trailers and action',
    sampleText: 'ពិភពលោកកំពុងផ្លាស់ប្តូរយ៉ាងឆាប់រហ័ស ជាមួយបញ្ញាសិប្បនិម្មិត។',
    speed: 1.0,
    pitch: 0.95,
    tag: 'Cinematic • Deep'
  },
  {
    id: 'voice-kosal',
    name: 'Kosal (កុសល)',
    language: 'km-KH',
    gender: 'Male',
    accent: 'Commercial Radio',
    description: 'Authoritative, resonant tone with low pitch for business and tech',
    sampleText: 'ការច្នៃប្រឌិតថ្មីនៃស្ទូឌីយោបញ្ចេញសំឡេង DII STUDIO DUB។',
    speed: 0.95,
    pitch: 0.9,
    tag: 'Authoritative • Broadcast'
  },
  {
    id: 'voice-chanthou',
    name: 'Chanthou (ចន្ធូ)',
    language: 'km-KH',
    gender: 'Female',
    accent: 'Warm Storyteller',
    description: 'Gentle and friendly tone, ideal for tutorials and vlogs',
    sampleText: 'ជំហានទីមួយ យើងត្រូវជ្រើសរើសវីដេអូដែលចង់បកប្រែជាភាសាខ្មែរ។',
    speed: 1.05,
    pitch: 1.05,
    tag: 'Friendly • Vlogs'
  },
  {
    id: 'voice-vicheka',
    name: 'Vicheka (វិច្ឆិកា)',
    language: 'km-KH',
    gender: 'Female',
    accent: 'Modern Youth',
    description: 'Crisp, upbeat pacing for social media and TikTok shorts',
    sampleText: 'កុំភ្លេចចុចសាប់ស្ក្រាយ ដើម្បីទទួលបានចំណេះដឹងបច្ចេកវិទ្យាថ្មីៗ!​',
    speed: 1.1,
    pitch: 1.1,
    tag: 'Upbeat • Social'
  },
  {
    id: 'voice-rithy',
    name: 'Rithy (ឫទ្ធី)',
    language: 'km-KH',
    gender: 'Male',
    accent: 'Tech Explainer',
    description: 'Balanced analytical tone for AI demonstrations and reviews',
    sampleText: 'ប្រព័ន្ធបកប្រែស្វ័យប្រវត្តិនេះដំណើរការដោយ GPU ស៊េរីខ្ពស់។',
    speed: 1.0,
    pitch: 1.0,
    tag: 'Analytical • Studio'
  },
  {
    id: 'voice-marcus',
    name: 'Marcus Vance',
    language: 'en-US',
    gender: 'Male',
    accent: 'US West Coast',
    description: 'Silicon Valley tech documentary narrator',
    sampleText: 'Welcome to the revolutionary artificial intelligence video pipeline.',
    speed: 1.0,
    pitch: 1.0,
    tag: 'English US • Pro'
  },
  {
    id: 'voice-emma',
    name: 'Emma Clarke',
    language: 'en-GB',
    gender: 'Female',
    accent: 'British Received',
    description: 'BBC style elegant international broadcaster',
    sampleText: 'In this demonstration, we explore speech synthesis in Southeast Asia.',
    speed: 1.0,
    pitch: 1.0,
    tag: 'English UK • Neutral'
  }
];

export const INITIAL_SUBTITLES: SubtitleItem[] = [
  {
    id: 'sub-1',
    index: 1,
    startTime: 0.8,
    endTime: 4.2,
    textEn: 'Welcome to the future of AI video dubbing with DII STUDIO DUB.',
    textKh: 'សូមស្វាគមន៍មកកាន់អនាគតនៃការបញ្ចូលសំឡេងវីដេអូ AI ជាមួយ DII STUDIO DUB។',
    voiceProfileId: 'voice-sophea',
    status: 'dubbed',
    confidence: 0.98,
    audioDuration: 3.4
  },
  {
    id: 'sub-2',
    index: 2,
    startTime: 4.6,
    endTime: 8.9,
    textEn: 'Our neural models translate and clone natural Khmer voices in real time.',
    textKh: 'ម៉ូដែលបញ្ញាសិប្បនិម្មិតរបស់យើងបកប្រែ និងក្លូនសំឡេងខ្មែរយ៉ាងរលូនក្នុងពេលជាក់ស្តែង។',
    voiceProfileId: 'voice-dara',
    status: 'dubbed',
    confidence: 0.96,
    audioDuration: 4.1
  },
  {
    id: 'sub-3',
    index: 3,
    startTime: 9.3,
    endTime: 13.5,
    textEn: 'The audio stems are automatically separated to keep background music intact.',
    textKh: 'បទភ្លេងផ្ទៃខាងក្រោយត្រូវបានរក្សាទុកយ៉ាងច្បាស់ ដោយបំបែកតែសំឡេងនិយាយចេញ។',
    voiceProfileId: 'voice-kosal',
    status: 'dubbed',
    confidence: 0.99,
    audioDuration: 4.0
  },
  {
    id: 'sub-4',
    index: 4,
    startTime: 14.0,
    endTime: 18.2,
    textEn: 'You can adjust pitch, cadence, and emotion for each subtitle segment.',
    textKh: 'អ្នកអាចកែសម្រួលកម្ពស់សំឡេង ល្បឿន និងអារម្មណ៍សម្រាប់ផ្នែកនីមួយៗបានយ៉ាងងាយស្រួល។',
    voiceProfileId: 'voice-chanthou',
    status: 'dubbed',
    confidence: 0.95,
    audioDuration: 3.9
  },
  {
    id: 'sub-5',
    index: 5,
    startTime: 18.8,
    endTime: 23.4,
    textEn: 'High-precision synchronization guarantees perfect lip-sync across all scenes.',
    textKh: 'ការផ្គូផ្គងពេលវេលាដ៏ជាក់លាក់ ធានាបាននូវចលនាបបូរមាត់ត្រូវគ្នាយ៉ាងល្អឥតខ្ចោះ។',
    voiceProfileId: 'voice-rithy',
    status: 'ready',
    confidence: 0.94,
    audioDuration: 4.2
  },
  {
    id: 'sub-6',
    index: 6,
    startTime: 24.0,
    endTime: 28.5,
    textEn: 'Ready to render studio quality 4K video with embedded bilingual captions.',
    textKh: 'រួចរាល់សម្រាប់ការទាញយកវីដេអូកម្រិត 4K ជាមួយអក្សររត់ក្រោមពីរភាសា។',
    voiceProfileId: 'voice-vicheka',
    status: 'ready',
    confidence: 0.97,
    audioDuration: 4.3
  },
  {
    id: 'sub-7',
    index: 7,
    startTime: 29.0,
    endTime: 34.0,
    textEn: 'Experience effortless video localization for Southeast Asia and beyond.',
    textKh: 'ទទួលបានបទពិសោធន៍បកប្រែវីដេអូដោយងាយស្រួលសម្រាប់តំបន់អាស៊ីអាគ្នេយ៍ និងពិភពលោក។',
    voiceProfileId: 'voice-sophea',
    status: 'ready',
    confidence: 0.96,
    audioDuration: 4.8
  }
];

// High quality sample MP4 video links (reliable CDN / Big Buck Bunny / tech promo)
export const SAMPLE_VIDEOS = [
  {
    id: 'tech-promo',
    name: 'AI Studio Tech Showcase (1080p)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    poster: 'https://images.unsplash.com/photo-1535378620166-273708d44e4c?auto=format&fit=crop&w=1200&q=80',
    duration: 35.0
  },
  {
    id: 'cyber-city',
    name: 'Cinematic Visual Sequence (1080p)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    duration: 60.0
  }
];
