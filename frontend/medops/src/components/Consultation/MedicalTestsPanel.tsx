// src/components/Consultation/MedicalTestsPanel.tsx
import { useState, useEffect } from "react";
import {
  useMedicalTest,
  useCreateMedicalTest,
  useDeleteMedicalTest,
} from "../../hooks/consultations/useMedicalTest";
import { 
  BeakerIcon, 
  TrashIcon, 
  PlusIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
export interface MedicalTestsPanelProps {
  appointmentId: number;
  diagnosisId?: number;
  readOnly?: boolean;
}
export default function MedicalTestsPanel({ appointmentId, diagnosisId, readOnly = false }: MedicalTestsPanelProps) {
  const { data, isLoading } = useMedicalTest(appointmentId);
  const { mutateAsync: createTest } = useCreateMedicalTest();
  const { mutateAsync: deleteTest } = useDeleteMedicalTest();
  const tests = Array.isArray(data) ? data : [];
  const [testType, setTestType] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<"routine" | "priority" | "urgent" | "stat">("routine");
  const [status, setStatus] = useState<"pending" | "collected" | "in_process" | "completed" | "cancelled">("pending");
  useEffect(() => {
    setTestType("");
    setDescription("");
    setUrgency("routine");
    setStatus("pending");
  }, [appointmentId]);
  const handleAdd = async () => {
    if (!testType || readOnly) return;
    const payload: any = {
      appointment: appointmentId,
      test_type: testType,
      description,
      urgency,
      status,
    };
    if (diagnosisId) payload.diagnosis = diagnosisId;
    try {
      await createTest(payload);
      setTestType("");
      setDescription("");
      setUrgency("routine");
      setStatus("pending");
    } catch (err: any) {
      console.error("❌ Error:", err.message);
    }
  };
  const getUrgencyColor = (urg: string) => {
    switch (urg) {
      case 'stat': return 'bg-red-500 animate-ping';
      case 'urgent': return 'bg-orange-500';
      case 'priority': return 'bg-amber-500';
      default: return 'bg-blue-500';
    }
  };
  return (
    <div className="border border-[var(--palantir-border)] bg-white/5 rounded-sm overflow-hidden">
      {/* HEADER TÉCNICO */}
      <div className="bg-white/5 px-4 py-3 border-b border-[var(--palantir-border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BeakerIcon className="w-4 h-4 text-[var(--palantir-active)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--palantir-text)]">
            Diagnostic_Orders_Queue
          </span>
        </div>
        <span className="text-[9px] font-mono text-[var(--palantir-muted)]">
          COUNT: {tests.length}
        </span>
      </div>
      <div className="p-4 space-y-4">
        {/* LISTA DE EXÁMENES */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-[10px] font-mono text-[var(--palantir-muted)] animate-pulse">FETCHING_TEST_DATA...</div>
          ) : tests.length === 0 ? (
            <div className="text-[10px] font-mono text-[var(--palantir-muted)] opacity-50 italic">NO_ACTIVE_ORDERS_RECORDED</div>
          ) : (
            tests.map((t: any) => (
              <div key={t.id} className="group flex items-center justify-between p-2 border border-white/5 bg-white/[0.02] hover:border-[var(--palantir-active)]/30 transition-all">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${getUrgencyColor(t.urgency)}`} />
                    <span className="text-[11px] font-bold text-[var(--palantir-text)] uppercase">{t.test_type_display || t.test_type}</span>
                    <span className="text-[8px] font-black px-1 bg-white/10 text-[var(--palantir-muted)] rounded-sm">
                      {t.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-[var(--palantir-muted)] pl-3.5">
                    {t.description || "NO_DESCRIPTION_PROVIDED"}
                  </div>
                </div>
                {!readOnly && (
                  <button 
                    onClick={() => deleteTest({ id: t.id, appointment: appointmentId })}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-[var(--palantir-muted)] hover:text-red-400 transition-all"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
        {/* FORMULARIO DE ENTRADA */}
        {!readOnly && (
          <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Selector de Tipo */}
              <div className="space-y-1">
                <label className="text-[8px] font-black text-[var(--palantir-muted)] uppercase tracking-widest">Select_Procedure</label>
                <select
                  value={testType}
                  onChange={(e) => setTestType(e.target.value)}
                  className="w-full bg-black/40 border border-[var(--palantir-border)] p-2 text-[10px] font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] outline-none"
                >
                  <option value="">-- SELECT_TEST --</option>
                  
                  {/* HEMATOLOGÍA */}
                  <optgroup label="🔬 Hematología">
                    <option value="hemogram">Hemograma Completo</option>
                    <option value="hemoglobin">Hemoglobina / Hematocrito</option>
                    <option value="platelets">Conteo de Plaquetas</option>
                    <option value="reticulocytes">Reticulocitos</option>
                    <option value="coag_pt">Tiempos de Coagulación (PT/PTT/INR)</option>
                    <option value="blood_type">Grupo Sanguíneo y Rh</option>
                    <option value="peripheral-smear">Frotis de Sangre Periférica</option>
                    <option value="bone_marrow">Aspirado de Médula Ósea</option>
                  </optgroup>
                  {/* BIOQUÍMICA */}
                  <optgroup label="🧪 Bioquímica">
                    <option value="glucose">Glucemia</option>
                    <option value="glucose_2h">Glucemia Post-Prandial (2h)</option>
                    <option value="glycated_hgb">Hemoglobina Glicosilada (HbA1c)</option>
                    <option value="curva_glucosa">Curva de Tolerancia a Glucosa</option>
                    <option value="lipid_profile">Perfil Lipídico</option>
                    <option value="renal_panel">Perfil Renal (BUN/Cr)</option>
                    <option value="liver_panel">Perfil Hepático</option>
                    <option value="electrolytes">Electrolitos Séricos</option>
                    <option value="thyroid_panel">Perfil Tiroideo (TSH/T3/T4)</option>
                    <option value="bone_profile">Perfil Óseo (Ca/P/FA)</option>
                    <option value="cardiac_enzymes">Enzimas Cardíacas</option>
                    <option value="tumor_markers">Marcadores Tumorales</option>
                    <option value="iron_studies">Perfil de Hierro (Ferritina)</option>
                    <option value="vitamin_d">Vitamina D (25-OH)</option>
                    <option value="vitamin_b12">Vitamina B12</option>
                    <option value="folate">Ácido Fólico</option>
                    <option value="amylase">Amilasa / Lipasa</option>
                    <option value="uric_acid">Ácido Úrico</option>
                    <option value="protein_total">Proteínas Totales / Albúmina</option>
                    <option value="bilirubin">Bilirrubinas</option>
                    <option value="creatinine_clearance">Depuración de Creatinina</option>
                  </optgroup>
                  {/* UROANÁLISIS */}
                  <optgroup label="🚽 Uroanálisis">
                    <option value="urinalysis">Uroanálisis Completo</option>
                    <option value="urine_culture">Urocultivo</option>
                    <option value="urine_24h">Orina 24 Horas</option>
                    <option value="urine_protein">Proteinuria 24h</option>
                    <option value="urine_microalbumin">Microalbuminuria</option>
                  </optgroup>
                  {/* HECES */}
                  <optgroup label="💩 Heces">
                    <option value="stool_routine">Examen de Heces</option>
                    <option value="stool_occult">Sangre Oculta en Heces</option>
                    <option value="stool_parasites">Parasitológico en Heces</option>
                    <option value="stool_culture">Coprocultivo</option>
                    <option value="stool_elisa">Antígeno en Heces (ELISA)</option>
                  </optgroup>
                  {/* MICROBIOLOGÍA */}
                  <optgroup label="🦠 Microbiología">
                    <option value="blood_culture">Hemocultivo</option>
                    <option value="wound_culture">Cultivo de Herida</option>
                    <option value="throat_culture">Exudado Faríngeo</option>
                    <option value="sputum_culture">Cultivo de Esputo</option>
                    <option value="csf_analysis">Líquido Cefalorraquídeo</option>
                    <option value="synovial_fluid">Líquido Sinovial</option>
                    <option value="pleural_fluid">Líquido Pleural</option>
                    <option value="ascitic_fluid">Líquido Ascítico</option>
                    <option value="covid_pcr">PCR COVID-19</option>
                    <option value="covid_antigen">Antígeno COVID-19</option>
                    <option value="covid_antibodies">Anticuerpos COVID-19</option>
                    <option value="viral_panel">Panel Viral</option>
                    <option value="bacterial_panel">Panel Bacteriano</option>
                    <option value="fungus_culture">Cultivo de Hongos</option>
                    <option value="mycobacteria">Micobacterias (BK)</option>
                  </optgroup>
                  {/* INMUNOLOGÍA */}
                  <optgroup label="🛡️ Inmunología">
                    <option value="hiv_test">Prueba VIH (ELISA/Rápida)</option>
                    <option value="hepatitis_panel">Panel Hepatitis (A/B/C)</option>
                    <option value="autoimmune_panel">Panel Autoinmune (ANA/ENA)</option>
                    <option value="rheumatoid_factor">Factor Reumatoideo</option>
                    <option value="anti_ccp">Anti-CCP</option>
                    <option value="crp">Proteína C Reactiva (PCR)</option>
                    <option value="esr">Velocidad de Sedimentación (VSG)</option>
                    <option value="allergy_panel">Panel Alérgico (IgE)</option>
                    <option value="immunoglobulins">Inmunoglobulinas (IgG/IgA/IgM)</option>
                    <option value="complement">Complemento (C3/C4)</option>
                  </optgroup>
                  {/* HORMONAS */}
                  <optgroup label="📊 Hormonas">
                    <option value="cortisol">Cortisol</option>
                    <option value="acth">ACTH</option>
                    <option value="growth_hormone">Hormona de Crecimiento</option>
                    <option value="prolactin">Prolactina</option>
                    <option value="lh_fsh">LH / FSH</option>
                    <option value="testosterone">Testosterona</option>
                    <option value="estradiol">Estradiol</option>
                    <option value="progesterone">Progesterona</option>
                    <option value="dhea">DHEA-S</option>
                    <option value="insulin">Insulina</option>
                    <option value="peptide_c">Péptido C</option>
                  </optgroup>
                  {/* RAYOS X */}
                  <optgroup label="☢️ Rayos X">
                    <option value="xray_chest">Radiografía de Tórax</option>
                    <option value="xray_abdomen">Radiografía de Abdomen</option>
                    <option value="xray_bone">Radiografía Ósea</option>
                    <option value="xray_spine_cervical">Radiografía Cervical</option>
                    <option value="xray_spine_lumbar">Radiografía Lumbar</option>
                    <option value="xray_spine_dorsal">Radiografía Dorsal</option>
                    <option value="xray_pelvis">Radiografía de Pelvis</option>
                    <option value="xray_skull">Radiografía de Cráneo</option>
                    <option value="xray_sinus">Radiografía de Senos Paranasales</option>
                    <option value="xray_extremity">Radiografía de Extremidades</option>
                    <option value="xray_dental">Radiografía Dental</option>
                    <option value="xray_contrast">Radiografía con Contraste</option>
                  </optgroup>
                  {/* ECOGRAFÍA */}
                  <optgroup label="🔊 Ecografía">
                    <option value="ultrasound_abdo">Ecografía Abdominal</option>
                    <option value="ultrasound_pelvic">Ecografía Pélvica</option>
                    <option value="ultrasound_thyroid">Ecografía Tiroidea</option>
                    <option value="ultrasound_obstetric">Ecografía Obstétrica</option>
                    <option value="ultrasound_doppler">Doppler Vascular</option>
                    <option value="ultrasound_cardiac">Ecocardiograma</option>
                    <option value="ultrasound_breast">Ecografía Mamaria</option>
                    <option value="ultrasound_prostate">Ecografía Prostática</option>
                    <option value="ultrasound_testicular">Ecografía Testicular</option>
                    <option value="ultrasound_soft_tissue">Ecografía de Partes Blandas</option>
                    <option value="ultrasound_joint">Ecografía Articular</option>
                  </optgroup>
                  {/* TOMOGRAFÍA */}
                  <optgroup label="🖥️ Tomografía (TC)">
                    <option value="ct_head">TC de Cráneo</option>
                    <option value="ct_brain_angio">TC Cerebral con Angio</option>
                    <option value="ct_abdomen">TC Abdominal</option>
                    <option value="ct_chest">TC de Tórax</option>
                    <option value="ct_spine">TC de Columna</option>
                    <option value="ct_pelvis">TC de Pelvis</option>
                    <option value="ct_neck">TC de Cuello</option>
                    <option value="ct_sinus">TC de Senos Paranasales</option>
                    <option value="ct_cardiac">TC Cardíaca</option>
                    <option value="ct_angio">TC Angiografía</option>
                  </optgroup>
                  {/* RESONANCIA */}
                  <optgroup label="🧲 Resonancia (RM)">
                    <option value="mri_brain">RM Cerebral</option>
                    <option value="mri_spine">RM de Columna</option>
                    <option value="mri_joint">RM Articular</option>
                    <option value="mri_abdomen">RM Abdominal</option>
                    <option value="mri_pelvis">RM Pélvica</option>
                    <option value="mri_cardiac">RM Cardíaca</option>
                    <option value="mri_angio">RM Angiografía</option>
                    <option value="mri_prostate">RM Prostática</option>
                    <option value="mri_breast">RM Mamaria</option>
                  </optgroup>
                  {/* IMAGEN OTROS */}
                  <optgroup label="📸 Imagen Otros">
                    <option value="mammography">Mamografía</option>
                    <option value="mammography_3d">Tomosíntesis Mamaria</option>
                    <option value="densitometry">Densitometría Ósea</option>
                    <option value="fluoroscopy">Fluoroscopía</option>
                    <option value="angiography">Angiografía</option>
                    <option value="hysterosalpingography">Histerosalpingografía</option>
                    <option value="urography">Urografía</option>
                    <option value="cholangiography">Colangiografía</option>
                    <option value="pet_ct">PET-CT</option>
                    <option value="bone_scan">Gammagrafía Ósea</option>
                    <option value="thyroid_scan">Gammagrafía Tiroidea</option>
                    <option value="lung_scan">Gammagrafía Pulmonar</option>
                    <option value="renal_scan">Gammagrafía Renal</option>
                  </optgroup>
                  {/* CARDIOLOGÍA */}
                  <optgroup label="❤️ Cardiología">
                    <option value="ecg_12lead">ECG 12 Derivaciones</option>
                    <option value="ecg_holter">Holter 24h</option>
                    <option value="ecg_event">Monitoreo de Eventos</option>
                    <option value="echo_cardiac">Ecocardiograma Transtorácico</option>
                    <option value="echo_transesophageal">Ecocardiograma Transesofágico</option>
                    <option value="stress_test">Prueba de Esfuerzo</option>
                    <option value="stress_echo">Eco-Estrés</option>
                    <option value="ambulatory_bp">MAPA (Presión 24h)</option>
                    <option value="tilt_test">Prueba de Mesa Inclinada</option>
                    <option value="abi">Índice Tobillo-Brazo</option>
                  </optgroup>
                  {/* NEUMOLOGÍA */}
                  <optgroup label="🫁 Neumología">
                    <option value="spirometry">Espirometría</option>
                    <option value="spirometry_post">Espirometría Post-Broncodilatador</option>
                    <option value="plethysmography">Pletismografía</option>
                    <option value="pulse_oximetry">Oximetría de Pulso</option>
                    <option value="sleep_study">Polisomnografía</option>
                    <option value="capnography">Capnografía</option>
                    <option value="diffusion_capacity">Capacidad de Difusión</option>
                  </optgroup>
                  {/* NEUROLOGÍA */}
                  <optgroup label="🧠 Neurología">
                    <option value="eeg">Electroencefalograma</option>
                    <option value="eeg_video">Video-EEG</option>
                    <option value="emg">Electromiografía</option>
                    <option value="nerve_conduction">Conducción Nerviosa</option>
                    <option value="evoked_potentials">Potenciales Evocados</option>
                    <option value="vep">Potenciales Evocados Visuales</option>
                    <option value="baep">Potenciales Evocados Auditivos</option>
                    <option value="sep">Potenciales Evocados Somatosensoriales</option>
                  </optgroup>
                  {/* ENDOSCOPIA */}
                  <optgroup label="🔍 Endoscopía">
                    <option value="endoscopy_ugi">Endoscopía Alta (EGD)</option>
                    <option value="colonoscopy">Colonoscopía</option>
                    <option value="colonoscopy_virtual">Colonoscopía Virtual</option>
                    <option value="bronchoscopy">Broncoscopía</option>
                    <option value="cystoscopy">Cistoscopía</option>
                    <option value="gastroscopy">Gastroscopía</option>
                    <option value="sigmoidoscopy">Sigmoidoscopía</option>
                    <option value="capsule_endoscopy">Cápsula Endoscópica</option>
                    <option value="ercp">CPRE</option>
                    <option value="thoracoscopy">Toracoscopía</option>
                    <option value="laparoscopy">Laparoscopía Diagnóstica</option>
                    <option value="arthroscopy">Artroscopía</option>
                  </optgroup>
                  {/* OFTALMOLOGÍA */}
                  <optgroup label="👁️ Oftalmología">
                    <option value="visual_acuity">Agudeza Visual</option>
                    <option value="tonometry">Tonometría</option>
                    <option value="oct_eye">OCT Ocular</option>
                    <option value="fundoscopy">Fondo de Ojo</option>
                    <option value="slit_lamp">Lámpara de Hendidura</option>
                    <option value="visual_field">Campo Visual</option>
                    <option value="retinography">Retinografía</option>
                    <option value="corneal_topography">Topografía Corneal</option>
                    <option value="pachymetry">Paquimetría</option>
                    <option value="biometry">Biometría Ocular</option>
                    <option value="color_vision">Test de Visión de Colores</option>
                  </optgroup>
                  {/* OTORRINOLARINGOLOGÍA */}
                  <optgroup label="👂 Otorrinolaringología">
                    <option value="audiometry">Audiometría</option>
                    <option value="audiometry_speech">Audiometría con Logoaudiometría</option>
                    <option value="tympanometry">Timpanometría</option>
                    <option value="otoacoustic">Emisiones Otoacústicas</option>
                    <option value="bera">BERA (Potenciales Auditivos)</option>
                    <option value="nasendoscopy">Nasofibroscopía</option>
                    <option value="laryngoscopy">Laringoscopía</option>
                    <option value="vestibular_test">Pruebas Vestibulares</option>
                  </optgroup>
                  {/* GINECO-OBSTETRICIA */}
                  <optgroup label="🤰 Gineco-Obstetricia">
                    <option value="papanicolaou">Papanicolaou</option>
                    <option value="colposcopy">Colposcopía</option>
                    <option value="hysteroscopy">Histeroscopía</option>
                    <option value="amniocentesis">Amniocentesis</option>
                    <option value="chorionic_villus">Biopsia de Vellosidades Coriónicas</option>
                    <option value="nfetal_monitoring">Monitoreo Fetal</option>
                    <option value="biophysical_profile">Perfil Biofísico Fetal</option>
                    <option value="semen_analysis">Espermatograma</option>
                  </optgroup>
                  {/* PROCEDIMIENTOS ESPECIALES */}
                  <optgroup label="🔬 Procedimientos Especiales">
                    <option value="biopsy">Biopsia</option>
                    <option value="biopsy_skin">Biopsia de Piel</option>
                    <option value="biopsy_bone">Biopsia Ósea</option>
                    <option value="biopsy_liver">Biopsia Hepática</option>
                    <option value="biopsy_kidney">Biopsia Renal</option>
                    <option value="biopsy_lung">Biopsia Pulmonar</option>
                    <option value="biopsy_prostate">Biopsia de Próstata</option>
                    <option value="biopsy_breast">Biopsia de Mama</option>
                    <option value="puncture_lumbar">Punción Lumbar</option>
                    <option value="thoracentesis">Toracocentesis</option>
                    <option value="paracentesis">Paracentesis</option>
                    <option value="arthrocentesis">Artrocentesis</option>
                    <option value="bonemarrow_biopsy">Biopsia de Médula Ósea</option>
                  </optgroup>
                  {/* GENÉTICA */}
                  <optgroup label="🧬 Genética">
                    <option value="genetic_test">Prueba Genética</option>
                    <option value="karyotype">Cariotipo</option>
                    <option value="fish">FISH</option>
                    <option value="pcr_genetic">PCR Genética</option>
                    <option value="newborn_screening">Tamizaje Neonatal</option>
                    <option value="paternity_test">Prueba de Paternidad</option>
                    <option value="pharmacogenomics">Farmacogenómica</option>
                  </optgroup>
                  {/* TOXICOLOGÍA */}
                  <optgroup label="⚠️ Toxicología">
                    <option value="drug_screen">Tamizaje de Drogas</option>
                    <option value="alcohol_test">Prueba de Alcohol</option>
                    <option value="heavy_metals">Metales Pesados</option>
                    <option value="therapeutic_drug">Monitoreo de Fármacos</option>
                  </optgroup>
                  {/* OTROS */}
                  <optgroup label="📋 Otros">
                    <option value="pregnancy_test">Prueba de Embarazo</option>
                    <option value="sweat_test">Test del Sudor</option>
                    <option value="mantoux">Prueba de Mantoux (PPD)</option>
                    <option value="allergy_skin">Pruebas Cutáneas de Alergia</option>
                    <option value="patch_test">Test de Parche</option>
                    <option value="other">Otro Examen</option>
                  </optgroup>
                </select>
              </div>
              {/* Selector de Urgencia */}
              <div className="space-y-1">
                <label className="text-[8px] font-black text-[var(--palantir-muted)] uppercase tracking-widest">Priority_Level</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as any)}
                  className="w-full bg-black/40 border border-[var(--palantir-border)] p-2 text-[10px] font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] outline-none"
                >
                  <option value="routine">Rutina</option>
                  <option value="priority">Prioridad</option>
                  <option value="urgent">Urgente</option>
                  <option value="stat">STAT (Inmediato)</option>
                </select>
              </div>
            </div>
            {/* Notas del Examen */}
            <div className="space-y-1">
              <label className="text-[8px] font-black text-[var(--palantir-muted)] uppercase tracking-widest">Procedure_Directives</label>
              <textarea
                placeholder="ADD_SPECIFIC_INSTRUCTIONS_FOR_LAB_PERSONNEL..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-black/40 border border-[var(--palantir-border)] p-3 text-[10px] font-mono text-[var(--palantir-text)] focus:border-[var(--palantantir-active)] outline-none min-h-[60px] resize-none"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={!testType}
              className="flex items-center gap-2 bg-[var(--palantir-active)]/10 text-[var(--palantir-active)] border border-[var(--palantir-active)]/30 px-4 py-2 text-[9px] font-black uppercase tracking-widest hover:bg-[var(--palantir-active)] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Initialize_Order
            </button>
          </div>
        )}
      </div>
      {/* FOOTER METADATA */}
      <div className="bg-black/20 px-4 py-2 border-t border-[var(--palantir-border)] flex justify-between">
        <div className="flex items-center gap-2">
          <ExclamationTriangleIcon className="w-3 h-3 text-orange-400" />
          <span className="text-[8px] font-mono text-[var(--palantir-muted)] uppercase">
            Orders are synced with hospital laboratory information system (LIS)
          </span>
        </div>
      </div>
    </div>
  );
}