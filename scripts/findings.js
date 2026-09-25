/**
 * PlanCheck AI - Findings Management Module
 * Handles recording, editing, deleting, and rendering student findings.
 */

class FindingsManager {
  constructor() {
    this.form = document.getElementById('new-finding-form');
    this.listContainer = document.getElementById('findings-list-container');
    this.countBadges = document.querySelectorAll('.findings-count-badge');
    this.editingFindingId = null;

    this.initEvents();
  }

  initEvents() {
    if (this.form) {
      this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    // Subscribe to state changes
    if (window.state) {
      window.state.subscribe((event) => {
        if (
          event === 'FINDING_ADDED' ||
          event === 'FINDING_UPDATED' ||
          event === 'FINDING_DELETED' ||
          event === 'SESSION_STARTED' ||
          event === 'SESSION_RESET'
        ) {
          this.renderFindingsList();
          if (window.activeViewer) {
            window.activeViewer.refreshPins();
          }
        }
      });
    }
  }

  handleFormSubmit(e) {
    e.preventDefault();
    if (!window.state || !window.state.currentSession) {
      alert('Debe iniciar una sesión experimental antes de agregar hallazgos.');
      return;
    }

    const locInput = document.getElementById('finding-location');
    const typeInput = document.getElementById('finding-type');
    const descInput = document.getElementById('finding-desc');
    const corrInput = document.getElementById('finding-correction');
    const confInput = document.getElementById('finding-confidence');

    if (!descInput.value.trim()) {
      alert('Por favor ingrese la descripción del posible error.');
      descInput.focus();
      return;
    }

    let pinCoords = null;
    if (locInput.dataset.pinX && locInput.dataset.pinY) {
      pinCoords = {
        x: parseFloat(locInput.dataset.pinX),
        y: parseFloat(locInput.dataset.pinY)
      };
    }

    const findingData = {
      location: locInput.value.trim() || 'No especificada',
      type: typeInput.value,
      description: descInput.value.trim(),
      correction: corrInput.value.trim() || 'No especificada',
      confidence: confInput.value,
      pinCoords: pinCoords
    };

    if (this.editingFindingId) {
      window.state.updateFinding(this.editingFindingId, findingData);
      this.editingFindingId = null;
      document.getElementById('btn-submit-finding').textContent = 'Agregar hallazgo';
      document.getElementById('btn-cancel-edit-finding').style.display = 'none';
    } else {
      window.state.addFinding(findingData);
    }

    this.resetForm();
  }

  resetForm() {
    if (this.form) {
      this.form.reset();
      const locInput = document.getElementById('finding-location');
      if (locInput) {
        delete locInput.dataset.pinX;
        delete locInput.dataset.pinY;
      }
    }
  }

  startEdit(findingId) {
    const session = window.state.currentSession;
    if (!session) return;
    const finding = session.findings.find(f => f.id === findingId);
    if (!finding) return;

    this.editingFindingId = findingId;

    const locInput = document.getElementById('finding-location');
    const typeInput = document.getElementById('finding-type');
    const descInput = document.getElementById('finding-desc');
    const corrInput = document.getElementById('finding-correction');
    const confInput = document.getElementById('finding-confidence');

    locInput.value = finding.location;
    typeInput.value = finding.type;
    descInput.value = finding.description;
    corrInput.value = finding.correction;
    confInput.value = finding.confidence;

    if (finding.pinCoords) {
      locInput.dataset.pinX = finding.pinCoords.x;
      locInput.dataset.pinY = finding.pinCoords.y;
    }

    document.getElementById('btn-submit-finding').textContent = 'Guardar cambios';
    const cancelBtn = document.getElementById('btn-cancel-edit-finding');
    if (cancelBtn) {
      cancelBtn.style.display = 'inline-flex';
      cancelBtn.onclick = () => {
        this.editingFindingId = null;
        this.resetForm();
        document.getElementById('btn-submit-finding').textContent = 'Agregar hallazgo';
        cancelBtn.style.display = 'none';
      };
    }

    this.form.scrollIntoView({ behavior: 'smooth' });
  }

  deleteFinding(findingId) {
    if (confirm(`¿Desea eliminar el hallazgo ${findingId}?`)) {
      window.state.deleteFinding(findingId);
    }
  }

  renderFindingsList() {
    if (!this.listContainer) return;

    const session = window.state ? window.state.currentSession : null;
    const findings = session ? session.findings : [];

    // Update count badges
    this.countBadges.forEach(b => b.textContent = findings.length);

    if (findings.length === 0) {
      this.listContainer.innerHTML = `
        <div class="findings-empty-state">
          <p>No se han registrado hallazgos aún en esta sesión.</p>
          <small style="color: var(--color-text-light); margin-top: 4px; display: block;">
            Utilice el formulario superior para documentar cualquier error o inconsistencia observada.
          </small>
        </div>
      `;
      return;
    }

    let html = '';
    findings.forEach(f => {
      const typeClass = 'type-' + f.type.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const confClass = 'conf-' + f.confidence.toLowerCase();

      html += `
        <div class="finding-item-card" data-id="${f.id}">
          <div class="finding-item-top">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="finding-id-tag">${f.id}</span>
              <span class="finding-type-badge ${typeClass}">${f.type}</span>
            </div>
            <span class="confidence-badge ${confClass}">Confianza: ${f.confidence}</span>
          </div>

          <div class="finding-desc">${this.escapeHtml(f.description)}</div>

          ${f.correction ? `
            <div class="finding-correction">
              <strong>Corrección propuesta:</strong> ${this.escapeHtml(f.correction)}
            </div>
          ` : ''}

          <div class="finding-item-footer">
            <span>📍 ${this.escapeHtml(f.location)}</span>
            <div class="finding-actions">
              <button class="btn btn-secondary btn-sm" onclick="window.findingsManager.startEdit('${f.id}')" title="Editar">✏️</button>
              <button class="btn btn-secondary btn-sm" onclick="window.findingsManager.deleteFinding('${f.id}')" title="Eliminar">🗑️</button>
            </div>
          </div>
        </div>
      `;
    });

    this.listContainer.innerHTML = html;
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

// Global initialization
window.FindingsManager = FindingsManager;
