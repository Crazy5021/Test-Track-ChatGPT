/**
 * PlanCheck AI - Survey Module
 * Handles the post-experience Likert questionnaire and qualitative reflections.
 */

class SurveyManager {
  constructor() {
    this.form = document.getElementById('post-session-survey-form');
    this.init();
  }

  init() {
    if (this.form) {
      this.form.addEventListener('submit', (e) => this.handleSurveySubmit(e));
    }
  }

  handleSurveySubmit(e) {
    e.preventDefault();
    if (!window.state || !window.state.currentSession) {
      alert('No hay una sesión activa para asociar la encuesta.');
      return;
    }

    const q1 = document.querySelector('input[name="q1_usefulness"]:checked');
    const q2 = document.querySelector('input[name="q2_reliability"]:checked');
    const q3 = document.querySelector('input[name="q3_facilitation"]:checked');
    const q4 = document.querySelector('input[name="q4_need_to_verify"]:checked');
    const q5 = document.querySelector('input[name="q5_future_use"]:checked');
    const commentsInput = document.getElementById('survey-comments');

    if (!q1 || !q2 || !q3 || !q4 || !q5) {
      alert('Por favor responda las 5 preguntas de la escala antes de enviar la encuesta.');
      return;
    }

    const surveyData = {
      ratings: {
        q1_usefulness: parseInt(q1.value, 10),
        q2_reliability: parseInt(q2.value, 10),
        q3_facilitation: parseInt(q3.value, 10),
        q4_need_to_verify: parseInt(q4.value, 10),
        q5_future_use: parseInt(q5.value, 10)
      },
      comments: commentsInput ? commentsInput.value.trim() : ''
    };

    window.state.saveSurveyResults(surveyData);
    alert('¡Encuesta y datos de sesión guardados con éxito!');

    // Redirect to Summary View
    if (window.app) {
      window.app.navigateTo('summary');
    }
  }

  resetForm() {
    if (this.form) {
      this.form.reset();
    }
  }
}

window.SurveyManager = SurveyManager;
