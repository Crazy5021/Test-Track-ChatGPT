/**
 * PlanCheck AI - Application Master Controller
 * Handles view switching, session flow, modal dialogs, and orchestrates all sub-modules.
 */

class AppController {
  constructor() {
    this.currentView = 'home';
    this.viewer = null;
    this.findingsManager = null;
    this.aiAssistant = null;
    this.surveyManager = null;
    this.comparisonManager = null;

    this.selectedModality = null;

    this.init();
  }

  init() {
    // 1. Initialize Sub-Managers
    this.findingsManager = new window.FindingsManager();
    window.findingsManager = this.findingsManager;

    this.aiAssistant = new window.AIAssistant();
    window.aiAssistant = this.aiAssistant;

    this.surveyManager = new window.SurveyManager();
    window.surveyManager = this.surveyManager;

    this.comparisonManager = new window.ComparisonManager();
    window.comparisonManager = this.comparisonManager;

    // 2. Setup Navigation Links
    this.setupNavigation();

    // 3. Setup Modality Selection Cards
    this.setupModalitySelection();

    // 4. Setup Blueprint Viewer
    this.setupViewer();

    // 5. Setup Action Buttons & Modals
    this.setupActionButtons();

    // 6. Setup Settings Modal
    this.setupSettingsModal();

    // 7. Subscribe to State Changes
    this.setupStateListeners();

    // 8. Register Timers
    window.timer.registerDisplay('session-timer-display');

    // 9. Initial View
    if (window.state && window.state.currentSession && window.state.currentSession.status === 'in_progress') {
      this.restoreActiveSession(window.state.currentSession);
    } else {
      this.navigateTo('home');
    }
  }

