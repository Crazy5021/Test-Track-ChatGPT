# PlanCheck AI - Instrumento de Investigación Experimental

**Plataforma web para la evaluación experimental de la inteligencia artificial como herramienta de apoyo en la revisión de planos de construcción en Ingeniería en Obras Civiles.**

---

## 1. Contexto Académico y Metodológico

- **Campo de Investigación:** Aplicación de inteligencia artificial en la revisión y control de calidad de planos de edificación y obras civiles.
- **Problema:** La revisión manual de planos exige la verificación minuciosa de dimensiones, cotas, anotaciones y disposiciones geométricas. Este proceso suele verse afectado por fatiga, sobrecarga de información y variabilidad en la experiencia técnica. Las herramientas basadas en IA pueden automatizar la detección de posibles anomalías, pero sus resultados pueden contener imprecisiones y falsos positivos, exigiendo siempre una validación humana rigurosa.
- **Pregunta de Investigación:**  
  > *“¿En qué medida el uso de una herramienta basada en inteligencia artificial puede apoyar a estudiantes de Ingeniería en Obras Civiles en la detección de errores e inconsistencias en planos de construcción?”*
- **Premisa Ética y Académica:**  
  > *“La inteligencia artificial funciona como herramienta de apoyo y sus resultados deben ser validados por el usuario.”*  
  El instrumento no asume a priori que la IA es superior o más veloz; su propósito es recopilar evidencia empírica para medir tiempos, cobertura de errores, falsos positivos y percepción crítica.

---

## 2. Arquitectura del Sistema

El proyecto fue diseñado bajo el principio de **máxima portabilidad y cero dependencias de compilación**:
- **Tecnologías:** HTML5 semántico, CSS3 moderno (Variables CSS, Grid, Flexbox) y JavaScript ES6 modular nativo.
- **Sin dependencias pesadas:** No requiere Node.js, npm, webpack ni servidores de backend complejos para su funcionamiento base. Se ejecuta instantáneamente abriendo `index.html` en cualquier navegador web moderno (Google Chrome, Microsoft Edge, Brave, Safari, Firefox) tanto en ordenadores como en dispositivos móviles y tablets.
- **Persistencia de Datos:** Utiliza `LocalStorage` con un esquema relacional estructurado por sesión, asegurando que los datos experimentales no se pierdan si se recarga la pestaña.
- **Exportación:** Exporta a **CSV (con codificación UTF-8 con BOM)** para compatibilidad inmediata con Microsoft Excel, Google Sheets, SPSS y R, así como a **JSON** para análisis avanzado.

### Estructura de Archivos
```
PlanCheck-AI/
├── index.html                   # Interfaz unificada del instrumento (SPA multipantalla)
├── README.md                    # Documentación técnica, pedagógica y metodológica
├── assets/
│   └── sample_blueprint.svg     # Plano de muestra técnico con cotas e inconsistencias deliberadas
├── styles/
│   ├── main.css                 # Variables de diseño institucional, reset, encabezado y modales
│   ├── viewer.css               # Estilos del visor interactivo (pan, zoom, marcadores, dropzone)
│   ├── components.css           # Estilos de tarjetas, tablas, formularios, botones HITL y gráficos
│   └── responsive.css           # Reglas adaptativas para pantallas de escritorio, tablets y móviles
└── scripts/
    ├── state.js                 # Manejo del estado global reactivo y persistencia LocalStorage
    ├── timer.js                 # Temporizador experimental de alta precisión
    ├── viewer.js                # Motor del visor de planos (zoom rueda/botones, paneo, coordenadas)
    ├── findings.js              # CRUD de hallazgos del estudiante (ID, tipo, cota, corrección)
    ├── ai-assistant.js          # Módulo de IA: Modo Demo Académico + Conexión REST a Gemini API
    ├── validation.js            # Lógica Human-in-the-Loop (Error confirmado, Falso positivo, Revisión)
    ├── survey.js                # Encuesta Likert (1-5) post-experiencia y reflexiones cualitativas
    ├── comparison.js            # Tablero comparativo entre grupos (Sin IA vs Con IA) con gráficos nativos
    ├── export.js                # Generación y descarga de datasets en CSV y JSON
    └── app.js                   # Orquestador maestro de la aplicación y enrutamiento de vistas
```

