/**
 * Antrenmanların dinamik yapılandırması
 * Her antrenmanın hangi alanlara sahip olduğunu tanımlar
 */

export const TRAINING_CONFIG = {
  flash: {
    name: 'Flash Okuma',
    icon: '⚡',
    color: '#7c3aed',
    desc: 'RSVP ile zihin hızına ulaş',
    fields: {
      duration: { label: 'Süre (sn)', type: 'number', min: 30, max: 7200, required: true },
      difficulty: { label: 'Zorluk (1-10)', type: 'number', min: 1, max: 10, required: true },
      reps: { label: 'Tekrar Sayısı', type: 'number', min: 1, max: 20, required: true },
      restTime: { label: 'Dinlenme (sn)', type: 'number', min: 10, max: 300, step: 10, required: true },
      targetWPM: { label: 'Hedef WPM', type: 'number', min: 100, max: 6000, step: 50, required: true },
      wpmIncrementPerRep: { label: 'Her Tekrar WPM Artışı', type: 'number', min: 10, max: 200, step: 10, required: false },
    },
  },
  guided: {
    name: 'Kılavuzlu Okuma',
    icon: '📖',
    color: '#7c3aed',
    desc: 'Ritim ve tempo ile akar gibi oku',
    fields: {
      duration: { label: 'Süre (sn)', type: 'number', min: 30, max: 7200, required: true },
      difficulty: { label: 'Zorluk (1-10)', type: 'number', min: 1, max: 10, required: true },
      reps: { label: 'Tekrar Sayısı', type: 'number', min: 1, max: 20, required: true },
      restTime: { label: 'Dinlenme (sn)', type: 'number', min: 10, max: 300, step: 10, required: true },
      targetWPM: { label: 'Hedef WPM', type: 'number', min: 100, max: 6000, step: 50, required: true },
    },
  },
  regress: {
    name: 'Regresyon Engeli',
    icon: '🚫',
    color: '#7c3aed',
    desc: 'Bir kez oku, tam anla',
    fields: {
      duration: { label: 'Süre (sn)', type: 'number', min: 30, max: 7200, required: true },
      difficulty: { label: 'Zorluk (1-10)', type: 'number', min: 1, max: 10, required: true },
      reps: { label: 'Tekrar Sayısı', type: 'number', min: 1, max: 20, required: true },
      restTime: { label: 'Dinlenme (sn)', type: 'number', min: 10, max: 300, step: 10, required: true },
      maxRegressionAllowed: { label: 'İzin Verilen Max Regresyon (%)', type: 'number', min: 0, max: 30, required: false },
    },
  },
  vert: {
    name: 'Dikey Okuma',
    icon: '↕️',
    color: '#0891b2',
    desc: 'Görüş alanını genişlet',
    fields: {
      duration: { label: 'Süre (sn)', type: 'number', min: 30, max: 7200, required: true },
      difficulty: { label: 'Zorluk (1-10)', type: 'number', min: 1, max: 10, required: true },
      reps: { label: 'Tekrar Sayısı', type: 'number', min: 1, max: 20, required: true },
      restTime: { label: 'Dinlenme (sn)', type: 'number', min: 10, max: 300, step: 10, required: true },
    },
  },
  eye: {
    name: 'Göz Jimi',
    icon: '👁️',
    color: '#0891b2',
    desc: 'Saccade eğitimi ile göz kasları',
    fields: {
      duration: { label: 'Süre (sn)', type: 'number', min: 30, max: 7200, required: true },
      difficulty: { label: 'Zorluk (1-10)', type: 'number', min: 1, max: 10, required: true },
      reps: { label: 'Tekrar Sayısı', type: 'number', min: 1, max: 20, required: true },
      targetTime: { label: 'Hedef Zaman (ms)', type: 'number', min: 100, max: 1000, step: 50, required: false },
    },
  },
  peripheral: {
    name: 'Görüş Alanı',
    icon: '🎯',
    color: '#0891b2',
    desc: 'Çevre görüşünü geliştir',
    fields: {
      duration: { label: 'Süre (sn)', type: 'number', min: 30, max: 7200, required: true },
      difficulty: { label: 'Zorluk (1-10)', type: 'number', min: 1, max: 10, required: true },
      reps: { label: 'Tekrar Sayısı', type: 'number', min: 1, max: 20, required: true },
      restTime: { label: 'Dinlenme (sn)', type: 'number', min: 10, max: 300, step: 10, required: true },
    },
  },
  schulte: {
    name: 'Schulte Tablosu',
    icon: '🎲',
    color: '#d97706',
    desc: 'Periferik görüş ve konsantrasyon',
    fields: {
      duration: { label: 'Süre (sn)', type: 'number', min: 30, max: 7200, required: true },
      difficulty: { label: 'Zorluk (1-10)', type: 'number', min: 1, max: 10, required: true },
      reps: { label: 'Tekrar Sayısı', type: 'number', min: 1, max: 20, required: true },
      targetTime: { label: 'Hedef Zaman (sn)', type: 'number', min: 30, max: 300, step: 5, required: true },
      gridSize: { label: 'Grid Boyutu (3-6)', type: 'number', min: 3, max: 6, required: false },
    },
  },
  memory: {
    name: 'Görsel Hafıza',
    icon: '🧠',
    color: '#d97706',
    desc: 'Kısa süreli belleği güçlendir',
    fields: {
      duration: { label: 'Süre (sn)', type: 'number', min: 30, max: 7200, required: true },
      difficulty: { label: 'Zorluk (1-10)', type: 'number', min: 1, max: 10, required: true },
      reps: { label: 'Tekrar Sayısı', type: 'number', min: 1, max: 20, required: true },
      shapeCount: { label: 'Şekil Sayısı', type: 'number', min: 3, max: 50, required: true },
      displayTime: { label: 'Gösterim Süresi (ms)', type: 'number', min: 500, max: 5000, step: 250, required: true },
    },
  },
};

export const getLessonConfig = (lessonId) => {
  return TRAINING_CONFIG[lessonId] || null;
};

export const getRequiredFields = (lessonId) => {
  const config = getLessonConfig(lessonId);
  if (!config) return [];
  return Object.entries(config.fields)
    .filter(([_, field]) => field.required)
    .map(([key]) => key);
};

export const getOptionalFields = (lessonId) => {
  const config = getLessonConfig(lessonId);
  if (!config) return [];
  return Object.entries(config.fields)
    .filter(([_, field]) => !field.required)
    .map(([key]) => key);
};

export const validateTrainingData = (lessonId, data) => {
  const config = getLessonConfig(lessonId);
  if (!config) return { valid: false, errors: ['Geçersiz ders ID'] };

  const errors = [];
  Object.entries(config.fields).forEach(([fieldKey, fieldConfig]) => {
    const value = data[fieldKey];
    if (fieldConfig.required && (value === undefined || value === null || value === '')) {
      errors.push(`${fieldConfig.label} gereklidir`);
    }
  });

  return { valid: errors.length === 0, errors };
};