  setupNavigation() {
    document.querySelectorAll('[data-navigate]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = btn.getAttribute('data-navigate');
        this.navigateTo(targetView);
      });
    });
  }

  navigateTo(viewName) {
    this.currentView = viewName;

    // Hide all view sections
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    // Show target section
    const targetEl = document.getElementById(`view-${viewName}`);
    if (targetEl) {
      targetEl.classList.add('active');
    }

    // Update Nav Buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
      const btnView = btn.getAttribute('data-navigate');
      if (btnView === viewName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // View specific actions
    if (viewName === 'workspace' && this.viewer) {
      setTimeout(() => {
        this.viewer.fitToScreen();
      }, 50);
    } else if (viewName === 'comparison') {
      this.comparisonManager.renderComparison();
    } else if (viewName === 'history') {
      this.renderHistoryTable();
    } else if (viewName === 'summary') {
      this.renderSummaryScreen();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setupModalitySelection() {
    const cardNoIa = document.getElementById('card-modality-no-ia');
    const cardWithIa = document.getElementById('card-modality-with-ia');
    const startBtn = document.getElementById('btn-confirm-start-evaluation');

    if (cardNoIa && cardWithIa) {
      cardNoIa.addEventListener('click', () => {
        cardNoIa.classList.add('selected');
        cardWithIa.classList.remove('selected');
        this.selectedModality = 'sin_ia';
        if (startBtn) startBtn.disabled = false;
      });

      cardWithIa.addEventListener('click', () => {
        cardWithIa.classList.add('selected');
        cardNoIa.classList.remove('selected');
        this.selectedModality = 'con_ia';
        if (startBtn) startBtn.disabled = false;
      });
    }

    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.startEvaluationSession();
      });
    }
  }

  startEvaluationSession() {
    if (!this.selectedModality) {
      alert('Por favor seleccione una de las dos modalidades para continuar.');
      return;
    }

    const nameInput = document.getElementById('participant-name');
    const codeInput = document.getElementById('participant-code');
    const semInput = document.getElementById('participant-semester');

    const participant = {
      name: nameInput?.value.trim() || 'Estudiante Anónimo',
      code: codeInput?.value.trim() || 'EST-' + Math.floor(1000 + Math.random() * 9000),
      semester: semInput?.value || 'Pregrado'
    };

    // Create session in state
    const session = window.state.startNewSession(participant, this.selectedModality);

    // Start precision timer
    window.timer.start(0);

    // Update Workspace UI for the modality
    this.configureWorkspaceForSession(session);

    // Navigate to workspace
    this.navigateTo('workspace');
  }

  configureWorkspaceForSession(session) {
    const isWithIa = session.modality === 'con_ia';

    // Update session indicators
    const badgeEl = document.getElementById('workspace-modality-badge');
    if (badgeEl) {
      badgeEl.className = `session-badge-large ${isWithIa ? 'with-ia' : 'no-ia'}`;
      badgeEl.innerHTML = isWithIa 
        ? '<span>🤖</span> Revisión Asistida por IA'
        : '<span>📐</span> Revisión Sin IA (Control)';
    }

    const participantEl = document.getElementById('workspace-participant-info');
    if (participantEl) {
      participantEl.innerHTML = `Participante: <strong>${session.participant.name}</strong> (${session.participant.code})`;
    }

    // AI Tab visibility
    const aiTabBtn = document.getElementById('tab-btn-ai');
    if (aiTabBtn) {
      if (isWithIa) {
        aiTabBtn.style.display = 'flex';
      } else {
        aiTabBtn.style.display = 'none';
        // Ensure findings tab is active
        this.switchPanelTab('findings');
      }
    }

    // Load Default Plan in Viewer
    if (this.viewer) {
      this.viewer.loadDefaultDemoBlueprint();
    }
  }

  restoreActiveSession(session) {
    this.selectedModality = session.modality;
    this.configureWorkspaceForSession(session);
    window.timer.start(session.timestamps.elapsedSeconds || 0);
    this.navigateTo('workspace');
  }

  setupViewer() {
    this.viewer = new window.BlueprintViewer('viewer-viewport', 'viewer-content-container');
    window.activeViewer = this.viewer;

    // Zoom Buttons
    document.getElementById('tool-zoom-in')?.addEventListener('click', () => this.viewer.zoomIn());
    document.getElementById('tool-zoom-out')?.addEventListener('click', () => this.viewer.zoomOut());
    document.getElementById('tool-fit-screen')?.addEventListener('click', () => this.viewer.fitToScreen());
    document.getElementById('tool-reset-view')?.addEventListener('click', () => this.viewer.resetView());
    document.getElementById('tool-pin-mode')?.addEventListener('click', () => this.viewer.togglePinMode());

    // File Upload Handlers
    const fileInput = document.getElementById('blueprint-file-input');
    const uploadBtn = document.getElementById('btn-upload-plan-file');
    const closeDropzoneBtn = document.getElementById('btn-close-dropzone');
    const dropzone = document.getElementById('blueprint-dropzone');

    uploadBtn?.addEventListener('click', () => {
      dropzone?.classList.add('visible');
    });

    closeDropzoneBtn?.addEventListener('click', () => {
      dropzone?.classList.remove('visible');
    });

    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.viewer.loadCustomFile(file);
        dropzone?.classList.remove('visible');
      }
    });

    // Reset to demo plan button
    document.getElementById('btn-reset-demo-plan')?.addEventListener('click', () => {
      this.viewer.loadDefaultDemoBlueprint();
    });

    // Panel Tabs (Findings vs AI Assistant)
    document.querySelectorAll('.panel-tab-btn').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        const tabId = tabBtn.getAttribute('data-tab');
        this.switchPanelTab(tabId);
      });
    });
  }

  switchPanelTab(tabId) {
    document.querySelectorAll('.panel-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel-tab-view').forEach(v => v.classList.remove('active'));

    const activeBtn = document.querySelector(`.panel-tab-btn[data-tab="${tabId}"]`);
    const activeView = document.getElementById(`tab-view-${tabId}`);

    if (activeBtn) activeBtn.classList.add('active');
    if (activeView) activeView.classList.add('active');
  }

  setupActionButtons() {
    // Finish Review Button
    const finishBtn = document.getElementById('btn-finish-review');
    finishBtn?.addEventListener('click', () => {
      this.openFinishModal();
    });

    document.getElementById('btn-cancel-finish')?.addEventListener('click', () => {
      this.closeModal('modal-confirm-finish');
    });

    document.getElementById('btn-confirm-finish')?.addEventListener('click', () => {
      this.closeModal('modal-confirm-finish');
      this.finalizeSession();
    });

    // Export Buttons
    document.getElementById('btn-export-csv')?.addEventListener('click', () => {
      window.dataExporter.exportAllSessionsCSV();
    });

    document.getElementById('btn-export-json')?.addEventListener('click', () => {
      window.dataExporter.exportAllSessionsJSON();
    });

    document.getElementById('btn-export-current-csv')?.addEventListener('click', () => {
      window.dataExporter.exportCurrentSessionCSV();
    });

    // Load Demo Data Button
    document.getElementById('btn-load-demo-data')?.addEventListener('click', () => {
      if (confirm('¿Desea cargar un conjunto de 6 sesiones de prueba claramente rotuladas como [DEMO] para evaluar las gráficas y la exportación?')) {
        window.state.loadDemoDataset();
        this.renderHistoryTable();
        alert('Se han cargado 6 sesiones demostrativas (3 Sin IA y 3 Con IA). Ya puede explorar la pestaña Comparación y exportar datos.');
      }
    });

    // Clear Data Button
    document.getElementById('btn-clear-all-data')?.addEventListener('click', () => {
      if (confirm('¿Está seguro de que desea eliminar todas las sesiones y datos locales guardados? Esta acción es irreversible.')) {
        window.state.clearAllData();
        this.renderHistoryTable();
        alert('Datos eliminados.');
        this.navigateTo('home');
      }
    });
  }

  openFinishModal() {
    const session = window.state.currentSession;
    if (!session) return;

    const findingsCount = session.findings.length;
    const isWithIa = session.modality === 'con_ia';

    let pendingValidation = 0;
    if (isWithIa && session.aiAssistance?.suggestions) {
      pendingValidation = session.aiAssistance.suggestions.filter(s => !s.validation).length;
    }

    const modalBody = document.getElementById('finish-modal-message');
    if (modalBody) {
      modalBody.innerHTML = `
        <p>Está a punto de concluir la revisión del plano técnico.</p>
        <ul style="margin: 12px 0 12px 20px; font-size: 13.5px; color: var(--color-text-muted);">
          <li>Hallazgos registrados: <strong>${findingsCount}</strong></li>
          <li>Tiempo acumulado: <strong>${window.timer.formatDurationVerbose(window.timer.getElapsedSeconds())}</strong></li>
          ${isWithIa ? `<li>Sugerencias de IA sin clasificar: <strong>${pendingValidation}</strong></li>` : ''}
        </ul>
        <p style="font-size: 13px; color: var(--color-text-muted);">
          Al confirmar, el temporizador se detendrá y pasará a responder una breve encuesta académica de percepción.
        </p>
      `;
    }

    this.openModal('modal-confirm-finish');
  }

  finalizeSession() {
    // 1. Stop timer
    const finalSeconds = window.timer.stop();

    // 2. Mark session completed
    window.state.finishCurrentSession();

    // 3. Reset survey form
    if (this.surveyManager) {
      this.surveyManager.resetForm();
    }

    // 4. Navigate to Survey
    this.navigateTo('survey');
  }

  renderSummaryScreen() {
    const session = window.state.currentSession;
    if (!session) return;

    const elapsed = session.timestamps.elapsedSeconds || 0;
    const findings = session.findings || [];
    const isWithIa = session.modality === 'con_ia';

    document.getElementById('summary-time-display').textContent = window.timer.formatTime(elapsed);
    document.getElementById('summary-findings-count').textContent = findings.length;

    const valStats = window.validationManager.getValidationStats(session);

    document.getElementById('summary-confirmed-count').textContent = isWithIa ? valStats.confirmed : 'N/A';
    document.getElementById('summary-false-positive-count').textContent = isWithIa ? valStats.falsePositive : 'N/A';
    document.getElementById('summary-review-count').textContent = isWithIa ? valStats.needsReview : 'N/A';
    document.getElementById('summary-critical-rate').textContent = isWithIa ? `${valStats.criticalAuditRate}%` : 'N/A';

    // Summary participant details
    document.getElementById('summary-participant-info').innerHTML = `
      Participante: <strong>${session.participant.name}</strong> (${session.participant.code}) &bull; 
      Modalidad: <strong>${isWithIa ? 'Revisión asistida por IA' : 'Revisión sin IA'}</strong> &bull; 
      Fecha: <strong>${new Date(session.timestamps.startedAt).toLocaleDateString()}</strong>
    `;

    // Ground Truth Inconsistencies Evaluation (8 Errores Controlados Oficiales de PROJECT - 2)
    const groundTruthDefects = [
      { id: 'E1', sector: 'F1', recinto: 'Cocina', type: 'Dimensional', title: 'F1 - Cocina: cota 10\'6"X10" (original 12\'6"X10")', keywords: ['cocina', 'kitchen', 'f1', '10\'6', '12\'6', 'cota'] },
      { id: 'E2', sector: 'F3', recinto: 'Cocina', type: 'Dimensional', title: 'F3 - Cocina: cota 12\'6"X8" (original 12\'6"X10")', keywords: ['cocina', 'kitchen', 'f3', 'x8', 'x10', 'cota'] },
      { id: 'E3', sector: 'F1', recinto: 'Dormitorio', type: 'Dimensional', title: 'F1 - Dormitorio: cota 10\'6"X12\'2" (original 10\'6"X14\'2")', keywords: ['dormitorio', 'bedroom', 'f1', '12\'2', '14\'2', 'cota'] },
      { id: 'E4', sector: 'F3', recinto: 'Dormitorio', type: 'Dimensional', title: 'F3 - Dormitorio: cota 12\'6"X14\'2" (original 10\'6"X14\'2")', keywords: ['dormitorio', 'bedroom', 'f3', '12\'6', '10\'6', 'cota'] },
      { id: 'E5', sector: 'F2', recinto: 'Hall', type: 'Dimensional', title: 'F2 - Hall: cota 10\'6"X18\'4" (original 10\'6"X16\'4")', keywords: ['hall', 'f2', '18\'4', '16\'4', 'cota'] },
      { id: 'E6', sector: 'F4', recinto: 'Hall', type: 'Dimensional', title: 'F4 - Hall: cota 8\'6"X16\'4" (original 10\'6"X16\'4")', keywords: ['hall', 'f4', '8\'6', '10\'6', 'cota'] },
      { id: 'E7', sector: 'F2', recinto: 'Dining', type: 'Dimensional', title: 'F2 - Dining (Comedor): cota 7\'6"X9\'4" (original 7\'6"X7\'4")', keywords: ['dining', 'comedor', 'f2', '9\'4', '7\'4', 'cota'] },
      { id: 'E8', sector: 'F4', recinto: 'Master Bed Room', type: 'Dimensional', title: 'F4 - Master Bed Room: cota 12\'6"X10\'2" (original 12\'6"X14\'2")', keywords: ['master', 'bed room', 'dormitorio principal', 'f4', '10\'2', '14\'2', 'cota'] }
    ];

    let detectedGtCount = 0;
    const gtAnalysis = groundTruthDefects.map(gt => {
      const match = findings.some(f => {
        const text = `${f.location} ${f.description} ${f.type} ${f.correction}`.toLowerCase();
        return (f.type.toLowerCase() === gt.type.toLowerCase()) || gt.keywords.some(k => text.includes(k));
      });
      if (match) detectedGtCount++;
      return { ...gt, detected: match };
    });

    const omittedCount = groundTruthDefects.length - detectedGtCount;
    const recallRate = Math.round((detectedGtCount / groundTruthDefects.length) * 100);

    const gtDetectedEl = document.getElementById('summary-gt-detected');
    const gtOmittedEl = document.getElementById('summary-gt-omitted');
    const gtRecallEl = document.getElementById('summary-gt-recall');
    const gtBreakdownEl = document.getElementById('summary-gt-breakdown-container');

    if (gtDetectedEl) gtDetectedEl.textContent = `${detectedGtCount} / ${groundTruthDefects.length}`;
    if (gtOmittedEl) gtOmittedEl.textContent = `${omittedCount} / ${groundTruthDefects.length}`;
    if (gtRecallEl) gtRecallEl.textContent = `${recallRate}%`;

    if (gtBreakdownEl) {
      gtBreakdownEl.innerHTML = gtAnalysis.map(item => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; margin-bottom: 8px; background: #f8fafc; border-radius: 6px; border: 1px solid var(--color-border-light); font-size: 13px;">
          <div>
            <span style="font-family: var(--font-mono); font-weight: 700; background: #0f172a; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-right: 6px;">${item.id}</span>
            <strong>[${item.type}]:</strong> ${item.title}
          </div>
          <div>
            ${item.detected 
              ? '<span class="session-status-badge active-ia" style="font-weight: 700;">✔️ Detectado</span>' 
              : '<span class="session-status-badge" style="background: #fef2f2; color: #dc2626; border-color: #fecaca; font-weight: 700;">❌ Omitido</span>'}
          </div>
        </div>
      `).join('');
    }
  }

  renderHistoryTable() {
    const tableBody = document.getElementById('history-table-body');
    if (!tableBody || !window.state) return;

    const sessions = window.state.allSessions || [];

    if (sessions.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--color-text-light); padding: 24px;">
            No hay sesiones históricas guardadas aún.
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    sessions.forEach(s => {
      const isWithIa = s.modality === 'con_ia';
      const duration = window.timer.formatTime(s.timestamps?.elapsedSeconds || 0);
      const findingsCount = s.findings?.length || 0;
      const dateStr = s.timestamps?.startedAt ? new Date(s.timestamps.startedAt).toLocaleString() : '-';

      html += `
        <tr>
          <td><strong style="font-family: var(--font-mono);">${s.id}</strong></td>
          <td>${s.participant?.name || 'Anónimo'} <br><small style="color: var(--color-text-light);">${s.participant?.code || ''}</small></td>
          <td>
            <span class="session-status-badge ${isWithIa ? 'active-ia' : 'active-no-ia'}">
              ${isWithIa ? 'Con IA' : 'Sin IA'}
            </span>
          </td>
          <td>${dateStr}</td>
          <td style="font-family: var(--font-mono); font-weight: 600;">${duration}</td>
          <td><strong>${findingsCount}</strong> hallazgos</td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="window.app.viewSessionDetails('${s.id}')">Ver Detalle</button>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
  }

  viewSessionDetails(sessionId) {
    const session = window.state.allSessions.find(s => s.id === sessionId);
    if (!session) return;

    window.state.currentSession = session;
    this.renderSummaryScreen();
    this.navigateTo('summary');
  }

  setupSettingsModal() {
    const modalBtn = document.getElementById('btn-open-settings');
    const closeBtn = document.getElementById('btn-close-settings');
    const saveBtn = document.getElementById('btn-save-settings');

    modalBtn?.addEventListener('click', () => {
      const settings = window.state.settings;
      const apiKeyInput = document.getElementById('settings-gemini-key');
      const demoCheckbox = document.getElementById('settings-use-demo');

      if (apiKeyInput) apiKeyInput.value = settings.geminiApiKey || '';
      if (demoCheckbox) demoCheckbox.checked = settings.useDemoMode;

      this.openModal('modal-settings');
    });

    closeBtn?.addEventListener('click', () => {
      this.closeModal('modal-settings');
    });

    saveBtn?.addEventListener('click', () => {
      const apiKeyInput = document.getElementById('settings-gemini-key');
      const demoCheckbox = document.getElementById('settings-use-demo');

      window.state.updateSettings({
        geminiApiKey: apiKeyInput?.value.trim() || '',
        useDemoMode: demoCheckbox ? demoCheckbox.checked : true
      });

      alert('Configuración guardada correctamente.');
      this.closeModal('modal-settings');
    });
  }

  setupStateListeners() {
    window.state.subscribe((event, data) => {
      const sessionBadge = document.getElementById('header-session-status');
      if (sessionBadge) {
        if (window.state.currentSession && window.state.currentSession.status === 'in_progress') {
          const isWithIa = window.state.currentSession.modality === 'con_ia';
          sessionBadge.style.display = 'inline-flex';
          sessionBadge.className = `session-status-badge ${isWithIa ? 'active-ia' : 'active-no-ia'}`;
          sessionBadge.innerHTML = `<span class="status-dot"></span> Sesión en curso: ${isWithIa ? 'Con IA' : 'Sin IA'}`;
        } else {
          sessionBadge.style.display = 'none';
        }
      }
    });
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('open');
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('open');
    }
  }
}

// Instantiate on window load
document.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
});