---

## 3. Protocolo Experimental y Funcionalidades

### 1. Pantalla de Inicio
- Muestra el marco teórico, el campo, la pregunta de investigación y el aviso ético obligatorio.
- Ficha de registro del estudiante (nombre/código, semestre y carrera) para garantizar la trazabilidad de los datos.

### 2. Asignación de Modalidad
- **Condición A: “Revisión sin IA” (Grupo de Control):** El estudiante inspecciona el plano sin asistencia automatizada, registrando hallazgos de forma tradicional.
- **Condición B: “Revisión asistida por IA” (Grupo Experimental):** El estudiante tiene acceso al asistente de IA y debe aplicar validación crítica (*Human-in-the-Loop*).

### 3. Visor de Planos Interactivo
- **Plano de Demostración Calibrado (`sample_blueprint.svg`):** Plano de una planta habitacional a escala 1:50 con cotas técnicas parciales y totales, ejes estructurales (1, 2, 3 / A, B, C), niveles de piso terminado (N.P.T.) y vanos rotulados.
- **Inconsistencias deliberadas en el plano demo:**
  1. *Dimensional:* Cota total norte indica 7.20 m cuando la sumatoria de cotas parciales es 4.00 m + 3.50 m = 7.50 m (error de 30 cm).
  2. *Geométrica:* Puerta P-2 de dormitorio bate hacia el exterior obstruyendo el pasillo de evacuación.
  3. *Anotación/Niveles:* Nivel de terreno exterior (N.T.N. +0.30 m) es más alto que el interior (N.P.T. +0.15 m), lo que causaría inundación por lluvias.
  4. *Vano:* Ventana V-2 rotulada como 1.50 m en un vano físico de 1.00 m.
- **Herramientas del visor:** Zoom con rueda del ratón o botones (+ / -), arrastre (pan), ajuste a pantalla (`⛶`), restablecer vista (`1:1`), modo de captura de coordenadas con clic (`📍`) y zona para cargar imágenes propias (PNG, JPG, SVG).

### 4. Temporizador Experimental
- Se inicia automáticamente al entrar a la modalidad.
- Muestra el tiempo en formato MM:SS y registra el tiempo exacto en segundos para contrastar la velocidad de revisión entre grupos.
- Incluye diálogo de confirmación para finalizar la revisión y detener el conteo.

### 5. Registro de Hallazgos
- Formulario para documentar inconsistencias: ID autogenerado (`H-01`, `H-02`), ubicación (por coordenadas o eje), tipo de error (*Dimensional, Geométrico, Anotación, Inconsistencia, Otro*), descripción técnica, corrección propuesta y nivel de confianza (*Alto, Medio, Bajo*).
- Lista interactiva editable: permite modificar, eliminar y consultar hallazgos.

### 6. Asistencia de IA y Human-in-the-Loop (HITL)
- **Consulta técnica:** Incluye el prompt predeterminado del protocolo de investigación.
- **Modo DEMO Calibrado:** Diseñado para entornos experimentales homogéneos. Emite sugerencias técnicas que corresponden al plano de prueba, incluyendo:
  - Detecciones válidas (verdaderos positivos).
  - Un **ítem de control de falso positivo** (la IA sugiere sobredimensionar un muro de 20 cm a 30 cm sin justificación normativa real) para medir si el estudiante acepta ciegamente la indicación o la cuestiona.
