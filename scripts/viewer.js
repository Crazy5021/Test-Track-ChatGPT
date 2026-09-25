/**
 * PlanCheck AI - Interactive Blueprint Viewer Module
 * Handles zoom, pan, dragging, coordinate mapping, file uploading, and finding pins.
 */

class BlueprintViewer {
  constructor(viewportId, contentContainerId) {
    this.viewport = document.getElementById(viewportId);
    this.container = document.getElementById(contentContainerId);
    
    this.scale = 1.0;
    this.minScale = 0.4;
    this.maxScale = 5.0;
    
    this.panX = 0;
    this.panY = 0;
    
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;

    this.isPinMode = false;
    this.pins = []; // Array of { id, xPercent, yPercent, label }

    this.currentPlanType = 'demo_svg'; // 'demo_svg' | 'custom_image'
    this.customImageSrc = null;

    this.initEvents();
  }

  initEvents() {
    if (!this.viewport || !this.container) return;

    // Mouse Dragging (Pan)
    this.viewport.addEventListener('mousedown', (e) => this.onMouseDown(e));
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('mouseup', () => this.onMouseUp());

    // Wheel Zoom
    this.viewport.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

    // Touch Support
    this.initTouchEvents();

    // Click to drop pin / register coordinate
    this.viewport.addEventListener('click', (e) => this.onViewportClick(e));
  }

