/* ALTIORA landing — animaciones, menú, pestañas del prototipo y formulario de inscripción a la beta */
(function () {
  'use strict';

  var CFG = window.ALTIORA_CONFIG || {};
  var SUPABASE_URL = (CFG.SUPABASE_URL || '').replace(/\/+$/, '');
  var SUPABASE_ANON_KEY = CFG.SUPABASE_ANON_KEY || '';
  var TABLE = CFG.TABLE || 'inscritos_beta';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Analítica (no falla si GA no está cargado) ---------- */
  function track(name, params) {
    try { if (typeof gtag === 'function') gtag('event', name, params || {}); } catch (_) { /* noop */ }
  }
  document.querySelectorAll('[data-track]').forEach(function (el) {
    el.addEventListener('click', function () { track(el.getAttribute('data-track')); });
  });

  /* ---------- Menú móvil ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('menu');
  toggle.addEventListener('click', function () {
    var open = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------- Barra de progreso de lectura ---------- */
  var bar = document.getElementById('progress-bar');
  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Aparición al hacer scroll ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  // Retraso escalonado entre tarjetas hermanas
  revealEls.forEach(function (el) {
    var siblings = el.parentElement ? Array.prototype.filter.call(el.parentElement.children, function (c) { return c.classList.contains('reveal'); }) : [];
    var idx = siblings.indexOf(el);
    if (siblings.length > 1 && idx > 0) el.style.setProperty('--d', (idx * 0.09).toFixed(2) + 's');
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Palabra rotativa del hero ---------- */
  var rot = document.getElementById('rotator');
  if (rot && !reduceMotion) {
    var words = (rot.getAttribute('data-words') || '').split('|').filter(Boolean);
    var wi = 0;
    if (words.length > 1) {
      setInterval(function () {
        rot.classList.add('is-out');
        setTimeout(function () {
          wi = (wi + 1) % words.length;
          rot.textContent = words[wi];
          rot.classList.remove('is-out');
        }, 260);
      }, 2400);
    }
  }

  /* ---------- Inclinación 3D suave de la imagen del hero (solo con mouse) ---------- */
  var tilt = document.getElementById('tilt');
  if (tilt && !reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var wrap = tilt.parentElement;
    wrap.addEventListener('mousemove', function (e) {
      var r = wrap.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform = 'perspective(900px) rotateY(' + (x * 8).toFixed(2) + 'deg) rotateX(' + (-y * 8).toFixed(2) + 'deg)';
    });
    wrap.addEventListener('mouseleave', function () { tilt.style.transform = ''; });
  }

  /* ---------- Botón fijo "Unirme a la beta" en móvil ---------- */
  var sticky = document.getElementById('sticky-cta');
  var hero = document.getElementById('inicio');
  var betaSection = document.getElementById('beta');
  if (sticky && hero && betaSection && 'IntersectionObserver' in window) {
    var heroOut = false, betaIn = false;
    function updateSticky() { sticky.classList.toggle('is-visible', heroOut && !betaIn); }
    new IntersectionObserver(function (e) { heroOut = !e[0].isIntersecting; updateSticky(); }, { threshold: 0.05 }).observe(hero);
    new IntersectionObserver(function (e) { betaIn = e[0].isIntersecting; updateSticky(); }, { threshold: 0.1 }).observe(betaSection);
  }

  /* ---------- Pestañas del prototipo ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  function selectTab(tab, userInitiated) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (userInitiated) { tab.focus({ preventScroll: true }); track('ver_wireframe', { pantalla: tab.id }); }
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab, true); });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (next) { e.preventDefault(); selectTab(next, true); }
    });
  });

  /* ---------- Formulario ---------- */
  var form = document.getElementById('beta-form');
  var statusBox = document.getElementById('form-status');
  var submitBtn = document.getElementById('submit-btn');
  var btnLabel = submitBtn.querySelector('.btn-label');
  var necesidad = document.getElementById('necesidad');
  var counter = document.getElementById('necesidad-count');
  var started = false;

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var NAME_RE = /^[\p{L}][\p{L}\s'.-]{2,}$/u;

  var validators = {
    nombre: function (v) {
      v = v.trim();
      if (!v) return 'Escribe tu nombre completo.';
      if (v.length < 3) return 'El nombre debe tener al menos 3 caracteres.';
      if (!NAME_RE.test(v)) return 'Usa solo letras y espacios en el nombre.';
      return '';
    },
    correo: function (v) {
      v = v.trim();
      if (!v) return 'Escribe tu correo electrónico.';
      if (!EMAIL_RE.test(v)) return 'Ingresa un correo válido, por ejemplo tu@correo.com.';
      return '';
    },
    perfil: function (v) { return v ? '' : 'Selecciona tu perfil.'; },
    negocio: function (v) { return v.trim().length > 80 ? 'Máximo 80 caracteres.' : ''; },
    necesidad: function (v) {
      v = v.trim();
      if (!v) return 'Cuéntanos qué te gustaría resolver.';
      if (v.length < 10) return 'Escribe al menos 10 caracteres (' + v.length + '/10).';
      if (v.length > 500) return 'Máximo 500 caracteres.';
      return '';
    },
    interes: function (v) { return v ? '' : 'Selecciona la función que más te interesa.'; },
    consentimiento: function (_v, el) { return el.checked ? '' : 'Debes aceptar para poder inscribirte.'; }
  };

  function validateField(el) {
    var rule = validators[el.name];
    if (!rule) return true;
    var msg = rule(el.value, el);
    var errEl = document.getElementById(el.id + '-error');
    if (errEl) errEl.textContent = msg;
    if (el.type !== 'checkbox') {
      el.classList.toggle('is-invalid', !!msg);
      el.classList.toggle('is-valid', !msg && el.value.trim() !== '');
    }
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }

  var fields = Array.prototype.slice.call(form.querySelectorAll('input, select, textarea'))
    .filter(function (el) { return validators[el.name]; });

  fields.forEach(function (el) {
    var evt = (el.tagName === 'SELECT' || el.type === 'checkbox') ? 'change' : 'blur';
    el.addEventListener(evt, function () { validateField(el); });
    el.addEventListener('input', function () {
      if (!started) { started = true; track('inicio_formulario'); }
      if (el.classList.contains('is-invalid')) validateField(el);
    });
  });

  necesidad.addEventListener('input', function () {
    counter.textContent = necesidad.value.length + ' / 500';
  });

  function showStatus(type, text) {
    statusBox.hidden = false;
    statusBox.className = 'status ' + (type === 'ok' ? 'status-ok' : 'status-err');
    statusBox.textContent = text;
    statusBox.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
  }

  function setLoading(on) {
    submitBtn.disabled = on;
    submitBtn.classList.toggle('is-loading', on);
    btnLabel.textContent = on ? 'Enviando…' : 'Inscribirme a la beta';
  }

  // La fecha de inscripción NO se envía: la asigna la base de datos (default now()),
  // así nadie puede falsearla desde el navegador.
  function buildPayload() {
    return {
      nombre: form.nombre.value.trim(),
      correo: form.correo.value.trim().toLowerCase(),
      perfil: form.perfil.value,
      negocio: form.negocio.value.trim() || null,
      necesidad: form.necesidad.value.trim(),
      interes: form.interes.value,
      acepta_contacto: form.consentimiento.checked
    };
  }

  /* Envía la inscripción por la API REST de Supabase (INSERT).
   * La política RLS permite INSERT al rol anon y bloquea cualquier lectura.
   * "return=minimal" es necesario: anon no puede leer la fila que acaba de insertar.
   * Si Supabase no está configurado, trabaja en modo demostración (no guarda nada). */
  function sendRegistration(payload) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('[ALTIORA] Modo demostración: Supabase no está configurado (config.js). La inscripción NO se guardó.', payload);
      return new Promise(function (resolve) { setTimeout(function () { resolve({ demo: true }); }, 800); });
    }
    return fetch(SUPABASE_URL + '/rest/v1/' + encodeURIComponent(TABLE), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (res.status === 409) { var dup = new Error('duplicado'); dup.code = 'duplicate'; throw dup; }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return { demo: false };
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    statusBox.hidden = true;

    // Anti-spam: si el campo trampa tiene contenido, se ignora el envío en silencio.
    if (form.sitio_web.value) return;

    var firstInvalid = null;
    fields.forEach(function (el) {
      var ok = validateField(el);
      if (!ok && !firstInvalid) firstInvalid = el;
    });
    if (firstInvalid) {
      showStatus('err', 'Revisa los campos marcados en rojo e inténtalo de nuevo.');
      firstInvalid.focus();
      track('error_validacion_formulario');
      return;
    }

    var payload = buildPayload();
    setLoading(true);
    sendRegistration(payload)
      .then(function (result) {
        form.reset();
        counter.textContent = '0 / 500';
        fields.forEach(function (el) { el.classList.remove('is-valid', 'is-invalid'); el.removeAttribute('aria-invalid'); });
        var msg = '¡Listo! Te inscribiste a la beta de ALTIORA. Pronto te escribiremos al correo que registraste. ¡Gracias por sumarte!';
        if (result && result.demo) msg += ' (Modo demostración: la base de datos aún no está conectada.)';
        showStatus('ok', msg);
        track('inscripcion_beta', { perfil: payload.perfil, interes: payload.interes });
      })
      .catch(function (err) {
        if (err && err.code === 'duplicate') {
          showStatus('err', 'Ese correo ya está inscrito en la beta. Si crees que es un error, prueba con otro correo.');
        } else {
          showStatus('err', 'No pudimos registrar tu inscripción. Revisa tu conexión a internet e inténtalo otra vez en unos minutos.');
        }
        track('error_envio_formulario');
      })
      .then(function () { setLoading(false); });
  });
  /* ---------- Verificar estado de suscripción (PUT) ---------- */
  var btnVerificar = document.getElementById('btn-verificar');
  var statusResultado = document.getElementById('status-resultado');
  var emailInput = document.getElementById('verificar-correo');

  // ⚠️ IMPORTANTE: Reemplazá esta URL por la de tu Dev Tunnel de Visual Studio
  var DEV_TUNNEL_URL = "https://kvjrd2pg-7000.brs.devtunnels.ms"; 

  if (btnVerificar) {
    btnVerificar.addEventListener('click', function() {
      var correo = emailInput.value.trim();
      if(!correo) {
        alert("Por favor, ingresa tu correo.");
        return;
      }

      statusResultado.style.display = 'block';
      statusResultado.style.backgroundColor = '#fff3cd';
      statusResultado.style.color = '#856404';
      statusResultado.textContent = 'Estado antes: Inscrita (Verificando en el sistema...)';

      fetch(DEV_TUNNEL_URL + '/api/suscripciones/estado', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ CorreoElectronico: correo, NuevoEstado: 'Atendida' })
      })
      .then(function(res) {
        return res.json().then(function(data) { return { status: res.status, body: data }; });
      })
      .then(function(res) {
        if (res.status === 200) {
          statusResultado.style.backgroundColor = '#d4edda';
          statusResultado.style.color = '#155724';
          statusResultado.textContent = 'Estado después: Atendida. ¡Pronto te contactaremos para activar tu cuenta!';
        } else {
          statusResultado.style.backgroundColor = '#f8d7da';
          statusResultado.style.color = '#721c24';
          statusResultado.textContent = 'Error: ' + (res.body.error || 'No se pudo actualizar');
        }
      })
      .catch(function(err) {
        statusResultado.style.backgroundColor = '#f8d7da';
        statusResultado.style.color = '#721c24';
        statusResultado.textContent = 'Error de red. Verifica que el túnel esté activo.';
      });
    });
  }
})();
