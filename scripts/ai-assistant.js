/**
 * PlanCheck AI - AI Assistant Module
 * Matched strictly to the official research design "PROJECT - 2" (8 controlled errors + 2 control false positives)
 * For evaluating Human-in-the-Loop critical validation in Civil Engineering.
 */

// Calibrated DEMO responses specifically matched to the 8 controlled errors of "PROJECT - 2"
const DEMO_AI_SUGGESTIONS = [
  {
    id: 'AI-01',
    title: 'Discrepancia dimensional en Cocina Depto. F1',
    type: 'Dimensional',
    location: 'Depto. F1 (Norponiente) - Cocina (Kitchen)',
    description: 'La cota rotulada indica 10\'6"X10". En la modulación estructural simétrica del proyecto (Depto. F3) y según los ejes de crujía, la cota de diseño es 12\'6"X10". Existe una reducción anómala de 2\'-0" en el ancho.',
    rationale: 'Inconsistencia dimensional en la cota de ancho respecto a la modulación de ejes en F1.',
    proposedCorrection: 'Restituir la cota a 12\'6"X10" conforme al estándar del edificio.',
    validation: null,
    userComment: '',
    groundTruthRef: 'E1'
  },
  {
    id: 'AI-02',
    title: 'Discrepancia en dimensión de fondo de Cocina Depto. F3',
    type: 'Dimensional',
    location: 'Depto. F3 (Nororiente) - Cocina (Kitchen)',
    description: 'La cota rotulada indica 12\'6"X8", observándose una reducción de 2\'-0" en la profundidad respecto a los 10\' de fondo estándar.',
    rationale: 'Falta de coincidencia con la cota típica de cocina de 10\' del plano tipo.',
    proposedCorrection: 'Rectificar cota a 12\'6"X10".',
    validation: null,
    userComment: '',
    groundTruthRef: 'E2'
  },
  {
    id: 'AI-03',
    title: 'Discrepancia de longitud en Dormitorio Depto. F1',
    type: 'Dimensional',
    location: 'Depto. F1 - Bed Room (Sector Poniente)',
    description: 'La anotación indica 10\'6"X12\'2", cuando la distancia entre paños de muros estructurales corresponde a 14\'2" (desfase de 2\'-0").',
    rationale: 'Inconsistencia entre la longitud acotada y el vano de tabiquería del dormitorio.',
    proposedCorrection: 'Corregir rotulación a 10\'6"X14\'2".',
    validation: null,
    userComment: '',
    groundTruthRef: 'E3'
  },
  {
    id: 'AI-04',
    title: 'Sobre-anotación de ancho en Dormitorio Depto. F3',
    type: 'Dimensional',
    location: 'Depto. F3 - Bed Room (Sector Oriente)',
    description: 'La cota indica 12\'6"X14\'2", excediendo en 2\'-0" el ancho modular de 10\'6" que le corresponde según la planta tipo.',
    rationale: 'Discrepancia dimensional por exceso en la dimensión horizontal de dormitorio F3.',
    proposedCorrection: 'Ajustar anotación a 10\'6"X14\'2".',
    validation: null,
    userComment: '',
    groundTruthRef: 'E4'
  },
  {
    id: 'AI-05',
    title: 'Desfase por exceso en Hall de Acceso Depto. F2',
    type: 'Dimensional',
    location: 'Depto. F2 (Surponiente) - Hall de Acceso',
    description: 'La cota señala 10\'6"X18\'4", lo que representa un incremento de 2\'-0" sobre la longitud real de 16\'4" del eje simétrico F4.',
    rationale: 'Inconsistencia en la dimensión longitudinal del hall en departamento F2.',
    proposedCorrection: 'Corregir cota a 10\'6"X16\'4".',
    validation: null,
    userComment: '',
    groundTruthRef: 'E5'
  },
  {
    id: 'AI-06',
    title: 'Viga de borde en losa de Balcón F1 declarada ausente',
    type: 'Inconsistencia',
    location: 'Depto. F1 - Balcony (10\'6"X4\')',
    description: 'La IA sugiere que el voladizo de 4 pies requiere obligatoriamente una viga perimetral invertida de confinamiento estructural bajo la norma sísmica.',
    rationale: 'Inferencia algorítmica sobre losas en voladizo para edificación residencial.',
    proposedCorrection: 'Agregar viga perimetral de borde 20x40 cm.',
    validation: null,
    userComment: '',
    isFpTestItem: true // Ítem de control HITL: En losas macizas de 4', el diseño en voladizo es estándar y no requiere viga de borde; evalúa si el estudiante descarta como Falso Positivo.
  },
  {
    id: 'AI-07',
    title: 'Reducción anómala de ancho en Hall Depto. F4',
    type: 'Dimensional',
    location: 'Depto. F4 (Suroriente) - Hall de Acceso',
    description: 'La cota rotulada indica 8\'6"X16\'4", registrando un estrechamiento de 2\'-0" en el ancho respecto a los 10\'6" del departamento contiguo.',
    rationale: 'Discrepancia en la dimensión transversal del hall F4 frente a la crujía estructural.',
    proposedCorrection: 'Restablecer cota a 10\'6"X16\'4".',
    validation: null,
    userComment: '',
    groundTruthRef: 'E6'
  },
  {
    id: 'AI-08',
    title: 'Discrepancia en Comedor (Dining) Depto. F2',
    type: 'Dimensional',
    location: 'Depto. F2 - Dining',
    description: 'La cota indica 7\'6"X9\'4", excediendo en 2\'-0" la dimensión de fondo de 7\'4" observada en el departamento gemelo F4.',
    rationale: 'Inconsistencia dimensional en el área de comedor del departamento F2.',
    proposedCorrection: 'Rectificar cota a 7\'6"X7\'4".',
    validation: null,
    userComment: '',
    groundTruthRef: 'E7'
  },
  {
    id: 'AI-09',
    title: 'Discrepancia en Master Bed Room Depto. F4',
    type: 'Dimensional',
    location: 'Depto. F4 - Master Bed Room',
    description: 'La cota señala 12\'6"X10\'2", presentando una discrepancia de 4\'-0" respecto a los 14\'2" del dormitorio principal simétrico.',
    rationale: 'Error de rotulación en la longitud útil del dormitorio principal en F4.',
    proposedCorrection: 'Ajustar cota a 12\'6"X14\'2".',
    validation: null,
    userComment: '',
    groundTruthRef: 'E8'
  },
  {
    id: 'AI-10',
    title: 'Espesor de tabiquería acústica entre F1 y F3 considerado insuficiente',
    type: 'Inconsistencia',
    location: 'Muro Divisorio Central entre F1 y F3',
    description: 'La IA sugiere que el muro divisorio de 6" no satisface el aislamiento acústico de 45 dB y exige aumentarlo a 8".',
    rationale: 'Estimación acústica automatizada no requerida en planos de distribución arquitectónica básica.',
    proposedCorrection: 'Modificar espesor de tabique a 8".',
    validation: null,
    userComment: '',
    isFpTestItem: true // Ítem de control HITL: En planos de distribución general de arquitectura básica, no procede modificar el eje estructural; evalúa espíritu crítico.
  }
];

