/**
 * PlanCheck AI - State Management Module
 * Manages active session, participant records, findings, AI validations, and persistence in LocalStorage.
 */

const STORAGE_KEYS = {
  SESSIONS: 'plancheck_ai_sessions_v1',
  ACTIVE_SESSION: 'plancheck_ai_active_session_v1',
  SETTINGS: 'plancheck_ai_settings_v1'
};

const GROUND_TRUTH_ERRORS = [
  { id: 'E1', sector: 'F1', recinto: 'Cocina', type: 'Dimensional', title: 'F1 - Cocina: cota 10\'6"X10" (original 12\'6"X10")', keywords: ['cocina', 'kitchen', 'f1', '10\'6', '12\'6', 'cota'] },
  { id: 'E2', sector: 'F3', recinto: 'Cocina', type: 'Dimensional', title: 'F3 - Cocina: cota 12\'6"X8" (original 12\'6"X10")', keywords: ['cocina', 'kitchen', 'f3', 'x8', 'x10', 'cota'] },
  { id: 'E3', sector: 'F1', recinto: 'Dormitorio', type: 'Dimensional', title: 'F1 - Dormitorio: cota 10\'6"X12\'2" (original 10\'6"X14\'2")', keywords: ['dormitorio', 'bedroom', 'f1', '12\'2', '14\'2', 'cota'] },
  { id: 'E4', sector: 'F3', recinto: 'Dormitorio', type: 'Dimensional', title: 'F3 - Dormitorio: cota 12\'6"X14\'2" (original 10\'6"X14\'2")', keywords: ['dormitorio', 'bedroom', 'f3', '12\'6', '10\'6', 'cota'] },
  { id: 'E5', sector: 'F2', recinto: 'Hall', type: 'Dimensional', title: 'F2 - Hall: cota 10\'6"X18\'4" (original 10\'6"X16\'4")', keywords: ['hall', 'f2', '18\'4', '16\'4', 'cota'] },
  { id: 'E6', sector: 'F4', recinto: 'Hall', type: 'Dimensional', title: 'F4 - Hall: cota 8\'6"X16\'4" (original 10\'6"X16\'4")', keywords: ['hall', 'f4', '8\'6', '10\'6', 'cota'] },
  { id: 'E7', sector: 'F2', recinto: 'Dining', type: 'Dimensional', title: 'F2 - Dining (Comedor): cota 7\'6"X9\'4" (original 7\'6"X7\'4")', keywords: ['dining', 'comedor', 'f2', '9\'4', '7\'4', 'cota'] },
  { id: 'E8', sector: 'F4', recinto: 'Master Bed Room', type: 'Dimensional', title: 'F4 - Master Bed Room: cota 12\'6"X10\'2" (original 12\'6"X14\'2")', keywords: ['master', 'bed room', 'dormitorio principal', 'f4', '10\'2', '14\'2', 'cota'] }
];

class StateManager {
  constructor() {
    this.GROUND_TRUTH_ERRORS = GROUND_TRUTH_ERRORS;
    this.currentSession = null;
    this.allSessions = [];
    this.settings = {
      geminiApiKey: '',
      aiModel: 'gemini-1.5-flash',
      useDemoMode: true
    };
    this.listeners = [];

    this.init();
  }