  initTouchEvents() {
    let initialDistance = 0;
    let initialScale = 1;

    this.viewport.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.startX = e.touches[0].clientX - this.panX;
        this.startY = e.touches[0].clientY - this.panY;
      } else if (e.touches.length === 2) {
        this.isDragging = false;
        initialDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialScale = this.scale;
      }
    }, { passive: true });

    this.viewport.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && this.isDragging) {
        this.panX = e.touches[0].clientX - this.startX;
        this.panY = e.touches[0].clientY - this.startY;
        this.applyTransform();
      } else if (e.touches.length === 2 && initialDistance > 0) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = dist / initialDistance;
        this.scale = Math.min(Math.max(initialScale * factor, this.minScale), this.maxScale);
        this.applyTransform();
        this.updateZoomDisplay();
      }
    }, { passive: true });

    this.viewport.addEventListener('touchend', () => {
      this.isDragging = false;
    });
  }

  onMouseDown(e) {
    // If clicking on pin or toolbar, ignore pan
    if (e.target.closest('.finding-pin') || e.target.closest('.viewer-toolbar')) {
      return;
    }

    if (this.isPinMode) {
      return; // Handled in click
    }

    this.isDragging = true;
    this.startX = e.clientX - this.panX;
    this.startY = e.clientY - this.panY;
    this.viewport.classList.add('is-dragging');
  }

  onMouseMove(e) {
    if (!this.isDragging) return;
    this.panX = e.clientX - this.startX;
    this.panY = e.clientY - this.startY;
    this.applyTransform();
  }

  onMouseUp() {
    this.isDragging = false;
    if (this.viewport) {
      this.viewport.classList.remove('is-dragging');
    }
  }

  onWheel(e) {
    e.preventDefault();
    const zoomFactor = 1.15;
    const rect = this.viewport.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const oldScale = this.scale;
    let newScale = e.deltaY < 0 ? oldScale * zoomFactor : oldScale / zoomFactor;
    newScale = Math.min(Math.max(newScale, this.minScale), this.maxScale);

    if (newScale === oldScale) return;

    // Zoom centered on cursor
    this.panX = mouseX - (mouseX - this.panX) * (newScale / oldScale);
    this.panY = mouseY - (mouseY - this.panY) * (newScale / oldScale);
    this.scale = newScale;

    this.applyTransform();
    this.updateZoomDisplay();
  }

  onViewportClick(e) {
    if (e.target.closest('.finding-pin') || e.target.closest('.viewer-toolbar')) return;

    const planElement = this.container.firstElementChild;
    if (!planElement) return;

    const rect = planElement.getBoundingClientRect();
    if (
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    ) {
      const relX = ((e.clientX - rect.left) / rect.width) * 100;
      const relY = ((e.clientY - rect.top) / rect.height) * 100;

      // Populate findings form location field if open
      const locInput = document.getElementById('finding-location');
      if (locInput) {
        locInput.value = `Sector Coord: (${relX.toFixed(1)}%, ${relY.toFixed(1)}%)`;
        locInput.dataset.pinX = relX.toFixed(1);
        locInput.dataset.pinY = relY.toFixed(1);
      }

      if (this.isPinMode) {
        this.togglePinMode(false);
      }
    }
  }

  zoomIn() {
    this.scale = Math.min(this.scale * 1.25, this.maxScale);
    this.applyTransform();
    this.updateZoomDisplay();
  }

  zoomOut() {
    this.scale = Math.max(this.scale / 1.25, this.minScale);
    this.applyTransform();
    this.updateZoomDisplay();
  }

  resetView() {
    this.scale = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.fitToScreen();
    this.updateZoomDisplay();
  }

  fitToScreen() {
    if (!this.viewport || !this.container) return;
    const plan = this.container.firstElementChild;
    if (!plan) return;

    const vpWidth = this.viewport.clientWidth;
    const vpHeight = this.viewport.clientHeight;

    const planWidth = plan.naturalWidth || 1200;
    const planHeight = plan.naturalHeight || 850;

    const scaleX = (vpWidth - 40) / planWidth;
    const scaleY = (vpHeight - 40) / planHeight;
    this.scale = Math.min(Math.max(Math.min(scaleX, scaleY), this.minScale), 1.5);

    // Center plan
    this.panX = (vpWidth - planWidth * this.scale) / 2;
    this.panY = (vpHeight - planHeight * this.scale) / 2;

    this.applyTransform();
    this.updateZoomDisplay();
  }

  applyTransform() {
    if (this.container) {
      this.container.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`;
    }
  }

  updateZoomDisplay() {
    const zoomText = document.getElementById('zoom-percentage');
    if (zoomText) {
      zoomText.textContent = `${Math.round(this.scale * 100)}%`;
    }
  }

  togglePinMode(forceState = null) {
    this.isPinMode = forceState !== null ? forceState : !this.isPinMode;
    const pinBtn = document.getElementById('tool-pin-mode');
    if (this.isPinMode) {
      this.viewport.classList.add('pin-mode');
      if (pinBtn) pinBtn.classList.add('active');
    } else {
      this.viewport.classList.remove('pin-mode');
      if (pinBtn) pinBtn.classList.remove('active');
    }
  }

  // Load custom blueprint image (PNG, JPG, SVG)
  loadCustomFile(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.customImageSrc = e.target.result;
      this.renderImage(this.customImageSrc, file.name);
    };

    if (file.type.includes('image') || file.type.includes('svg')) {
      reader.readAsDataURL(file);
    } else if (file.type.includes('pdf')) {
      // Academic notice for PDF: suggest image conversion or preview
      alert('Para un rendimiento óptimo de análisis interactivo en el navegador, se recomienda cargar el plano en formato imagen (PNG, JPG) o SVG vectorial. Si cuenta con PDF, expórtelo a imagen.');
    }
  }

  renderImage(src, filename = 'Plano cargado') {
    this.currentPlanType = 'custom_image';
    this.container.innerHTML = `
      <img id="active-blueprint-media" src="${src}" alt="${filename}" style="max-width: none;" />
      <div id="pins-overlay"></div>
    `;

    const img = this.container.querySelector('img');
    img.onload = () => {
      this.fitToScreen();
      this.refreshPins();
    };

    const sourceBadge = document.getElementById('plan-source-title');
    if (sourceBadge) {
      sourceBadge.textContent = filename.length > 25 ? filename.substring(0, 22) + '...' : filename;
    }
  }

  loadDefaultDemoBlueprint() {
    this.currentPlanType = 'experimental_plan';
    // Carga la lámina técnica original de la investigación: PROJECT - 2 (8 errores controlados)
    this.renderImage('assets/plano_experimental_8_errores.png', 'Plano Experimental: PROJECT - 2 (8 Errores Controlados)');
  }

  // Pin Management
  refreshPins() {
    const overlay = document.getElementById('pins-overlay');
    if (!overlay) return;

    overlay.innerHTML = '';
    if (!window.state || !window.state.currentSession) return;

    const findings = window.state.currentSession.findings || [];
    findings.forEach(finding => {
      if (finding.pinCoords && finding.pinCoords.x && finding.pinCoords.y) {
        this.renderPin(finding, overlay);
      }
    });
  }

  renderPin(finding, overlay) {
    const pinEl = document.createElement('div');
    pinEl.className = 'finding-pin';
    pinEl.style.left = `${finding.pinCoords.x}%`;
    pinEl.style.top = `${finding.pinCoords.y}%`;
    pinEl.title = `${finding.id}: ${finding.description}`;

    pinEl.innerHTML = `
      <svg viewBox="0 0 24 24" fill="#dc2626">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
      <span class="finding-pin-badge">${finding.id}</span>
    `;

    pinEl.addEventListener('click', (e) => {
      e.stopPropagation();
      alert(`Hallazgo ${finding.id}\nUbicación: ${finding.location}\nTipo: ${finding.type}\nDescripción: ${finding.description}\nCorrección: ${finding.correction}`);
    });

    overlay.appendChild(pinEl);
  }
}

// Initialized in app.js
window.BlueprintViewer = BlueprintViewer;
