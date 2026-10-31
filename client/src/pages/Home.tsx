import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CircleHelp,
  ClipboardCheck,
  Database,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { domains, getUnansweredQuestionIds, isValidOptionalEmail, isValidOptionalWebsite, maturityLabels, totalQuestions } from "@/lib/assessment";
import { trpc } from "@/lib/trpc";

// Set at build time (see config.env.template). The fallbacks are deliberately
// visible so an unconfigured build is obvious in review instead of shipping a
// fake legal text.
const PRIVACY_NOTICE_URL = import.meta.env.VITE_PRIVACY_NOTICE_URL || "#aviso-de-privacidad-pendiente";
const LEGAL_ENTITY_NAME = import.meta.env.VITE_LEGAL_ENTITY_NAME || "[RESPONSABLE PENDIENTE DE APROBACIÓN LEGAL]";

const sectors = ["Comercio", "Servicios profesionales", "Manufactura", "Logística y transporte", "Salud", "Educación", "Construcción e inmobiliario", "Tecnología", "Agroindustria", "Otro"];
const employeeRanges = ["1–10", "11–50", "51–100", "101–250", "251–500", "Más de 500"];
const impacts = ["Continuidad operativa", "Ingresos / ventas", "Experiencia de cliente", "Costos y eficiencia", "Seguridad o privacidad", "Reportes y decisiones"];
const urgencies = ["Alta — requiere atención en 90 días", "Media — relevante este año", "Baja — exploración inicial"];

type ContactForm = {
  companyName: string;
  legalName: string;
  website: string;
  sector: string;
  employeeRange: string;
  state: string;
  city: string;
  systems: string;
  keyProcesses: string;
  criticalData: string;
  interlocutors: Interlocutor[];
  fullName: string;
  jobTitle: string;
  area: string;
  workEmail: string;
  phone: string;
  preferredChannel: string;
  decisionRole: string;
  primaryConcern: string;
  businessImpact: string;
  urgency: string;
  upcomingProject: string;
  expectedOutcome: string;
  consent: boolean;
};

type Interlocutor = {
  fullName: string;
  jobTitle: string;
  area: string;
  email: string;
  phone: string;
  responsibility: string;
};

type Answer = {
  score: number | null;
  isNotApplicable: boolean;
  priority: "" | "Alta" | "Media" | "Baja";
  responsibleRole: string;
  processSystem: string;
  comments: string;
};

const emptyContact: ContactForm = {
  companyName: "", legalName: "", website: "", sector: "", employeeRange: "", state: "", city: "", systems: "", keyProcesses: "", criticalData: "",
  interlocutors: [{ fullName: "", jobTitle: "", area: "", email: "", phone: "", responsibility: "" }, { fullName: "", jobTitle: "", area: "", email: "", phone: "", responsibility: "" }],
  fullName: "", jobTitle: "", area: "", workEmail: "", phone: "", preferredChannel: "", decisionRole: "", primaryConcern: "", businessImpact: "", urgency: "", upcomingProject: "", expectedOutcome: "", consent: false,
};

function getEmptyAnswers() {
  return Object.fromEntries(domains.flatMap(domain => domain.questions.map(question => [question.id, {
    score: null,
    isNotApplicable: false,
    priority: "",
    responsibleRole: "",
    processSystem: "",
    comments: "",
  }]))) as Record<string, Answer>;
}

function Logo() {
  return (
    <a href="https://www.sdggroup.com/en/" target="_blank" rel="noreferrer" className="brand-mark" aria-label="SDG Group">
      <img src="/sdg-logo.png" alt="SDG Group" />
    </a>
  );
}

function FieldLabel({ children, optional = false }: { children: React.ReactNode; optional?: boolean }) {
  return <label className="field-label">{children} {optional && <span>Opcional</span>}</label>;
}