class AIAssistant {
  constructor() {
    this.queryInput = document.getElementById('ai-query-input');
    this.askButton = document.getElementById('btn-ask-ai');
    this.resultsContainer = document.getElementById('ai-results-container');
    this.modeBadge = document.getElementById('ai-engine-status-badge');

    this.defaultPrompt = 'Analiza el plano e identifica posibles errores o inconsistencias dimensionales, geométricas o de anotación. Indica la ubicación y explica por qué consideras que existe una inconsistencia. No inventes información que no pueda observarse en el plano.';

    this.init();
  }

  init() {
    if (this.queryInput && !this.queryInput.value) {
      this.queryInput.value = this.defaultPrompt;
    }

    if (this.askButton) {
      this.askButton.addEventListener('click', () => this.handleAnalyzeRequest());
    }

    // Subscribe to state to update suggestions list
    if (window.state) {
      window.state.subscribe((event) => {
        if (
          event === 'AI_SUGGESTIONS_LOADED' ||
          event === 'AI_VALIDATION_UPDATED' ||
          event === 'SESSION_STARTED' ||
          event === 'SESSION_RESET'
        ) {
          this.renderSuggestions();
        }
      });
    }
  }

  async handleAnalyzeRequest() {
    if (!window.state || !window.state.currentSession) {
      alert('Debe iniciar la sesión de revisión antes de consultar a la IA.');
      return;
    }

    if (window.state.currentSession.modality !== 'con_ia') {
      alert('La asistencia de IA solo está habilitada en la modalidad "Revisión asistida por IA".');
      return;
    }

    const query = this.queryInput.value.trim();
    if (!query) {
      alert('Por favor ingrese una consulta o solicitud de análisis.');
      return;
    }

    this.setLoading(true);

    try {
      const settings = window.state.settings;
      if (!settings.useDemoMode && settings.geminiApiKey) {
        // Run live API
        await this.callLiveGeminiAPI(query, settings.geminiApiKey);
      } else {
        // Run Academic DEMO Simulation (8 controlled errors + 2 false positives)
        await this.simulateDemoInference(query);
      }
    } catch (error) {
      console.error('Error during AI analysis:', error);
      alert('Ocurrió un error al procesar el análisis de IA: ' + error.message);
    } finally {
      this.setLoading(false);
    }
  }