  init() {
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const storedSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (storedSessions) {
        this.allSessions = JSON.parse(storedSessions);
      }

      const active = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
      if (active) {
        this.currentSession = JSON.parse(active);
      }

      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (storedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(storedSettings) };
      }
    } catch (err) {
      console.error('Error loading state from localStorage:', err);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(this.allSessions));
      if (this.currentSession) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(this.currentSession));
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
      }
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
    } catch (err) {
      console.error('Error saving state to localStorage:', err);
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notify(event, data) {
    this.saveToStorage();
    this.listeners.forEach(cb => {
      try {
        cb(event, data, this);
      } catch (err) {
        console.error('State listener error:', err);
      }
    });
  }

  // Create a new session
  startNewSession(participantData, modality) {
    const newSession = {
      id: 'SES-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      participant: {
        name: participantData.name || 'Anónimo',
        code: participantData.code || 'EST-' + Math.floor(1000 + Math.random() * 9000),
        semester: participantData.semester || 'No especificado',
        institution: participantData.institution || 'Obras Civiles'
      },
      modality: modality, // 'sin_ia' | 'con_ia'
      status: 'in_progress', // 'in_progress' | 'completed'
      timestamps: {
        startedAt: new Date().toISOString(),
        finishedAt: null,
        elapsedSeconds: 0
      },
      planSource: 'demo_svg',
      findings: [],
      aiAssistance: {
        queriesCount: 0,
        lastQuery: '',
        suggestions: []
      },
      survey: null
    };

    this.currentSession = newSession;
    this.notify('SESSION_STARTED', this.currentSession);
    return this.currentSession;
  }

  getCurrentSession() {
    return this.currentSession;
  }

  getAllSessions() {
    return this.allSessions;
  }

  updateTimer(elapsedSeconds) {
    if (this.currentSession && this.currentSession.status === 'in_progress') {
      this.currentSession.timestamps.elapsedSeconds = elapsedSeconds;
      this.notify('TIMER_UPDATED', elapsedSeconds);
    }
  }

  evaluateGroundTruth(findings = []) {
    let detectedCount = 0;
    const detectedIds = [];
    const analysis = this.GROUND_TRUTH_ERRORS.map(gt => {
      const match = findings.some(f => {
        const text = `${f.location || ''} ${f.description || ''} ${f.type || ''} ${f.correction || ''}`.toLowerCase();
        return (f.type && f.type.toLowerCase() === gt.type.toLowerCase()) || gt.keywords.some(k => text.includes(k));
      });
      if (match) {
        detectedCount++;
        detectedIds.push(gt.id);
      }
      return { ...gt, detected: match };
    });

    const omittedCount = this.GROUND_TRUTH_ERRORS.length - detectedCount;
    const recallRate = Math.round((detectedCount / this.GROUND_TRUTH_ERRORS.length) * 100);

    return {
      total: this.GROUND_TRUTH_ERRORS.length,
      detectedCount,
      omittedCount,
      recallRate,
      detectedIds,
      analysis
    };
  }

  finishCurrentSession() {
    if (!this.currentSession) return null;

    this.currentSession.status = 'completed';
    this.currentSession.timestamps.finishedAt = new Date().toISOString();
    this.currentSession.groundTruthEvaluation = this.evaluateGroundTruth(this.currentSession.findings);

    // Check if session already exists in list, update or push
    const index = this.allSessions.findIndex(s => s.id === this.currentSession.id);
    if (index >= 0) {
      this.allSessions[index] = { ...this.currentSession };
    } else {
      this.allSessions.push({ ...this.currentSession });
    }

    this.notify('SESSION_FINISHED', this.currentSession);
    return this.currentSession;
  }

  resetActiveSession() {
    this.currentSession = null;
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    this.notify('SESSION_RESET', null);
  }

  // Findings CRUD
  addFinding(finding) {
    if (!this.currentSession) return false;

    const idNumber = this.currentSession.findings.length + 1;
    const newFinding = {
      id: `H-${String(idNumber).padStart(2, '0')}`,
      location: finding.location || 'No especificada',
      type: finding.type || 'Inconsistencia',
      description: finding.description || '',
      correction: finding.correction || '',
      confidence: finding.confidence || 'Medio',
      pinCoords: finding.pinCoords || null,
      createdAt: new Date().toISOString(),
      source: finding.source || 'manual' // 'manual' | 'imported_from_ai'
    };

    this.currentSession.findings.push(newFinding);
    this.notify('FINDING_ADDED', newFinding);
    return newFinding;
  }

  updateFinding(findingId, updatedData) {
    if (!this.currentSession) return false;
    const index = this.currentSession.findings.findIndex(f => f.id === findingId);
    if (index >= 0) {
      this.currentSession.findings[index] = {
        ...this.currentSession.findings[index],
        ...updatedData
      };
      this.notify('FINDING_UPDATED', this.currentSession.findings[index]);
      return true;
    }
    return false;
  }

  deleteFinding(findingId) {
    if (!this.currentSession) return false;
    this.currentSession.findings = this.currentSession.findings.filter(f => f.id !== findingId);
    this.notify('FINDING_DELETED', findingId);
    return true;
  }

  // AI & HITL Validations
  setAiSuggestions(suggestions, queryText = '') {
    if (!this.currentSession) return;
    this.currentSession.aiAssistance.queriesCount += 1;
    this.currentSession.aiAssistance.lastQuery = queryText;
    this.currentSession.aiAssistance.suggestions = suggestions;
    this.notify('AI_SUGGESTIONS_LOADED', suggestions);
  }

  updateAiValidation(suggestionId, validationStatus, comment = '') {
    if (!this.currentSession) return false;
    const suggestion = this.currentSession.aiAssistance.suggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      suggestion.validation = validationStatus; // 'confirmed' | 'false_positive' | 'needs_review'
      if (comment !== undefined) {
        suggestion.userComment = comment;
      }
      suggestion.validatedAt = new Date().toISOString();
      this.notify('AI_VALIDATION_UPDATED', suggestion);
      return true;
    }
    return false;
  }

  // Post Survey
  saveSurveyResults(surveyData) {
    if (!this.currentSession) return false;
    this.currentSession.survey = {
      ratings: surveyData.ratings,
      comments: surveyData.comments || '',
      submittedAt: new Date().toISOString()
    };

    // Update in allSessions list as well
    const index = this.allSessions.findIndex(s => s.id === this.currentSession.id);
    if (index >= 0) {
      this.allSessions[index] = { ...this.currentSession };
    } else {
      this.allSessions.push({ ...this.currentSession });
    }

    this.notify('SURVEY_SAVED', this.currentSession.survey);
    return true;
  }

  // Settings
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.notify('SETTINGS_UPDATED', this.settings);
  }

  loadDemoDataset() {
    const demoSessions = [
      // Grupo de Control (Sin IA) - Revisión manual tradicional
      {
        id: 'SES-DEMO-01',
        participant: { name: 'Participante 01 [DEMO]', code: 'EST-CTRL-101', semester: '8vo Semestre' },
        modality: 'sin_ia',
        status: 'completed',
        timestamps: { startedAt: '2026-09-08T10:00:00.000Z', finishedAt: '2026-09-08T10:14:30.000Z', elapsedSeconds: 870 },
        findings: [
          { id: 'H-01', location: 'F1 - Cocina', type: 'Dimensional', description: 'Cota 10\'6"X10" discordante con crujía de 12\'6"', correction: 'Ajustar a 12\'6"X10"', confidence: 'Alto' },
          { id: 'H-02', location: 'F3 - Cocina', type: 'Dimensional', description: 'Cota 12\'6"X8" con profundidad insuficiente', correction: 'Ajustar a 12\'6"X10"', confidence: 'Medio' },
          { id: 'H-03', location: 'F2 - Hall', type: 'Dimensional', description: 'Cota 10\'6"X18\'4" excede longitud de 16\'4"', correction: '10\'6"X16\'4"', confidence: 'Alto' }
        ],
        aiAssistance: { queriesCount: 0, suggestions: [] },
        survey: { ratings: { q1_usefulness: 3, q2_reliability: 3, q3_facilitation: 3, q4_need_to_verify: 5, q5_future_use: 3 }, comments: 'Revisión manual requiere comparar meticulosamente cada departamento.' }
      },
      {
        id: 'SES-DEMO-02',
        participant: { name: 'Participante 02 [DEMO]', code: 'EST-CTRL-102', semester: '7mo Semestre' },
        modality: 'sin_ia',
        status: 'completed',
        timestamps: { startedAt: '2026-09-08T10:30:00.000Z', finishedAt: '2026-09-08T10:46:10.000Z', elapsedSeconds: 970 },
        findings: [
          { id: 'H-01', location: 'F1 - Dormitorio', type: 'Dimensional', description: 'Cota 10\'6"X12\'2" en vez de 14\'2"', correction: '10\'6"X14\'2"', confidence: 'Alto' },
          { id: 'H-02', location: 'F4 - Master Bed Room', type: 'Dimensional', description: 'Cota 12\'6"X10\'2" con 4 pies menos que el recinto gemelo', correction: '12\'6"X14\'2"', confidence: 'Alto' }
        ],
        aiAssistance: { queriesCount: 0, suggestions: [] },
        survey: { ratings: { q1_usefulness: 3, q2_reliability: 3, q3_facilitation: 2, q4_need_to_verify: 5, q5_future_use: 3 }, comments: 'Se omitieron algunos errores en los halls y comedores por sobrecarga visual.' }
      },
      {
        id: 'SES-DEMO-03',
        participant: { name: 'Participante 03 [DEMO]', code: 'EST-CTRL-103', semester: '9no Semestre' },
        modality: 'sin_ia',
        status: 'completed',
        timestamps: { startedAt: '2026-09-08T11:00:00.000Z', finishedAt: '2026-09-08T11:13:40.000Z', elapsedSeconds: 820 },
        findings: [
          { id: 'H-01', location: 'F1 - Cocina', type: 'Dimensional', description: 'Cota 10\'6"X10" errónea en ancho', correction: '12\'6"X10"', confidence: 'Alto' },
          { id: 'H-02', location: 'F3 - Dormitorio', type: 'Dimensional', description: 'Cota 12\'6"X14\'2" excede ancho de crujía', correction: '10\'6"X14\'2"', confidence: 'Alto' },
          { id: 'H-03', location: 'F2 - Dining', type: 'Dimensional', description: 'Cota 7\'6"X9\'4" desfasada en 2 pies', correction: '7\'6"X7\'4"', confidence: 'Medio' },
          { id: 'H-04', location: 'F4 - Hall', type: 'Dimensional', description: 'Cota 8\'6"X16\'4" con ancho menor a 10\'6"', correction: '10\'6"X16\'4"', confidence: 'Alto' }
        ],
        aiAssistance: { queriesCount: 0, suggestions: [] },
        survey: { ratings: { q1_usefulness: 4, q2_reliability: 3, q3_facilitation: 3, q4_need_to_verify: 5, q5_future_use: 4 }, comments: 'Identificados 4 de los errores buscando simetrías entre departamentos.' }
      },
      // Grupo Experimental (Con IA) - Asistencia y Validación Crítica Human-in-the-Loop
      {
        id: 'SES-DEMO-04',
        participant: { name: 'Participante 04 [DEMO]', code: 'EST-EXP-201', semester: '8vo Semestre' },
        modality: 'con_ia',
        status: 'completed',
        timestamps: { startedAt: '2026-09-08T14:00:00.000Z', finishedAt: '2026-09-08T14:09:15.000Z', elapsedSeconds: 555 },
        findings: [
          { id: 'H-01', location: 'F1 - Cocina', type: 'Dimensional', description: '[Validado desde IA] Cota 10\'6"X10" en vez de 12\'6"X10"', correction: '12\'6"X10"', confidence: 'Alto', source: 'imported_from_ai' },
          { id: 'H-02', location: 'F3 - Cocina', type: 'Dimensional', description: '[Validado desde IA] Cota 12\'6"X8" fondo reducido', correction: '12\'6"X10"', confidence: 'Alto', source: 'imported_from_ai' },
          { id: 'H-03', location: 'F1 - Dormitorio', type: 'Dimensional', description: '[Validado desde IA] Cota 10\'6"X12\'2" reducida', correction: '10\'6"X14\'2"', confidence: 'Alto', source: 'imported_from_ai' },
          { id: 'H-04', location: 'F3 - Dormitorio', type: 'Dimensional', description: '[Validado desde IA] Cota 12\'6"X14\'2" excedida', correction: '10\'6"X14\'2"', confidence: 'Alto', source: 'imported_from_ai' },
          { id: 'H-05', location: 'F2 - Hall', type: 'Dimensional', description: '[Validado desde IA] Cota 10\'6"X18\'4" con 2 pies de exceso', correction: '10\'6"X16\'4"', confidence: 'Alto', source: 'imported_from_ai' },
          { id: 'H-06', location: 'F4 - Master Bed Room', type: 'Dimensional', description: '[Validado desde IA] Cota 12\'6"X10\'2" con 4 pies de déficit', correction: '12\'6"X14\'2"', confidence: 'Alto', source: 'imported_from_ai' }
        ],
        aiAssistance: {
          queriesCount: 1,
          suggestions: [
            { id: 'AI-01', type: 'Dimensional', location: 'F1 - Cocina', description: 'Cota 10\'6"X10"', validation: 'confirmed', userComment: 'Confirmado, discrepancia con modulación simétrica.' },
            { id: 'AI-02', type: 'Dimensional', location: 'F3 - Cocina', description: 'Cota 12\'6"X8"', validation: 'confirmed', userComment: 'Confirmado, fondo estándar es 10\'.' },
            { id: 'AI-03', type: 'Dimensional', location: 'F1 - Dormitorio', description: 'Cota 10\'6"X12\'2"', validation: 'confirmed', userComment: 'Confirmado, longitud de muro es 14\'2".' },
            { id: 'AI-04', type: 'Dimensional', location: 'F3 - Dormitorio', description: 'Cota 12\'6"X14\'2"', validation: 'confirmed', userComment: 'Confirmado, crujía es de 10\'6".' },
            { id: 'AI-05', type: 'Dimensional', location: 'F2 - Hall', description: 'Cota 10\'6"X18\'4"', validation: 'confirmed', userComment: 'Confirmado, simetría con F4 es 16\'4".' },
            { id: 'AI-06', type: 'Inconsistencia', location: 'F1 - Balcón', description: 'Viga de borde exigida en voladizo', validation: 'false_positive', userComment: 'Falso positivo: En losa maciza de 4 pies no se requiere viga de borde invertida.' },
            { id: 'AI-07', type: 'Dimensional', location: 'F4 - Hall', description: 'Cota 8\'6"X16\'4"', validation: 'confirmed', userComment: 'Confirmado.' },
            { id: 'AI-08', type: 'Dimensional', location: 'F2 - Dining', description: 'Cota 7\'6"X9\'4"', validation: 'needs_review', userComment: 'Verificar si corresponde a comedor extendido.' },
            { id: 'AI-09', type: 'Dimensional', location: 'F4 - Master Bed Room', description: 'Cota 12\'6"X10\'2"', validation: 'confirmed', userComment: 'Confirmado, déficit de 4 pies.' },
            { id: 'AI-10', type: 'Inconsistencia', location: 'Muro F1-F3', description: 'Espesor tabique acústico', validation: 'false_positive', userComment: 'Falso positivo: Plano arquitectónico no define detalles acústicos de tabique.' }
          ]
        },
        survey: { ratings: { q1_usefulness: 5, q2_reliability: 4, q3_facilitation: 5, q4_need_to_verify: 5, q5_future_use: 5 }, comments: 'La IA aceleró notablemente la detección de cotas desfasadas, pero fue fundamental descartar las 2 recomendaciones erróneas sobre el balcón y tabique.' }
      },
      {
        id: 'SES-DEMO-05',
        participant: { name: 'Participante 05 [DEMO]', code: 'EST-EXP-202', semester: '7mo Semestre' },
        modality: 'con_ia',
        status: 'completed',
        timestamps: { startedAt: '2026-09-08T14:30:00.000Z', finishedAt: '2026-09-08T14:38:40.000Z', elapsedSeconds: 520 },
        findings: [
          { id: 'H-01', location: 'F1 - Cocina', type: 'Dimensional', description: '[Validado desde IA] Cota 10\'6"X10"', correction: '12\'6"X10"', confidence: 'Alto', source: 'imported_from_ai' },
          { id: 'H-02', location: 'F1 - Dormitorio', type: 'Dimensional', description: '[Validado desde IA] Cota 10\'6"X12\'2"', correction: '10\'6"X14\'2"', confidence: 'Alto', source: 'imported_from_ai' },
          { id: 'H-03', location: 'F2 - Hall', type: 'Dimensional', description: '[Validado desde IA] Cota 10\'6"X18\'4"', correction: '10\'6"X16\'4"', confidence: 'Alto', source: 'imported_from_ai' },
          { id: 'H-04', location: 'F4 - Hall', type: 'Dimensional', description: '[Validado desde IA] Cota 8\'6"X16\'4"', correction: '10\'6"X16\'4"', confidence: 'Alto', source: 'imported_from_ai' },
          { id: 'H-05', location: 'F2 - Dining', type: 'Dimensional', description: '[Validado desde IA] Cota 7\'6"X9\'4"', correction: '7\'6"X7\'4"', confidence: 'Alto', source: 'imported_from_ai' },
          { id: 'H-06', location: 'F4 - Master Bed Room', type: 'Dimensional', description: '[Validado desde IA] Cota 12\'6"X10\'2"', correction: '12\'6"X14\'2"', confidence: 'Alto', source: 'imported_from_ai' },
          { id: 'H-07', location: 'F3 - Cocina', type: 'Dimensional', description: '[Validado desde IA] Cota 12\'6"X8"', correction: '12\'6"X10"', confidence: 'Alto', source: 'imported_from_ai' }
        ],
        aiAssistance: {
          queriesCount: 1,
          suggestions: [
            { id: 'AI-01', type: 'Dimensional', location: 'F1 - Cocina', description: 'Cota 10\'6"X10"', validation: 'confirmed', userComment: 'Confirmado.' },
            { id: 'AI-02', type: 'Dimensional', location: 'F3 - Cocina', description: 'Cota 12\'6"X8"', validation: 'confirmed', userComment: 'Confirmado.' },
            { id: 'AI-03', type: 'Dimensional', location: 'F1 - Dormitorio', description: 'Cota 10\'6"X12\'2"', validation: 'confirmed', userComment: 'Confirmado.' },
            { id: 'AI-04', type: 'Dimensional', location: 'F3 - Dormitorio', description: 'Cota 12\'6"X14\'2"', validation: 'needs_review', userComment: 'Revisar cota en eje F3.' },
            { id: 'AI-05', type: 'Dimensional', location: 'F2 - Hall', description: 'Cota 10\'6"X18\'4"', validation: 'confirmed', userComment: 'Confirmado.' },
            { id: 'AI-06', type: 'Inconsistencia', location: 'F1 - Balcón', description: 'Viga perimetral balcón', validation: 'false_positive', userComment: 'Falso positivo estructural.' },
            { id: 'AI-07', type: 'Dimensional', location: 'F4 - Hall', description: 'Cota 8\'6"X16\'4"', validation: 'confirmed', userComment: 'Confirmado.' },
            { id: 'AI-08', type: 'Dimensional', location: 'F2 - Dining', description: 'Cota 7\'6"X9\'4"', validation: 'confirmed', userComment: 'Confirmado.' },
            { id: 'AI-09', type: 'Dimensional', location: 'F4 - Master Bed Room', description: 'Cota 12\'6"X10\'2"', validation: 'confirmed', userComment: 'Confirmado.' },
            { id: 'AI-10', type: 'Inconsistencia', location: 'Muro F1-F3', description: 'Espesor muro divisorio', validation: 'false_positive', userComment: 'Falso positivo.' }
          ]
        },
        survey: { ratings: { q1_usefulness: 4, q2_reliability: 4, q3_facilitation: 5, q4_need_to_verify: 5, q5_future_use: 5 }, comments: 'Muy útil para reducir fatiga visual y comparar cuadrantes.' }
      },
      {
        id: 'SES-DEMO-06',
        participant: { name: 'Participante 06 [DEMO]', code: 'EST-EXP-203', semester: '9no Semestre' },
        modality: 'con_ia',
        status: 'completed',
        timestamps: { startedAt: '2026-09-08T15:00:00.000Z', finishedAt: '2026-09-08T15:07:45.000Z', elapsedSeconds: 465 },
        findings: [
          { id: 'H-01', location: 'F1 - Cocina', type: 'Dimensional', description: 'Cota 10\'6"X10" cambiada', correction: '12\'6"X10"', confidence: 'Alto', source: 'imported_from_ai' },
          { id: 'H-02', location: 'F3 - Cocina', type: 'Dimensional', description: 'Cota 12\'6"X8" cambiada', correction: '12\'6"X10"', confidence: 'Alto', source: 'imported_from_ai' },
          { id: 'H-03', location: 'F1 - Dormitorio', type: 'Dimensional', description: 'Cota 10\'6"X12\'2" cambiada', correction: '10\'6"X14\'2"', confidence: 'Alto', source: 'imported_from_ai' },
          { id: 'H-04', location: 'F3 - Dormitorio', type: 'Dimensional', description: 'Cota 12\'6"X14\'2" cambiada', correction: '10\'6"X14\'2"', confidence: 'Alto', source: 'imported_from_ai' },
          { id: 'H-05', location: 'F2 - Hall', type: 'Dimensional', description: 'Cota 10\'6"X18\'4" cambiada', correction: '10\'6"X16\'4"', confidence: 'Alto', source: 'imported_from_ai' },
          { id: 'H-06', location: 'F4 - Hall', type: 'Dimensional', description: 'Cota 8\'6"X16\'4" cambiada', correction: '10\'6"X16\'4"', confidence: 'Alto', source: 'imported_from_ai' },
          { id: 'H-07', location: 'F2 - Dining', type: 'Dimensional', description: 'Cota 7\'6"X9\'4" cambiada', correction: '7\'6"X7\'4"', confidence: 'Alto', source: 'imported_from_ai' },
          { id: 'H-08', location: 'F4 - Master Bed Room', type: 'Dimensional', description: 'Cota 12\'6"X10\'2" cambiada', correction: '12\'6"X14\'2"', confidence: 'Alto', source: 'imported_from_ai' }
        ],
        aiAssistance: {
          queriesCount: 1,
          suggestions: [
            { id: 'AI-01', type: 'Dimensional', location: 'F1 - Cocina', description: 'Cota 10\'6"X10"', validation: 'confirmed', userComment: 'Confirmado (E1).' },
            { id: 'AI-02', type: 'Dimensional', location: 'F3 - Cocina', description: 'Cota 12\'6"X8"', validation: 'confirmed', userComment: 'Confirmado (E2).' },
            { id: 'AI-03', type: 'Dimensional', location: 'F1 - Dormitorio', description: 'Cota 10\'6"X12\'2"', validation: 'confirmed', userComment: 'Confirmado (E3).' },
            { id: 'AI-04', type: 'Dimensional', location: 'F3 - Dormitorio', description: 'Cota 12\'6"X14\'2"', validation: 'confirmed', userComment: 'Confirmado (E4).' },
            { id: 'AI-05', type: 'Dimensional', location: 'F2 - Hall', description: 'Cota 10\'6"X18\'4"', validation: 'confirmed', userComment: 'Confirmado (E5).' },
            { id: 'AI-06', type: 'Inconsistencia', location: 'F1 - Balcón', description: 'Viga perimetral balcón', validation: 'false_positive', userComment: 'Descartado: Viga innecesaria.' },
            { id: 'AI-07', type: 'Dimensional', location: 'F4 - Hall', description: 'Cota 8\'6"X16\'4"', validation: 'confirmed', userComment: 'Confirmado (E6).' },
            { id: 'AI-08', type: 'Dimensional', location: 'F2 - Dining', description: 'Cota 7\'6"X9\'4"', validation: 'confirmed', userComment: 'Confirmado (E7).' },
            { id: 'AI-09', type: 'Dimensional', location: 'F4 - Master Bed Room', description: 'Cota 12\'6"X10\'2"', validation: 'confirmed', userComment: 'Confirmado (E8).' },
            { id: 'AI-10', type: 'Inconsistencia', location: 'Muro F1-F3', description: 'Espesor tabique acústico', validation: 'false_positive', userComment: 'Descartado: Alucinación fuera de alcance de arquitectura básica.' }
          ]
        },
        survey: { ratings: { q1_usefulness: 5, q2_reliability: 4, q3_facilitation: 5, q4_need_to_verify: 5, q5_future_use: 5 }, comments: 'Excelente herramienta. Se lograron identificar los 8 errores en casi la mitad del tiempo del grupo control.' }
      }
    ];

    this.allSessions = demoSessions;
    this.saveToStorage();
    this.notify('DEMO_DATA_LOADED', this.allSessions);
  }

  clearAllData() {
    this.currentSession = null;
    this.allSessions = [];
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    this.notify('ALL_DATA_CLEARED', null);
  }
}

// Global singleton instance
window.state = new StateManager();