export default function Home() {
  const [step, setStep] = useState(0);
  const [domainIndex, setDomainIndex] = useState(0);
  const [contact, setContact] = useState<ContactForm>(emptyContact);
  const [answers, setAnswers] = useState<Record<string, Answer>>(getEmptyAnswers);
  const [submitted, setSubmitted] = useState(false);
  const [validationDomainIndex, setValidationDomainIndex] = useState<number | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const submitMutation = trpc.assessment.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setStep(4);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: error => toast.error(error.message || "No fue posible guardar la información. Inténtalo de nuevo."),
  });

  const answeredCount = Object.values(answers).filter(answer => answer.score !== null || answer.isNotApplicable).length;
  const requiredContactComplete = Boolean(
    contact.companyName.trim() && contact.sector && contact.employeeRange && contact.state.trim() && contact.fullName.trim() && contact.jobTitle.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.workEmail) && contact.primaryConcern.trim().length >= 10 && contact.businessImpact && contact.urgency && contact.consent,
  );
  const websiteValid = isValidOptionalWebsite(contact.website);
  const invalidInterlocutorEmailIndex = contact.interlocutors.findIndex(interlocutor => !isValidOptionalEmail(interlocutor.email));
  const optionalContactFieldsValid = websiteValid && invalidInterlocutorEmailIndex === -1;
  const allQuestionsComplete = answeredCount === totalQuestions;
  const averageScore = useMemo(() => {
    const scored = Object.values(answers).filter(answer => answer.score !== null).map(answer => answer.score as number);
    return scored.length ? scored.reduce((sum, score) => sum + score, 0) / scored.length : 0;
  }, [answers]);
  const scoreLabel = maturityLabels.find(item => Math.round(averageScore) === item.value)?.label ?? "Nivel 0";

  const updateContact = (key: keyof ContactForm, value: string | boolean) => setContact(prev => ({ ...prev, [key]: value }));
  const updateInterlocutor = (index: number, key: keyof Interlocutor, value: string) => setContact(prev => ({ ...prev, interlocutors: prev.interlocutors.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) }));
  const updateAnswer = (id: string, next: Partial<Answer>) => setAnswers(prev => ({ ...prev, [id]: { ...prev[id], ...next } }));

  const goToProfile = () => {
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goToAssessment = () => {
    if (!requiredContactComplete) {
      toast.error("Completa los campos requeridos y acepta el aviso antes de continuar.");
      return;
    }
    if (!websiteValid) {
      toast.error("Revisa el sitio web: usa una URL completa, por ejemplo https://empresa.com.");
      return;
    }
    if (invalidInterlocutorEmailIndex >= 0) {
      toast.error(`Revisa el correo del interlocutor ${invalidInterlocutorEmailIndex + 1}. Usa un formato como nombre@empresa.com.`);
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goToReview = () => {
    if (!allQuestionsComplete) {
      const firstIncompleteIndex = domains.findIndex(domain => getUnansweredQuestionIds(domain.questions.map(question => question.id), answers).length > 0);
      const firstIncompleteDomain = domains[firstIncompleteIndex];
      const missingCount = firstIncompleteDomain ? getUnansweredQuestionIds(firstIncompleteDomain.questions.map(question => question.id), answers).length : totalQuestions - answeredCount;
      const message = missingCount === 1
        ? `Falta 1 pregunta obligatoria en “${firstIncompleteDomain?.title ?? "el diagnóstico"}”. Selecciona un nivel del 0 al 5 o N/A para continuar.`
        : `Faltan ${missingCount} preguntas obligatorias en “${firstIncompleteDomain?.title ?? "el diagnóstico"}”. Responde cada una con un nivel del 0 al 5 o N/A para continuar.`;
      setDomainIndex(firstIncompleteIndex >= 0 ? firstIncompleteIndex : domainIndex);
      setValidationDomainIndex(firstIncompleteIndex >= 0 ? firstIncompleteIndex : domainIndex);
      setValidationMessage(message);
      toast.error(message);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setValidationDomainIndex(null);
    setValidationMessage(null);
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goToNextDomain = () => {
    const missingIds = getUnansweredQuestionIds(currentDomain.questions.map(question => question.id), answers);
    if (missingIds.length) {
      const message = missingIds.length === 1
        ? `Falta responder 1 pregunta obligatoria en “${currentDomain.title}”. Selecciona un nivel del 0 al 5 o N/A para continuar.`
        : `Faltan ${missingIds.length} preguntas obligatorias en “${currentDomain.title}”. Responde cada una con un nivel del 0 al 5 o N/A para continuar.`;
      setValidationDomainIndex(domainIndex);
      setValidationMessage(message);
      toast.error(message);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setValidationDomainIndex(null);
    setValidationMessage(null);
    setDomainIndex(domainIndex + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const selectDomain = (nextIndex: number) => {
    if (nextIndex <= domainIndex) {
      setDomainIndex(nextIndex);
      setValidationDomainIndex(null);
      setValidationMessage(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const missingIds = getUnansweredQuestionIds(currentDomain.questions.map(question => question.id), answers);
    if (missingIds.length) {
      const message = missingIds.length === 1
        ? `Falta responder 1 pregunta obligatoria en “${currentDomain.title}”. Selecciona un nivel del 0 al 5 o N/A para continuar.`
        : `Faltan ${missingIds.length} preguntas obligatorias en “${currentDomain.title}”. Responde cada una con un nivel del 0 al 5 o N/A para continuar.`;
      setValidationDomainIndex(domainIndex);
      setValidationMessage(message);
      toast.error(message);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setDomainIndex(nextIndex);
    setValidationDomainIndex(null);
    setValidationMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const submit = () => {
    if (!requiredContactComplete || !allQuestionsComplete) return;
    submitMutation.mutate({
      ...contact,
      website: contact.website || undefined,
      legalName: contact.legalName || undefined,
      city: contact.city || undefined,
      systems: contact.systems || undefined,
      keyProcesses: contact.keyProcesses || undefined,
      criticalData: contact.criticalData || undefined,
      interlocutors: contact.interlocutors.filter(interlocutor => Object.values(interlocutor).some(Boolean)),
      area: contact.area || undefined,
      phone: contact.phone || undefined,
      preferredChannel: contact.preferredChannel || undefined,
      decisionRole: contact.decisionRole || undefined,
      upcomingProject: contact.upcomingProject || undefined,
      expectedOutcome: contact.expectedOutcome || undefined,
      consent: true as const,
      responses: domains.flatMap(domain => domain.questions.map(question => ({
        domain: domain.id,
        questionId: question.id,
        ...answers[question.id],
      }))),
    });
  };

  const currentDomain = domains[domainIndex];
  const domainAnswered = currentDomain?.questions.filter(question => answers[question.id].score !== null || answers[question.id].isNotApplicable).length ?? 0;

  if (submitted) {
    return (
      <main className="min-h-screen bg-sdg-navy text-white">
        <header className="top-nav"><Logo /><div className="nav-meta">AUTODIAGNÓSTICO · PYME MÉXICO</div></header>
        <section className="result-shell">
          <div className="result-orb"><CheckCircle2 size={40} /></div>
          <p className="eyebrow aqua">REGISTRO RECIBIDO</p>
          <h1>Gracias, {contact.fullName.split(" ")[0]}.</h1>
          <p className="result-copy">Esta es una lectura inicial de alto nivel de tu <strong>modelo de madurez de gobierno del dato</strong>. Alguien de nuestro equipo se pondrá en contacto contigo para continuar la conversación y explorar los siguientes pasos.</p>
          <div className="result-score"><span>Lectura inicial</span><strong>{averageScore.toFixed(1)}<small>/5</small></strong><em>{scoreLabel}</em></div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="top-nav">
        <Logo />
        <span className="nav-meta desktop-only">DATA STRATEGY & GOVERNANCE</span>
      </header>

      {step === 0 && (
        <>
          <section className="hero-section">
            <div className="hero-grid" />
            <div className="hero-copy">
              <p className="eyebrow aqua">MODELO DE MADUREZ DE GOBIERNO DEL DATO</p>
              <h1>Da el siguiente paso.<br /><span>Gobierna tus datos.</span></h1>
              <p className="hero-lede">Un modelo de autodiagnóstico para empresas mexicanas. Identifica en menos de 20 minutos las prácticas que fortalecen —o frenan— la confianza, seguridad y valor de tus datos.</p>
              <div className="hero-actions">
                <button className="button button-aqua" onClick={goToProfile}>Comenzar diagnóstico <ArrowRight size={18} /></button>
                <a href="#como-funciona" className="text-link light">Conoce el proceso <ChevronRight size={16} /></a>
              </div>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="data-orb"><span /><span /><span /><span /><span /><span /></div>
              <div className="art-caption"><span>11</span> dominios de gestión<br />de datos</div>
            </div>
          </section>
          <section id="como-funciona" className="journey-section">
            <div className="section-kicker">UN DIAGNÓSTICO BREVE. UNA CONVERSACIÓN ÚTIL.</div>
            <div className="journey-heading"><h2>Convierte señales dispersas<br />en una ruta clara.</h2><p>Un modelo de autodiagnóstico basado en prácticas DAMA y adaptado del cuestionario SDG/DMBOK a la realidad de las empresas mexicanas.</p></div>
            <div className="journey-grid">
              {[{n:"01",t:"Cuéntanos de tu contexto",d:"Perfil, prioridades y principal reto de datos."},{n:"02",t:"Evalúa tus prácticas",d:"46 preguntas concretas en 11 dominios."},{n:"03",t:"Recibe una lectura inicial",d:"Un mapa para iniciar una conversación de mejora."}].map(item => <article className="journey-card" key={item.n}><span>{item.n}</span><h3>{item.t}</h3><p>{item.d}</p></article>)}
            </div>
          </section>
          <section className="domains-preview">
            <div><p className="eyebrow">QUÉ VAS A EXPLORAR</p><h2>Las capacidades que conectan<br />datos con impacto.</h2></div>
            <div className="domain-pills">{domains.map((domain, index) => <div className="domain-pill" key={domain.id}><b>{String(index + 1).padStart(2, "0")}</b><span>{domain.shortTitle}</span></div>)}</div>
          </section>
          <section className="trust-section"><ShieldCheck size={26} /><div><strong>Tu información se usa exclusivamente para entregar el diagnóstico y dar seguimiento a tu solicitud.</strong><span>Consulta el <a href={PRIVACY_NOTICE_URL} target="_blank" rel="noopener noreferrer">Aviso de Privacidad</a> antes de enviar tus datos.</span></div></section>
          <footer><span>© SDG Group · Data Strategy & Governance</span><a href={PRIVACY_NOTICE_URL} target="_blank" rel="noopener noreferrer">Aviso de Privacidad</a></footer>
        </>
      )}

      {step > 0 && step < 4 && (
        <section className="assessment-layout">
          <aside className="assessment-sidebar">
            {step < 3 && <button className="back-home" onClick={() => setStep(0)}><ArrowLeft size={16} /> Volver al inicio</button>}
            <p className="eyebrow aqua">AUTODIAGNÓSTICO SDG</p>
            <h2>Tu ruta de<br /><em>madurez.</em></h2>
            <div className="stepper">
              {[{n:1,l:"Perfil"},{n:2,l:"Diagnóstico"},{n:3,l:"Resultados"}].map(item => <div className={`stepper-item ${step === item.n ? "active" : step > item.n ? "complete" : ""}`} key={item.n}><span>{step > item.n ? <Check size={13} /> : item.n}</span><p>{item.l}</p></div>)}
            </div>
            <div className="side-note"><LockKeyhole size={16} /> Tus respuestas se almacenan de forma segura y sólo se usan para tu solicitud.</div>
          </aside>
          <div className="assessment-content">
            {step === 1 && <ProfileStep contact={contact} updateContact={updateContact} updateInterlocutor={updateInterlocutor} websiteValid={websiteValid} invalidInterlocutorEmailIndex={invalidInterlocutorEmailIndex} optionalContactFieldsValid={optionalContactFieldsValid} onBack={() => setStep(0)} onNext={goToAssessment} />}
            {step === 2 && <AssessmentStep domain={currentDomain} domainIndex={domainIndex} answered={domainAnswered} answers={answers} updateAnswer={updateAnswer} unansweredIds={validationDomainIndex === domainIndex ? getUnansweredQuestionIds(currentDomain.questions.map(question => question.id), answers) : []} validationMessage={validationDomainIndex === domainIndex ? validationMessage : null} onSelectDomain={selectDomain} onBack={() => setStep(1)} onNext={domainIndex < domains.length - 1 ? goToNextDomain : goToReview} onReview={goToReview} />}
            {step === 3 && <ReviewStep averageScore={averageScore} scoreLabel={scoreLabel} contact={contact} answers={answers} onSubmit={submit} isSubmitting={submitMutation.isPending} />}
          </div>
        </section>
      )}
    </main>
  );
}

function ProfileStep({ contact, updateContact, updateInterlocutor, websiteValid, invalidInterlocutorEmailIndex, optionalContactFieldsValid, onBack, onNext }: { contact: ContactForm; updateContact: (key: keyof ContactForm, value: string | boolean) => void; updateInterlocutor: (index: number, key: keyof Interlocutor, value: string) => void; websiteValid: boolean; invalidInterlocutorEmailIndex: number; optionalContactFieldsValid: boolean; onBack: () => void; onNext: () => void }) {
  return <div className="form-stage enter-stage">
    <div className="stage-head"><p className="eyebrow">PASO 1 DE 3</p><h1>Entendamos tu <em>contexto.</em></h1><p>Los campos marcados con <b>*</b> son requeridos. La información complementaria nos ayuda a preparar una conversación más relevante.</p></div>
    <section className="form-block"><div className="block-title"><Database size={19} /><div><h3>Organización</h3><p>Información básica de la empresa</p></div></div>
      <div className="form-grid three">
        <div><FieldLabel>Empresa / nombre comercial *</FieldLabel><input value={contact.companyName} onChange={e => updateContact("companyName", e.target.value)} placeholder="Ej. Grupo Horizonte" /></div>
        <div><FieldLabel optional>Razón social</FieldLabel><input value={contact.legalName} onChange={e => updateContact("legalName", e.target.value)} placeholder="Opcional" /></div>
        <div><FieldLabel optional>Sitio web</FieldLabel><input className={contact.website.trim() && !websiteValid ? "field-invalid" : ""} value={contact.website} onChange={e => updateContact("website", e.target.value)} placeholder="https://" type="url" />{contact.website.trim() && !websiteValid && <span className="field-error" role="alert">Ingresa una URL completa, por ejemplo https://empresa.com.</span>}</div>
        <div><FieldLabel>Sector *</FieldLabel><select value={contact.sector} onChange={e => updateContact("sector", e.target.value)}><option value="">Selecciona una opción</option>{sectors.map(item => <option key={item}>{item}</option>)}</select></div>
        <div><FieldLabel>Tamaño *</FieldLabel><select value={contact.employeeRange} onChange={e => updateContact("employeeRange", e.target.value)}><option value="">Selecciona una opción</option>{employeeRanges.map(item => <option key={item}>{item}</option>)}</select></div>
        <div><FieldLabel>Estado *</FieldLabel><input value={contact.state} onChange={e => updateContact("state", e.target.value)} placeholder="Ej. Ciudad de México" /></div>
        <div><FieldLabel optional>Ciudad / municipio</FieldLabel><input value={contact.city} onChange={e => updateContact("city", e.target.value)} placeholder="Opcional" /></div>
        <div className="span-2"><FieldLabel optional>Sistemas o herramientas clave</FieldLabel><input value={contact.systems} onChange={e => updateContact("systems", e.target.value)} placeholder="Ej. ERP, CRM, hojas de cálculo, Power BI, nube" /></div>
      </div>
    </section>
    <section className="form-block"><div className="block-title"><Mail size={19} /><div><h3>Contacto principal</h3><p>Persona que responde y puede continuar la conversación</p></div></div>
      <div className="form-grid three">
        <div><FieldLabel>Nombre completo *</FieldLabel><input value={contact.fullName} onChange={e => updateContact("fullName", e.target.value)} placeholder="Nombre y apellidos" /></div>
        <div><FieldLabel>Puesto / posición *</FieldLabel><input value={contact.jobTitle} onChange={e => updateContact("jobTitle", e.target.value)} placeholder="Ej. Director(a) de Operaciones" /></div>
        <div><FieldLabel optional>Área / función</FieldLabel><input value={contact.area} onChange={e => updateContact("area", e.target.value)} placeholder="Ej. Finanzas" /></div>
        <div><FieldLabel>Correo electrónico *</FieldLabel><input type="email" value={contact.workEmail} onChange={e => updateContact("workEmail", e.target.value)} placeholder="nombre@empresa.com" /></div>
        <div><FieldLabel optional>Celular / WhatsApp</FieldLabel><input type="tel" value={contact.phone} onChange={e => updateContact("phone", e.target.value)} placeholder="Opcional" /></div>
        <div><FieldLabel optional>Rol en la decisión</FieldLabel><select value={contact.decisionRole} onChange={e => updateContact("decisionRole", e.target.value)}><option value="">Selecciona una opción</option><option>Decide o patrocina</option><option>Influye</option><option>Evalúa / recomienda</option><option>Implementa / opera</option></select></div>
      </div>
    </section>
    <section className="form-block"><div className="block-title"><UserRound size={19} /><div><h3>Interlocutores adicionales</h3><p>Opcional · registra a quienes deben participar en la conversación</p></div></div>
      <div className="interlocutor-list">{contact.interlocutors.map((interlocutor, index) => <div className="interlocutor-row" key={index}><span className="interlocutor-number">0{index + 1}</span><div><FieldLabel optional>Nombre completo</FieldLabel><input value={interlocutor.fullName} onChange={e => updateInterlocutor(index, "fullName", e.target.value)} placeholder="Nombre y apellidos" /></div><div><FieldLabel optional>Puesto / posición</FieldLabel><input value={interlocutor.jobTitle} onChange={e => updateInterlocutor(index, "jobTitle", e.target.value)} placeholder="Ej. TI, Finanzas" /></div><div><FieldLabel optional>Correo electrónico</FieldLabel><input className={interlocutor.email.trim() && !isValidOptionalEmail(interlocutor.email) ? "field-invalid" : ""} type="email" value={interlocutor.email} onChange={e => updateInterlocutor(index, "email", e.target.value)} placeholder="nombre@empresa.com" />{interlocutor.email.trim() && !isValidOptionalEmail(interlocutor.email) && <span className="field-error" role="alert">Usa un correo válido, por ejemplo nombre@empresa.com.</span>}</div><div><FieldLabel optional>Responsabilidad</FieldLabel><select value={interlocutor.responsibility} onChange={e => updateInterlocutor(index, "responsibility", e.target.value)}><option value="">Selecciona una opción</option><option>Patrocinador</option><option>Responsable de datos</option><option>Responsable de proceso</option><option>TI / sistemas</option><option>Seguridad / privacidad</option><option>Usuario clave</option></select></div></div>)}</div>
    </section>
    <section className="form-block"><div className="block-title"><Sparkles size={19} /><div><h3>Prioridad de negocio</h3><p>Nos ayuda a contextualizar tu resultado</p></div></div>
      <div className="form-grid two"><div className="span-2"><FieldLabel>¿Cuál es el problema de datos que más les preocupa? *</FieldLabel><textarea value={contact.primaryConcern} onChange={e => updateContact("primaryConcern", e.target.value)} placeholder="Describe brevemente el reto, la consecuencia o la oportunidad que te trajo a este diagnóstico." rows={4} /></div><div><FieldLabel>Impacto percibido *</FieldLabel><select value={contact.businessImpact} onChange={e => updateContact("businessImpact", e.target.value)}><option value="">Selecciona una opción</option>{impacts.map(item => <option key={item}>{item}</option>)}</select></div><div><FieldLabel>Urgencia *</FieldLabel><select value={contact.urgency} onChange={e => updateContact("urgency", e.target.value)}><option value="">Selecciona una opción</option>{urgencies.map(item => <option key={item}>{item}</option>)}</select></div><div className="span-2"><FieldLabel optional>Proyecto o cambio próximo</FieldLabel><input value={contact.upcomingProject} onChange={e => updateContact("upcomingProject", e.target.value)} placeholder="Ej. cambio de ERP, lanzamiento de canal digital, reporte regulatorio" /></div></div>
    </section>
    <label className="consent"><input type="checkbox" checked={contact.consent} onChange={e => updateContact("consent", e.target.checked)} /><span><b>Autorizo el contacto comercial relacionado con este diagnóstico. *</b> He leído el <a href={PRIVACY_NOTICE_URL} target="_blank" rel="noopener noreferrer">Aviso de Privacidad de {LEGAL_ENTITY_NAME}</a>.</span></label>
    {!optionalContactFieldsValid && <div className="profile-validation" role="alert"><CircleAlert size={17} /><span>Corrige los campos opcionales marcados en rojo antes de continuar.</span></div>}
    <div className="stage-actions"><button className="button button-outline" onClick={onBack}><ArrowLeft size={17} /> Atrás</button><button className="button button-navy" onClick={onNext}>Continuar al diagnóstico <ArrowRight size={17} /></button></div>
  </div>;
}

function AssessmentStep({ domain, domainIndex, answered, answers, updateAnswer, unansweredIds, validationMessage, onSelectDomain, onBack, onNext, onReview }: { domain: typeof domains[number]; domainIndex: number; answered: number; answers: Record<string, Answer>; updateAnswer: (id: string, next: Partial<Answer>) => void; unansweredIds: string[]; validationMessage: string | null; onSelectDomain: (index: number) => void; onBack: () => void; onNext: () => void; onReview: () => void }) {
  return <div className="diagnostic-stage enter-stage">
    <div className="stage-head compact"><p className="eyebrow">PASO 2 DE 3 · {domainIndex + 1} / {domains.length} DOMINIOS</p><h1>{domain.title}</h1><p>{domain.description}</p></div>
    <div className="domain-nav">{domains.map((item, index) => <button key={item.id} className={index === domainIndex ? "active" : ""} onClick={() => onSelectDomain(index)}><span>{String(index + 1).padStart(2, "0")}</span>{item.shortTitle}</button>)}</div>
    <div className="assessment-progress"><div><strong>{answered}/{domain.questions.length}</strong> respuestas de este dominio</div><div className="progress-line"><i style={{ width: `${(answered / domain.questions.length) * 100}%` }} /></div></div>
    <div className="maturity-legend"><CircleHelp size={16} /><span><b>Escala del Excel:</b> Nivel 0 a Nivel 5 · Nivel 0 = no existe evidencia de cumplimiento · Nivel 5 = la práctica se realiza completamente y está plenamente optimizada · N/A No aplica</span></div>
    {validationMessage && <div className="validation-alert" role="alert"><CircleAlert size={19} /><div><strong>Completa las preguntas obligatorias</strong><span>{validationMessage}</span></div></div>}
    <div className="questions-stack">{domain.questions.map((question, index) => {
      const answer = answers[question.id];
      const needsAnswer = unansweredIds.includes(question.id);
      return <article className={`question-card ${needsAnswer ? "has-error" : ""}`} key={question.id} aria-invalid={needsAnswer}><div className="question-number">{String(index + 1).padStart(2, "0")}</div><div className="question-main"><p className="question-text">{question.text}</p><p className="question-hint">{question.hint}</p><div className="score-row"><span>Valora la práctica *</span><div className="score-buttons">{maturityLabels.map(item => <button type="button" key={item.value} className={answer.score === item.value && !answer.isNotApplicable ? "selected" : ""} onClick={() => updateAnswer(question.id, { score: item.value, isNotApplicable: false })}><b>{item.value}</b><small>{item.label}</small></button>)}<button type="button" className={answer.isNotApplicable ? "selected na" : "na"} onClick={() => updateAnswer(question.id, { score: null, isNotApplicable: !answer.isNotApplicable })}><b>N/A</b><small>No aplica</small></button></div>{needsAnswer && <span className="question-error">Selecciona un nivel del 0 al 5 o “N/A” para continuar.</span>}</div><details className="question-detail"><summary>Agregar contexto <ChevronRight size={15} /></summary><div className="detail-grid"><div><FieldLabel optional>Prioridad</FieldLabel><select value={answer.priority} onChange={e => updateAnswer(question.id, { priority: e.target.value as Answer["priority"] })}><option value="">Sin especificar</option><option>Alta</option><option>Media</option><option>Baja</option></select></div><div><FieldLabel optional>Responsable / rol</FieldLabel><input value={answer.responsibleRole} onChange={e => updateAnswer(question.id, { responsibleRole: e.target.value })} placeholder="Ej. Dirección, TI, Operaciones" /></div><div><FieldLabel optional>Proceso o sistema afectado</FieldLabel><input value={answer.processSystem} onChange={e => updateAnswer(question.id, { processSystem: e.target.value })} placeholder="Ej. CRM, ventas, facturación" /></div><div className="span-3"><FieldLabel optional>Comentario</FieldLabel><textarea rows={2} value={answer.comments} onChange={e => updateAnswer(question.id, { comments: e.target.value })} placeholder="Evidencia, ejemplo, situación o riesgo que deseas destacar." /></div></div></details></div></article>;
    })}</div>
    <div className="stage-actions"><button className="button button-outline" onClick={onBack}><ArrowLeft size={17} /> Perfil</button>{domainIndex < domains.length - 1 ? <button className="button button-navy" onClick={onNext}>Siguiente dominio <ArrowRight size={17} /></button> : <button className="button button-aqua" onClick={onReview}>Revisar mi diagnóstico <ClipboardCheck size={17} /></button>}</div>
    <button className="review-link" onClick={onReview}>Ya respondí todo · revisar y enviar <ChevronRight size={16} /></button>
  </div>;
}

function ReviewStep({ averageScore, scoreLabel, contact, answers, onSubmit, isSubmitting }: { averageScore: number; scoreLabel: string; contact: ContactForm; answers: Record<string, Answer>; onSubmit: () => void; isSubmitting: boolean }) {
  return <div className="review-stage enter-stage"><div className="stage-head"><p className="eyebrow">PASO 3 DE 3</p><h1>Tu lectura <em>inicial.</em></h1><p>Este resultado orienta la conversación. No es una auditoría, certificación ni opinión legal. Revisa la información; después de ver los resultados no podrás modificarla.</p></div><div className="score-panel"><div><span>Promedio general</span><strong>{averageScore.toFixed(1)}<small>/5</small></strong><em>{scoreLabel}</em></div><p>Al seleccionar “Ver resultados del diagnóstico”, tus respuestas, prioridades y datos de contacto quedarán almacenados para dar seguimiento a la conversación.</p></div><div className="review-grid">{domains.map(domain => { const values = domain.questions.map(question => answers[question.id].score).filter((score): score is number => score !== null); const score = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0; return <div className="review-domain" key={domain.id}><span>{domain.shortTitle}</span><b>{score.toFixed(1)}</b><i><em style={{ width: `${(score / 5) * 100}%` }} /></i></div>; })}</div><div className="review-contact"><h3>Datos de contacto</h3><p><b>{contact.fullName}</b> · {contact.jobTitle} · {contact.companyName}</p><p>{contact.workEmail}{contact.phone ? ` · ${contact.phone}` : ""}</p></div><div className="submit-note"><ShieldCheck size={19} /><span>El botón final guarda la información y muestra tu lectura de resultados de alto nivel.</span></div><div className="stage-actions final-only"><button className="button button-aqua" disabled={isSubmitting} onClick={onSubmit}>{isSubmitting ? "Guardando…" : "Ver resultados del diagnóstico"} <ArrowRight size={17} /></button></div></div>;
}
