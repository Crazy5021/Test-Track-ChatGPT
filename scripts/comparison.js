/**
 * PlanCheck AI - Experimental Comparison Module
 * Analyzes and visually contrasts indicators between "Revisión sin IA" (Control)
 * and "Revisión asistida por IA" (Experimental).
 */

class ComparisonManager {
  constructor() {
    this.container = document.getElementById('comparison-results-view');
  }

  renderComparison() {
    if (!this.container || !window.state) return;

    const sessions = window.state.allSessions || [];

    // Filter by modality
    const noIa = sessions.filter(s => s.modality === 'sin_ia');
    const withIa = sessions.filter(s => s.modality === 'con_ia');

    // Aggregate statistics
    const statsNoIa = this.calculateGroupStats(noIa);
    const statsWithIa = this.calculateGroupStats(withIa);

    let html = `
      <div class="comparison-container">
        <div class="academic-notice info" style="margin-bottom: 24px;">
          <div class="academic-notice-title">
            <span>📊</span> Marco Comparativo Experimental
          </div>
          <p>
            Contraste empírico entre el grupo de control (<strong>Revisión sin IA</strong>) y el grupo experimental 
            (<strong>Revisión asistida por IA</strong>). Los datos reflejan las sesiones acumuladas en el instrumento.
          </p>
        </div>

        <!-- Sample Size Counter -->
        <div style="display: flex; gap: 14px; margin-bottom: 20px;">
          <div class="stat-metric-card" style="flex: 1;">
            <div class="stat-value" style="color: #3b82f6;">${noIa.length}</div>
            <div class="stat-label">Sesiones Sin IA (Control)</div>
          </div>
          <div class="stat-metric-card" style="flex: 1;">
            <div class="stat-value" style="color: #10b981;">${withIa.length}</div>
            <div class="stat-label">Sesiones Con IA (Experimental)</div>
          </div>
          <div class="stat-metric-card" style="flex: 1;">
            <div class="stat-value">${sessions.length}</div>
            <div class="stat-label">Total Muestras Registradas</div>
          </div>
        </div>

        <!-- Main Comparative Charts -->
        <div class="comparison-grid-2">
          <!-- 1. Tiempo de Revisión -->
          <div class="comparison-card">
            <h3><span>⏱️</span> Tiempo Medio de Revisión</h3>
            <p style="font-size: 13px; color: var(--color-text-muted); margin-bottom: 16px;">
              Mide la eficiencia temporal en el análisis crítico del plano técnico.
            </p>
            <div class="bar-chart-group">
              <div class="chart-bar-row">
                <div class="bar-row-label">
                  <span>Sin Asistencia IA</span>
                  <span>${window.timer.formatDurationVerbose(statsNoIa.avgTimeSeconds)}</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill fill-no-ia" style="width: ${this.calcBarPercent(statsNoIa.avgTimeSeconds, Math.max(statsNoIa.avgTimeSeconds, statsWithIa.avgTimeSeconds, 1))}%;">
                    ${statsNoIa.avgTimeSeconds}s
                  </div>
                </div>
              </div>

              <div class="chart-bar-row">
                <div class="bar-row-label">
                  <span>Asistida por IA</span>
                  <span>${window.timer.formatDurationVerbose(statsWithIa.avgTimeSeconds)}</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill fill-with-ia" style="width: ${this.calcBarPercent(statsWithIa.avgTimeSeconds, Math.max(statsNoIa.avgTimeSeconds, statsWithIa.avgTimeSeconds, 1))}%;">
                    ${statsWithIa.avgTimeSeconds}s
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. Errores Identificados -->
          <div class="comparison-card">
            <h3><span>🎯</span> Promedio de Hallazgos Detectados</h3>
            <p style="font-size: 13px; color: var(--color-text-muted); margin-bottom: 16px;">
              Cantidad media de inconsistencias registradas por estudiante en la sesión.
            </p>
            <div class="bar-chart-group">
              <div class="chart-bar-row">
                <div class="bar-row-label">
                  <span>Sin Asistencia IA</span>
                  <span>${statsNoIa.avgFindings.toFixed(1)} hallazgos</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill fill-no-ia" style="width: ${this.calcBarPercent(statsNoIa.avgFindings, Math.max(statsNoIa.avgFindings, statsWithIa.avgFindings, 1))}%;">
                    ${statsNoIa.avgFindings.toFixed(1)}
                  </div>
                </div>
              </div>

              <div class="chart-bar-row">
                <div class="bar-row-label">
                  <span>Asistida por IA</span>
                  <span>${statsWithIa.avgFindings.toFixed(1)} hallazgos</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill fill-with-ia" style="width: ${this.calcBarPercent(statsWithIa.avgFindings, Math.max(statsNoIa.avgFindings, statsWithIa.avgFindings, 1))}%;">
                    ${statsWithIa.avgFindings.toFixed(1)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. Tasa de Falsos Positivos y Validación Crítica -->
          <div class="comparison-card">
            <h3><span>🛡️</span> Validación Humana (Human-in-the-Loop)</h3>
            <p style="font-size: 13px; color: var(--color-text-muted); margin-bottom: 14px;">
              Clasificación de sugerencias emitidas por el asistente en la modalidad Con IA.
            </p>
            <div class="bar-chart-group">
              <div class="chart-bar-row">
                <div class="bar-row-label">
                  <span>Errores Confirmados por Estudiante</span>
                  <span>${statsWithIa.totalConfirmed} items</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill fill-with-ia" style="width: ${this.calcBarPercent(statsWithIa.totalConfirmed, Math.max(statsWithIa.totalSuggestions, 1))}%;">
                    ${statsWithIa.totalConfirmed}
                  </div>
                </div>
              </div>

              <div class="chart-bar-row">
                <div class="bar-row-label">
                  <span>Falsos Positivos Descartados (Espíritu Crítico)</span>
                  <span>${statsWithIa.totalFalsePositives} items</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill fill-falses" style="width: ${this.calcBarPercent(statsWithIa.totalFalsePositives, Math.max(statsWithIa.totalSuggestions, 1))}%;">
                    ${statsWithIa.totalFalsePositives}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 4. Percepción de Utilidad y Confiabilidad (Encuesta) -->
          <div class="comparison-card">
            <h3><span>📋</span> Percepción Subjetiva (Escala 1 - 5)</h3>
            <p style="font-size: 13px; color: var(--color-text-muted); margin-bottom: 14px;">
              Evaluación reportada en la encuesta post-experiencia.
            </p>
            <div class="bar-chart-group">
              <div class="chart-bar-row">
                <div class="bar-row-label">
                  <span>Utilidad Percibida</span>
                  <span>${statsWithIa.avgUsefulness.toFixed(1)} / 5.0</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill fill-with-ia" style="width: ${(statsWithIa.avgUsefulness / 5) * 100}%;">
                    ${statsWithIa.avgUsefulness.toFixed(1)}
                  </div>
                </div>
              </div>

              <div class="chart-bar-row">
                <div class="bar-row-label">
                  <span>Necesidad de Verificación Crítica</span>
                  <span>${statsWithIa.avgNeedToVerify.toFixed(1)} / 5.0</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill fill-no-ia" style="width: ${(statsWithIa.avgNeedToVerify / 5) * 100}%;">
                    ${statsWithIa.avgNeedToVerify.toFixed(1)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 5. Cobertura de Errores Calibrados (Detectados vs Omitidos) -->
          <div class="comparison-card" style="grid-column: span 2;">
            <h3><span>🎯</span> Cobertura de Errores del Plano Patrón (8 Errores Controlados)</h3>
            <p style="font-size: 13px; color: var(--color-text-muted); margin-bottom: 16px;">
              Contraste empírico de la capacidad de los estudiantes para detectar las 8 inconsistencias controladas inyectadas en la lámina PROJECT - 2.
            </p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 18px;">
              <!-- Sin IA -->
              <div style="background: #f8fafc; padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--color-border-light);">
                <h4 style="font-size: 13.5px; margin-bottom: 8px; color: #1e3a8a;">Grupo Sin IA (Control)</h4>
                <div style="font-size: 12.5px; margin-bottom: 4px;">Errores Detectados: <strong>${statsNoIa.avgGtDetected.toFixed(1)} / 8</strong></div>
                <div style="font-size: 12.5px; margin-bottom: 4px; color: #dc2626;">Errores Omitidos: <strong>${statsNoIa.avgGtOmitted.toFixed(1)} / 8</strong></div>
                <div class="bar-track" style="margin-top: 8px;">
                  <div class="bar-fill fill-no-ia" style="width: ${Math.max(statsNoIa.avgGtRecall, 8)}%;">
                    ${statsNoIa.avgGtRecall.toFixed(0)}% Cobertura
                  </div>
                </div>
              </div>

              <!-- Con IA -->
              <div style="background: #f0fdf4; padding: 14px; border-radius: var(--radius-md); border: 1px solid #bbf7d0;">
                <h4 style="font-size: 13.5px; margin-bottom: 8px; color: #15803d;">Grupo Con IA (Experimental)</h4>
                <div style="font-size: 12.5px; margin-bottom: 4px;">Errores Detectados: <strong>${statsWithIa.avgGtDetected.toFixed(1)} / 8</strong></div>
                <div style="font-size: 12.5px; margin-bottom: 4px; color: #dc2626;">Errores Omitidos: <strong>${statsWithIa.avgGtOmitted.toFixed(1)} / 8</strong></div>
                <div class="bar-track" style="margin-top: 8px;">
                  <div class="bar-fill fill-with-ia" style="width: ${Math.max(statsWithIa.avgGtRecall, 8)}%;">
                    ${statsWithIa.avgGtRecall.toFixed(0)}% Cobertura
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Academic Disclaimer Footer -->
        <div class="academic-notice warning">
          <div class="academic-notice-title">
            <span>⚠️</span> Advertencia de Validez Metodológica
          </div>
          <p>
            Los indicadores anteriores representan datos descriptivos de las muestras almacenadas localmente. 
            Para extraer conclusiones científicas definitivas es indispensable contar con una muestra representativa (N adecuado) 
            y aplicar pruebas de significancia estadística (e.g. t-Student o Mann-Whitney).
          </p>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }

  calculateGroupStats(groupSessions) {
    if (!groupSessions || groupSessions.length === 0) {
      return {
        count: 0,
        avgTimeSeconds: 0,
        avgFindings: 0,
        totalConfirmed: 0,
        totalFalsePositives: 0,
        totalSuggestions: 0,
        avgUsefulness: 0,
        avgNeedToVerify: 0,
        avgGtDetected: 0,
        avgGtOmitted: 0,
        avgGtRecall: 0
      };
    }

    let totalSeconds = 0;
    let totalFindings = 0;
    let totalConfirmed = 0;
    let totalFalsePositives = 0;
    let totalSuggestions = 0;
    let usefulnessSum = 0;
    let usefulnessCount = 0;
    let verifySum = 0;
    let verifyCount = 0;
    let totalGtDetected = 0;

    const groundTruthDefects = [
      { id: 'E1', sector: 'F1', recinto: 'Cocina', type: 'Dimensional', keywords: ['cocina', 'kitchen', 'f1', '10\'6', '12\'6', 'cota'] },
      { id: 'E2', sector: 'F3', recinto: 'Cocina', type: 'Dimensional', keywords: ['cocina', 'kitchen', 'f3', 'x8', 'x10', 'cota'] },
      { id: 'E3', sector: 'F1', recinto: 'Dormitorio', type: 'Dimensional', keywords: ['dormitorio', 'bedroom', 'f1', '12\'2', '14\'2', 'cota'] },
      { id: 'E4', sector: 'F3', recinto: 'Dormitorio', type: 'Dimensional', keywords: ['dormitorio', 'bedroom', 'f3', '12\'6', '10\'6', 'cota'] },
      { id: 'E5', sector: 'F2', recinto: 'Hall', type: 'Dimensional', keywords: ['hall', 'f2', '18\'4', '16\'4', 'cota'] },
      { id: 'E6', sector: 'F4', recinto: 'Hall', type: 'Dimensional', keywords: ['hall', 'f4', '8\'6', '10\'6', 'cota'] },
      { id: 'E7', sector: 'F2', recinto: 'Dining', type: 'Dimensional', keywords: ['dining', 'comedor', 'f2', '9\'4', '7\'4', 'cota'] },
      { id: 'E8', sector: 'F4', recinto: 'Master Bed Room', type: 'Dimensional', keywords: ['master', 'bed room', 'dormitorio principal', 'f4', '10\'2', '14\'2', 'cota'] }
    ];

    groupSessions.forEach(s => {
      totalSeconds += s.timestamps?.elapsedSeconds || 0;
      const findings = s.findings || [];
      totalFindings += findings.length;

      // Ground truth matching
      let sessionGtDetected = 0;
      groundTruthDefects.forEach(gt => {
        const match = findings.some(f => {
          const text = `${f.location} ${f.description} ${f.type} ${f.correction}`.toLowerCase();
          return (f.type.toLowerCase() === gt.type.toLowerCase()) || gt.keywords.some(k => text.includes(k));
        });
        if (match) sessionGtDetected++;
      });
      totalGtDetected += sessionGtDetected;

      if (s.aiAssistance?.suggestions) {
        s.aiAssistance.suggestions.forEach(item => {
          totalSuggestions++;
          if (item.validation === 'confirmed') totalConfirmed++;
          if (item.validation === 'false_positive') totalFalsePositives++;
        });
      }

      if (s.survey && s.survey.ratings) {
        if (s.survey.ratings.q1_usefulness) {
          usefulnessSum += s.survey.ratings.q1_usefulness;
          usefulnessCount++;
        }
        if (s.survey.ratings.q4_need_to_verify) {
          verifySum += s.survey.ratings.q4_need_to_verify;
          verifyCount++;
        }
      }
    });

    const count = groupSessions.length;
    const avgGtDetected = count > 0 ? (totalGtDetected / count) : 0;
    const avgGtOmitted = count > 0 ? (8 - avgGtDetected) : 0;
    const avgGtRecall = (avgGtDetected / 8) * 100;

    return {
      count,
      avgTimeSeconds: count > 0 ? Math.round(totalSeconds / count) : 0,
      avgFindings: count > 0 ? (totalFindings / count) : 0,
      totalConfirmed,
      totalFalsePositives,
      totalSuggestions,
      avgUsefulness: usefulnessCount > 0 ? (usefulnessSum / usefulnessCount) : 0,
      avgNeedToVerify: verifyCount > 0 ? (verifySum / verifyCount) : 0,
      avgGtDetected,
      avgGtOmitted,
      avgGtRecall
    };
  }

  calcBarPercent(val, max) {
    if (!max || max <= 0) return 0;
    const pct = Math.round((val / max) * 100);
    return Math.max(pct, 8); // At least 8% so the text badge is visible
  }
}

window.ComparisonManager = ComparisonManager;