- **Validación Humana Obligatoria:** Cada tarjeta de IA exige que el estudiante presione:
  - `✔️ Error confirmado` (Acierto de la IA)
  - `❌ No es un error` (Falso positivo identificado por el estudiante)
  - `⚠️ Requiere revisión` (Incertidumbre o ambigüedad)
  - Campo para comentario técnico justificativo.
  - Botón para importar la sugerencia validada a la lista de hallazgos propios.

### 7. Encuesta Final Likert (1 a 5)
1. *¿Qué tan útil fue la herramienta de revisión en el ejercicio?*
2. *¿Qué tan confiables consideraste las sugerencias técnicas presentadas?*
3. *¿La herramienta/asistencia facilitó la identificación de inconsistencias?*
4. *¿Sentiste la necesidad de verificar y auditar críticamente cada indicación?*
5. *¿Utilizarías una herramienta similar en una revisión real de planos de obras civiles?*
- Campo de comentarios abiertos y reflexiones cualitativas.

### 8. Resumen de Sesión y Comparación Experimental
- **Resumen:** Muestra tiempo total, hallazgos, tasa de falsos positivos detectados y porcentaje de auditoría crítica.
- **Módulo de Comparación:** Genera un contraste analítico con gráficos de barras entre el grupo *Sin IA* y *Con IA* (tiempo medio, promedio de hallazgos, tasa de filtrado y percepción de utilidad).

### 9. Exportación de Datos
- **CSV:** Tabla estructurada con encabezados claros y separador `;` para importar directamente en Excel (con soporte de acentos mediante BOM UTF-8) o cargar en Pandas/R:
  ```csv
  ID_Sesion;Participante_Nombre;Participante_Codigo;Participante_Semestre;Modalidad;Fecha_Inicio;Fecha_Fin;Tiempo_Total_Segundos;Tiempo_Total_Formato;Total_Hallazgos;...
  ```
- **JSON:** Exporta el historial completo con los objetos jerárquicos de todas las sesiones.

---

## 4. Instrucciones de Uso y Ejecución

1. **Ejecutar la aplicación:**
   - Abra el archivo `index.html` directamente haciendo doble clic sobre él en el explorador de archivos de Windows o abriéndolo con cualquier navegador web (Chrome, Edge, Brave, etc.).
   - No requiere conexión a internet para el funcionamiento del modo DEMO calibrado.
2. **Iniciar una sesión:**
   - En la pantalla de inicio, ingrese los datos del participante y haga clic en **“Comenzar evaluación”**.
   - Elija la modalidad: **Revisión sin IA** o **Revisión asistida por IA**.
   - En el visor de plano, navegue con el ratón (rueda para zoom, arrastre para mover).
   - Documente las inconsistencias encontradas.
   - En la modalidad con IA, solicite el análisis y clasifique obligatoriamente las respuestas (Human-in-the-Loop).
   - Haga clic en **“Finalizar revisión”** y responda la encuesta final.
3. **Analizar y Exportar los Resultados:**
   - Diríjase a la pestaña **“Comparación”** para visualizar las métricas comparativas.
   - En la pestaña **“Historial”**, haga clic en **“Exportar Todo a CSV”** o **“Exportar Todo a JSON”** para guardar la base de datos de la investigación.

---

## 5. Conexión Opcional a API de IA Real (Google Gemini)

Si en etapas avanzadas de la investigación se desea conectar una API de visión multimodal en vivo:
1. Haga clic en el ícono del engranaje `⚙️` en la barra superior.
2. Desmarque la casilla *“Utilizar Modo Calibrado de Demostración Académico”*.
3. Ingrese su clave de API de Google Gemini (`AIzaSy...`).
4. Guarde los cambios. Las consultas enviarán las solicitudes directamente al endpoint de Gemini Vision.

---

## 6. Créditos y Propósito

Desarrollado como instrumento académico riguroso para la recolección y análisis de evidencia experimental en el área de **Ingeniería en Obras Civiles**.
