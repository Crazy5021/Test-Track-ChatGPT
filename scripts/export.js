/**
 * PlanCheck AI - Data Export Module
 * Generates and downloads experimental research data in CSV and JSON formats.
 */

class DataExporter {
  constructor() {
    this.init();
  }

  init() {
    // Methods available globally
  }

  exportAllSessionsCSV() {
    const sessions = window.state ? window.state.allSessions : [];
    if (!sessions || sessions.length === 0) {
      alert('No existen sesiones registradas para exportar.');
      return;
    }

    const headers = [
      'ID_Sesion',
      'Participante_Nombre',
      'Participante_Codigo',
      'Participante_Semestre',
      'Modalidad',
      'Fecha_Inicio',
      'Fecha_Fin',
      'Tiempo_Total_Segundos',
      'Tiempo_Total_Formato',
      'Total_Hallazgos',
      'Hallazgos_Dimensionales',
      'Hallazgos_Geometricos',
      'Hallazgos_Anotacion',
      'Hallazgos_Inconsistencia',
      'Hallazgos_Otro',
      'Errores_Patron_Detectados',
      'Errores_Patron_Omitidos',
      'Tasa_Recall_Porcentaje',
      'Errores_Confirmados_IA',
      'Falsos_Positivos_IA',
      'Requiere_Revision_IA',
      'Encuesta_P1_Utilidad',
      'Encuesta_P2_Confiabilidad',
      'Encuesta_P3_Facilitacion',
      'Encuesta_P4_Necesidad_Verificar',
      'Encuesta_P5_Uso_Futuro',
      'Encuesta_Comentarios'
    ];

    const rows = sessions.map(s => {
      const p = s.participant || {};
      const t = s.timestamps || {};
      const findings = s.findings || [];
      const suggestions = s.aiAssistance?.suggestions || [];
      const survey = s.survey?.ratings || {};

      let dimensional = 0;
      let geometric = 0;
      let annotation = 0;
      let inconsistency = 0;
      let other = 0;

      findings.forEach(f => {
        if (f.type === 'Dimensional') dimensional++;
        else if (f.type === 'Geométrico') geometric++;
        else if (f.type === 'Anotación') annotation++;
        else if (f.type === 'Inconsistencia') inconsistency++;
        else other++;
      });

      // Ground truth calculations (8 Errores Controlados de PROJECT - 2)
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

      let gtDetected = 0;
      groundTruthDefects.forEach(gt => {
        const match = findings.some(f => {
          const text = `${f.location} ${f.description} ${f.type} ${f.correction}`.toLowerCase();
          return (f.type.toLowerCase() === gt.type.toLowerCase()) || gt.keywords.some(k => text.includes(k));
        });
        if (match) gtDetected++;
      });
      const gtOmitted = groundTruthDefects.length - gtDetected;
      const gtRecall = Math.round((gtDetected / groundTruthDefects.length) * 100);

      let confirmed = 0;
      let falsePositives = 0;
      let needsReview = 0;

      suggestions.forEach(item => {
        if (item.validation === 'confirmed') confirmed++;
        else if (item.validation === 'false_positive') falsePositives++;
        else if (item.validation === 'needs_review') needsReview++;
      });

      const elapsed = t.elapsedSeconds || 0;
      const formattedTime = window.timer ? window.timer.formatTime(elapsed) : `${elapsed}s`;

      return [
        this.cleanCsvField(s.id),
        this.cleanCsvField(p.name),
        this.cleanCsvField(p.code),
        this.cleanCsvField(p.semester),
        this.cleanCsvField(s.modality),
        this.cleanCsvField(t.startedAt),
        this.cleanCsvField(t.finishedAt),
        elapsed,
        this.cleanCsvField(formattedTime),
        findings.length,
        dimensional,
        geometric,
        annotation,
        inconsistency,
        other,
        gtDetected,
        gtOmitted,
        gtRecall,
        confirmed,
        falsePositives,
        needsReview,
        survey.q1_usefulness || '',
        survey.q2_reliability || '',
        survey.q3_facilitation || '',
        survey.q4_need_to_verify || '',
        survey.q5_future_use || '',
        this.cleanCsvField(s.survey?.comments || '')
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    this.downloadFile(csvContent, `PlanCheckAI_Datos_${this.getTimestampStr()}.csv`, 'text/csv;charset=utf-8;');
  }

  /**
   * Returns CSV string for given sessions array (no download triggered).
   * Used by test runners and programmatic callers.
   */
  generateCSV(sessions) {
    if (!sessions || sessions.length === 0) return '';
    const headers = [
      'ID_Sesion', 'Participante_Nombre', 'Participante_Codigo', 'Modalidad',
      'Tiempo_Total_Segundos', 'Total_Hallazgos',
      'Errores_Patron_Detectados', 'Errores_Patron_Omitidos', 'Tasa_Recall_Porcentaje',
      'Errores_Confirmados_IA', 'Falsos_Positivos_IA'
    ];
    const rows = sessions.map(s => {
      const p = s.participant || {};
      const t = s.timestamps || {};
      const findings = s.findings || [];
      const gt = s.groundTruthEvaluation || { detectedCount: 0, omittedCount: 0, recallRate: 0 };
      const suggestions = s.aiAssistance?.suggestions || [];
      let confirmed = 0, fp = 0;
      suggestions.forEach(item => {
        if (item.validation === 'confirmed') confirmed++;
        if (item.validation === 'false_positive') fp++;
      });
      return [
        this.cleanCsvField(s.id),
        this.cleanCsvField(p.name),
        this.cleanCsvField(p.code),
        this.cleanCsvField(s.modality),
        t.elapsedSeconds || 0,
        findings.length,
        gt.detectedCount || 0,
        gt.omittedCount !== undefined ? gt.omittedCount : 8,
        gt.recallRate || 0,
        confirmed,
        fp
      ].join(';');
    });
    return [headers.join(';'), ...rows].join('\r\n');
  }

  exportAllSessionsJSON() {
    const sessions = window.state ? window.state.allSessions : [];
    if (!sessions || sessions.length === 0) {
      alert('No existen sesiones registradas para exportar.');
      return;
    }

    const jsonContent = JSON.stringify({
      study: 'PlanCheck AI - Investigación Experimental',
      exportedAt: new Date().toISOString(),
      totalSessions: sessions.length,
      sessions: sessions
    }, null, 2);

    this.downloadFile(jsonContent, `PlanCheckAI_Dataset_${this.getTimestampStr()}.json`, 'application/json;charset=utf-8;');
  }

  exportCurrentSessionCSV() {
    const session = window.state ? window.state.currentSession : null;
    if (!session) {
      alert('No hay una sesión activa para exportar.');
      return;
    }

    const headers = [
      'ID_Hallazgo',
      'Ubicacion',
      'Tipo_Error',
      'Descripcion',
      'Correccion_Propuesta',
      'Nivel_Confianza',
      'Origen',
      'Fecha_Creacion'
    ];

    const rows = (session.findings || []).map(f => [
      this.cleanCsvField(f.id),
      this.cleanCsvField(f.location),
      this.cleanCsvField(f.type),
      this.cleanCsvField(f.description),
      this.cleanCsvField(f.correction),
      this.cleanCsvField(f.confidence),
      this.cleanCsvField(f.source),
      this.cleanCsvField(f.createdAt)
    ].join(';'));

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    this.downloadFile(csvContent, `PlanCheckAI_Hallazgos_${session.id}.csv`, 'text/csv;charset=utf-8;');
  }

  cleanCsvField(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""').replace(/\r?\n/g, ' ');
    return `"${str}"`;
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  getTimestampStr() {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
  }
}

window.dataExporter = new DataExporter();
