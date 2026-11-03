// Aviso de Privacidad Integral, versión 1.0 (3-nov-2026). Mantener en sintonía con
// PRIVACY_NOTICE_VERSION del despliegue: cada registro guarda la versión aceptada.
const CONTACT = "celso.sanchez@sdggroup.com";

export default function PrivacyNotice() {
  return (
    <main className="privacy-page">
      <a className="back" href="/">
        ← Volver al autodiagnóstico
      </a>
      <h1>Aviso de Privacidad Integral</h1>
      <p className="meta">
        Última actualización: 3 de noviembre de 2026 · Versión 1.0
      </p>

      <h2>1. Identidad y domicilio del responsable</h2>
      <p>
        Optimissa Capital Markets («Optimissa»), con domicilio en Avenida
        Chapultepec 480, piso 10, Col. Roma Norte, C.P. 06700, Ciudad de México,
        México, es responsable del tratamiento de los datos personales que usted
        proporcione en el Autodiagnóstico de Gobierno de Datos (el «sitio»).
      </p>
      <p>
        <b>Contacto de privacidad:</b> Celso Sánchez ·{" "}
        <a href={`mailto:${CONTACT}`}>{CONTACT}</a>. Es la persona designada
        para atender dudas sobre este aviso y solicitudes de derechos.
      </p>

      <h2>2. Datos personales que tratamos</h2>
      <ul>
        <li>
          <b>Identificación y contacto:</b> nombre completo, puesto, área,
          correo electrónico laboral, teléfono y canal de contacto preferido.
        </li>
        <li>
          <b>Laborales y de la empresa:</b> empresa, razón social, sitio web,
          sector, tamaño, estado y ciudad, y su rol en la decisión de compra.
        </li>
        <li>
          <b>Respuestas del diagnóstico:</b> sus calificaciones a 46 preguntas,
          la preocupación principal, impacto, urgencia y proyectos próximos.
        </li>
        <li>
          <b>Datos de terceros (opcional):</b> nombre, puesto, área, correo,
          teléfono y responsabilidad de hasta tres interlocutores de su empresa.
        </li>
        <li>
          <b>Datos técnicos:</b> dirección IP y fecha y hora de envío. Se usan
          solo para seguridad y prevención de abuso, y la IP permanece en los
          registros técnicos del servidor hasta 30 días.
        </li>
      </ul>
      <p>
        <b>No solicitamos datos personales sensibles.</b> Le pedimos no
        incluirlos en los campos de texto libre (por ejemplo, «datos críticos» o
        «preocupación principal»).
      </p>
      <p>
        Si registra datos de interlocutores, usted declara que les informó de
        este aviso y que cuenta con su autorización para compartirlos.
      </p>

      <h2>3. Finalidades</h2>
      <p>
        <b>Finalidades primarias (necesarias para el servicio):</b>
      </p>
      <ol>
        <li>Generar y mostrarle el resultado de su autodiagnóstico.</li>
        <li>
          Contactarle, a usted o a los interlocutores que registre, para dar
          seguimiento a ese diagnóstico y a la necesidad que describió.
        </li>
        <li>
          Registrar internamente el seguimiento comercial de su solicitud.
        </li>
        <li>
          Proteger el sitio contra abuso y atender requerimientos de autoridad.
        </li>
      </ol>
      <p>
        <b>Finalidades secundarias (puede negarse):</b>
      </p>
      <ol>
        <li>
          Enviarle contenidos, invitaciones a eventos y propuestas de servicios
          de gobierno de datos no relacionados con este diagnóstico.
        </li>
        <li>
          Elaborar estadísticas agregadas sobre madurez de gobierno de datos.
          Las estadísticas no identifican a personas ni empresas.
        </li>
      </ol>
      <p>
        Para negarse a las finalidades secundarias, deje sin marcar la casilla
        opcional del formulario o escriba a{" "}
        <a href={`mailto:${CONTACT}`}>{CONTACT}</a> con el asunto «No deseo
        finalidades secundarias». Negarse no afecta el servicio de diagnóstico.
      </p>

      <h2>4. Con quién compartimos sus datos</h2>
      <ul>
        <li>
          <b>Encargados:</b> Google Cloud aloja el sitio y la base de datos en
          su región de Querétaro, México. Trata los datos solo por cuenta de
          Optimissa y bajo sus instrucciones.
        </li>
        <li>
          <b>Transferencias:</b> podemos compartir sus datos, para su atención y
          seguimiento comercial, con empresas controladoras, subsidiarias o
          afiliadas de Optimissa dentro del mismo grupo SDG Group, que operan
          bajo las mismas políticas de privacidad. No compartimos sus datos con
          terceros ajenos al grupo. También podemos entregar datos a autoridades
          competentes cuando la ley lo exija.
        </li>
      </ul>

      <h2>5. Derechos ARCO y revocación del consentimiento</h2>
      <p>
        Usted puede acceder a sus datos, rectificarlos, cancelarlos u oponerse a
        su tratamiento (derechos ARCO), así como revocar su consentimiento.
        Envíe su solicitud a <a href={`mailto:${CONTACT}`}>{CONTACT}</a> con:
      </p>
      <ol>
        <li>Su nombre y un correo para responderle.</li>
        <li>
          Copia de una identificación oficial o, en su caso, documentos de su
          representante.
        </li>
        <li>
          Descripción clara del derecho que ejerce y de los datos involucrados.
        </li>
      </ol>
      <p>
        Le responderemos en un máximo de 20 días hábiles desde que recibamos su
        solicitud. Si procede, la medida se aplicará dentro de los 15 días
        hábiles siguientes a la respuesta. Ambos plazos pueden ampliarse una
        sola vez por un periodo igual cuando las circunstancias lo justifiquen.
      </p>

      <h2>6. Opciones para limitar el uso o divulgación</h2>
      <p>
        Puede pedir en cualquier momento que dejemos de contactarle, escribiendo
        al mismo correo. Le registraremos para no volver a contactarle.
      </p>

      <h2>7. Conservación</h2>
      <p>
        Conservamos sus datos hasta 24 meses después del último contacto, salvo
        que se convierta en cliente o la ley exija conservarlos más tiempo.
        Después se eliminan o se anonimizan.
      </p>

      <h2>8. Cookies y tecnologías similares</h2>
      <p>
        El sitio público no usa cookies de publicidad ni de analítica de
        terceros. Solo usa almacenamiento técnico del navegador (por ejemplo, la
        preferencia de tema claro u oscuro).
      </p>

      <h2>9. Cambios a este aviso</h2>
      <p>
        Cualquier cambio se publicará en esta misma página con su nueva fecha y
        versión.
      </p>

      <h2>10. Autoridad</h2>
      <p>
        Si considera que su derecho a la protección de datos fue vulnerado,
        puede acudir ante la Secretaría Anticorrupción y Buen Gobierno,
        autoridad en la materia conforme a la LFPDPPP.
      </p>
    </main>
  );
}
