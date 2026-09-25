/**
 * PlanCheck AI - Human-in-the-Loop (HITL) Validation Module
 * Manages the critical classification of AI outputs by civil engineering students.
 */

class ValidationManager {
  constructor() {
    this.init();
  }

  init() {
    // Registered globally
  }

  classify(suggestionId, validationStatus) {
    if (!window.state || !window.state.currentSession) return;

    window.state.updateAiValidation(suggestionId, validationStatus);
  }

  saveComment(suggestionId, commentText) {
    if (!window.state || !window.state.currentSession) return;

    window.state.updateAiValidation(suggestionId, undefined, commentText);
  }

  importToFindings(suggestionId) {
    if (!window.state || !window.state.currentSession) return;

    const session = window.state.currentSession;
    const suggestion = session.aiAssistance?.suggestions?.find(s => s.id === suggestionId);
    if (!suggestion) return;

    // Check if already imported
    const alreadyExists = session.findings.some(f => f.description === suggestion.description);
    if (alreadyExists) {
      alert('Este hallazgo ya ha sido incorporado a su lista de registros.');
      return;
    }

    const newFinding = {
      location: suggestion.location,
      type: suggestion.type,
      description: `[Validado desde IA] ${suggestion.description}`,
      correction: suggestion.proposedCorrection || 'Revisión y rectificación',
      confidence: 'Alto',
      source: 'imported_from_ai'
    };

    window.state.addFinding(newFinding);
    alert(`El error detectado por la IA (${suggestionId}) ha sido importado exitosamente a sus hallazgos de sesión.`);
  }

  getValidationStats(session = null) {
    const s = session || window.state?.currentSession;
    if (!s || !s.aiAssistance || !s.aiAssistance.suggestions) {
      return {
        total: 0,
        confirmed: 0,
        falsePositive: 0,
        needsReview: 0,
        pending: 0,
        criticalAuditRate: 0
      };
    }

    const suggestions = s.aiAssistance.suggestions;
    let confirmed = 0;
    let falsePositive = 0;
    let needsReview = 0;
    let pending = 0;

    suggestions.forEach(item => {
      if (item.validation === 'confirmed') confirmed++;
      else if (item.validation === 'false_positive') falsePositive++;
      else if (item.validation === 'needs_review') needsReview++;
      else pending++;
    });

    const validatedCount = confirmed + falsePositive + needsReview;
    const criticalAuditRate = validatedCount > 0 
      ? Math.round(((falsePositive + needsReview) / validatedCount) * 100)
      : 0;

    return {
      total: suggestions.length,
      confirmed,
      falsePositive,
      needsReview,
      pending,
      criticalAuditRate
    };
  }
}

window.validationManager = new ValidationManager();