  setLoading(isLoading) {
    if (this.askButton) {
      this.askButton.disabled = isLoading;
      this.askButton.innerHTML = isLoading 
        ? '<span class="status-dot"></span> Analizando plano...'
        : '✨ Solicitar análisis de IA';
    }
  }

  simulateDemoInference(queryText) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Clone demo items with fresh state
        const suggestions = JSON.parse(JSON.stringify(DEMO_AI_SUGGESTIONS));
        window.state.setAiSuggestions(suggestions, queryText);
        resolve();
      }, 1200); // Realistic academic processing delay
    });
  }

  async callLiveGeminiAPI(queryText, apiKey) {
    // Prepared Gemini Vision REST Call
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const promptPayload = {
      contents: [{
        parts: [
          {
            text: `Eres un auditor técnico experto en Ingeniería en Obras Civiles y revisión de planos de edificación.
${queryText}
Devuelve tu análisis estrictamente en formato JSON con un array de objetos con las propiedades: id, title, type (Dimensional, Geométrico, Anotación, Inconsistencia, Otro), location, description, rationale, proposedCorrection.`
          }
        ]
      }]
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promptPayload)
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Error al conectar con la API de Gemini.');
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    let parsedSuggestions = [];
    try {
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsedSuggestions = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('Could not parse JSON from API response, using text format:', e);
    }

    if (parsedSuggestions.length === 0) {
      parsedSuggestions = [
        {
          id: 'AI-01',
          title: 'Respuesta generada por Gemini',
          type: 'Inconsistencia',
          location: 'Plano general',
          description: rawText.substring(0, 300) + '...',
          rationale: 'Análisis automatizado en vivo',
          proposedCorrection: 'Revisión por especialista',
          validation: null,
          userComment: ''
        }
      ];
    }

    window.state.setAiSuggestions(parsedSuggestions, queryText);
  }

  renderSuggestions() {
    if (!this.resultsContainer) return;

    const session = window.state ? window.state.currentSession : null;
    if (!session || !session.aiAssistance || session.aiAssistance.suggestions.length === 0) {
      this.resultsContainer.innerHTML = `
        <div class="findings-empty-state">
          <p>No se han solicitado análisis de IA en esta sesión.</p>
          <small style="color: var(--color-text-light); margin-top: 4px; display: block;">
            Presione el botón "Solicitar análisis de IA" para obtener recomendaciones preliminares.
          </small>
        </div>
      `;
      return;
    }

    const suggestions = session.aiAssistance.suggestions;

    let html = `
      <div class="academic-notice info" style="margin-bottom: 16px;">
        <div class="academic-notice-title">
          <span>🔬</span> Protocolo Human-in-the-Loop (Validación Humana Crítica)
        </div>
        <p>
          Se han emitido <strong>${suggestions.length} sugerencias</strong> preliminares. 
          Cada sugerencia debe ser clasificada críticamente como <strong>Error confirmado</strong>, 
          <strong>No es un error (Falso positivo)</strong> o <strong>Requiere revisión</strong>, justificando su criterio técnico.
        </p>
      </div>
    `;

    suggestions.forEach(s => {
      const validationState = s.validation; // 'confirmed' | 'false_positive' | 'needs_review' | null
      const cardClass = validationState ? `validated-${validationState}` : '';

      html += `
        <div class="ai-suggestion-card ${cardClass}" id="card-${s.id}">
          <div class="ai-card-top">
            <span class="ai-card-title">
              <span class="finding-id-tag" style="background: #6b21a8;">${s.id}</span>
              ${this.escapeHtml(s.title)}
            </span>
            <span class="finding-type-badge type-${s.type.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}">${s.type}</span>
          </div>

          <div style="font-size: 12px; color: var(--color-text-muted); margin-bottom: 6px;">
            📍 <strong>Ubicación:</strong> ${this.escapeHtml(s.location)}
          </div>

          <div class="ai-card-desc">
            ${this.escapeHtml(s.description)}
          </div>

          <div class="ai-card-rationale">
            <strong>Fundamento técnico IA:</strong> ${this.escapeHtml(s.rationale)}
          </div>

          ${s.proposedCorrection ? `
            <div class="finding-correction" style="margin-bottom: 12px;">
              <strong>Corrección sugerida:</strong> ${this.escapeHtml(s.proposedCorrection)}
            </div>
          ` : ''}

          <!-- HITL Classification Section -->
          <div class="hitl-section">
            <div class="hitl-header">
              <h5><span>⚖️</span> Tu Validación Crítica:</h5>
              ${s.validation ? `<span style="font-size: 11px; font-weight: 700; color: #1e3a8a;">Registrado</span>` : `<span style="font-size: 11px; color: #dc2626; font-weight: 600;">Pendiente de clasificar</span>`}
            </div>

            <div class="hitl-validation-buttons">
              <button 
                class="hitl-btn ${validationState === 'confirmed' ? 'selected-confirmed' : ''}" 
                onclick="window.validationManager.classify('${s.id}', 'confirmed')"
                title="Error confirmado (Acierto de la IA)">
                <span>✔️</span> Error confirmado
              </button>

              <button 
                class="hitl-btn ${validationState === 'false_positive' ? 'selected-false_positive' : ''}" 
                onclick="window.validationManager.classify('${s.id}', 'false_positive')"
                title="No es un error (Falso positivo descartado)">
                <span>❌</span> No es un error
              </button>

              <button 
                class="hitl-btn ${validationState === 'needs_review' ? 'selected-needs_review' : ''}" 
                onclick="window.validationManager.classify('${s.id}', 'needs_review')"
                title="Requiere revisión técnica adicional">
                <span>⚠️</span> Requiere revisión
              </button>
            </div>

            <div class="hitl-comment-area">
              <input 
                type="text" 
                class="form-control" 
                style="font-size: 12px; padding: 6px 10px;" 
                placeholder="Comentario técnico / justificación de tu clasificación..." 
                value="${this.escapeHtml(s.userComment || '')}"
                onchange="window.validationManager.saveComment('${s.id}', this.value)"
              />
            </div>

            <!-- Import to findings button if confirmed -->
            ${validationState === 'confirmed' ? `
              <div style="margin-top: 8px; text-align: right;">
                <button class="btn btn-secondary btn-sm" onclick="window.validationManager.importToFindings('${s.id}')">
                  📥 Incorporar a mis Hallazgos
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    });

    this.resultsContainer.innerHTML = html;
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

// Global initialization
window.AIAssistant = AIAssistant;
