# ALTIORA — Landing page (puntos 9 y 10)

Landing estática en HTML + CSS + JavaScript puro. Frontend en **Vercel**, backend en **Supabase** (tabla única en FN0).

```
altiora-landing/
├── index.html            # Página (HTML semántico + meta SEO + Google Analytics)
├── styles.css
├── app.js                # Animaciones, pestañas, validación y envío del formulario
├── config.js             # URL y clave PÚBLICA de Supabase (aquí editas tú)
├── vercel.json           # Cabeceras de seguridad y caché
├── robots.txt
├── assets/               # Wireframes (JPG) y favicon
└── supabase/schema.sql   # Tabla FN0 + permisos (RLS)
```

## Paso 1 · Crear la base de datos en Supabase

1. Entra a [supabase.com](https://supabase.com) → **New project** (guarda la contraseña de la base de datos).
2. Abre **SQL Editor → New query**, pega todo el contenido de `supabase/schema.sql` y pulsa **Run**.
   Esto crea la tabla `inscritos_beta`, activa RLS y deja que el público **solo pueda insertar**.
3. Ve a **Project Settings → API** y copia:
   - **Project URL**
   - **anon / publishable key** (la clave pública)

> No copies la clave `service_role` / `secret` en ningún archivo del proyecto. Esa clave da control total de la base de datos.

## Paso 2 · Conectar el formulario

Edita `config.js`:

```js
window.ALTIORA_CONFIG = {
  SUPABASE_URL: 'https://TU-PROYECTO.supabase.co',
  SUPABASE_ANON_KEY: 'TU_CLAVE_ANON_PUBLICA',
  TABLE: 'inscritos_beta'
};
```

Mientras estas dos variables estén vacías, el formulario funciona en **modo demostración** (muestra éxito pero **no guarda nada**, y lo avisa en el mensaje).

## Paso 3 · Probar en tu computadora

```bash
cd altiora-landing
python -m http.server 8000     # o: npx serve
```

Abre http://localhost:8000, llena el formulario y revisa **Table Editor → inscritos_beta** en Supabase.

## Paso 4 · Publicar en Vercel

1. Sube la carpeta a un repositorio de GitHub.
2. En [vercel.com](https://vercel.com) → **Add New → Project** → importa el repositorio.
3. **Framework Preset: Other**. Deja vacíos *Build Command* y *Output Directory* (es un sitio estático).
4. **Deploy**. Vercel te da una URL pública tipo `https://altiora-xxxx.vercel.app`.

(Alternativa sin GitHub: instala la CLI con `npm i -g vercel` y ejecuta `vercel --prod` dentro de la carpeta.)

## Paso 5 · Google Analytics

Crea una propiedad GA4, copia el **ID de medición** (`G-XXXXXXXXXX`) y reemplázalo en los dos lugares de `index.html` donde aparece. La página ya envía eventos: `cta_hero`, `ver_wireframe`, `inicio_formulario`, `inscripcion_beta`, `error_validacion_formulario` y `error_envio_formulario`.

## Evidencias que pide el punto 10

| Qué piden | Cómo conseguirlo |
|---|---|
| URL pública | La URL de Vercel (Paso 4). |
| Estructura de la tabla | Captura de **Table Editor → inscritos_beta → columnas**, o el resultado de la consulta (a) al final de `schema.sql`. |
| Inscripción desde la URL pública que se guarda | Llena el formulario en la URL de Vercel con datos de prueba (ej. `Prueba Uno`, `prueba1@correo.com`) y captura **Table Editor** mostrando la fila nueva. |
| Permisos: se puede registrar, no leer | Captura de **Authentication → Policies** (solo política INSERT) y la prueba de abajo. |
| Sin claves privilegiadas en el frontend | En `config.js` solo está la clave anon. |

### Prueba de que el público NO puede leer los datos

Con la clave pública (anon), intentar leer debe fallar. Ejecuta (cambiando tus valores):

```bash
curl "https://TU-PROYECTO.supabase.co/rest/v1/inscritos_beta?select=*" \
  -H "apikey: TU_CLAVE_ANON" -H "Authorization: Bearer TU_CLAVE_ANON"
```

Resultado esperado: un error de permiso denegado (`42501`) o una lista vacía `[]`, **nunca** los datos de los inscritos. Haz una captura para el informe.

Y la prueba de que sí puede insertar:

```bash
curl -X POST "https://TU-PROYECTO.supabase.co/rest/v1/inscritos_beta" \
  -H "apikey: TU_CLAVE_ANON" -H "Authorization: Bearer TU_CLAVE_ANON" \
  -H "Content-Type: application/json" -H "Prefer: return=minimal" \
  -d '{"nombre":"Prueba Curl","correo":"curl@correo.com","perfil":"Otro","necesidad":"Probar que el insert funciona","interes":"Reportes","acepta_contacto":true}'
```

Resultado esperado: respuesta vacía con código `201`.

## Notas de seguridad

- La clave `anon` es pública por diseño; lo que protege los datos son las políticas RLS de `schema.sql`.
- Las validaciones del formulario también existen en la base de datos (restricciones `check`), así que no se pueden saltar desde el navegador.
- Los correos duplicados se rechazan (índice único) y la página muestra un mensaje claro.
- Para un lanzamiento comercial real faltarían: política de privacidad publicada, límite de envíos por IP (por ejemplo con una Edge Function) y revisión legal, tal como indica tu sección de viabilidad.
