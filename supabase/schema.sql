-- =====================================================================
-- ALTIORA · Punto 10 — Tabla de inscritos a la beta (FN0, sin normalizar)
-- Ejecutar en Supabase: SQL Editor → New query → pegar → Run
-- =====================================================================

-- 1) Tabla única en FN0: todos los datos del inscrito en una sola fila.
create table if not exists public.inscritos_beta (
  id                bigint generated always as identity primary key,
  nombre            text        not null,
  correo            text        not null,
  perfil            text        not null,   -- perfil del inscrito (propietario, encargado, etc.)
  negocio           text,                   -- negocio o empresa (opcional)
  necesidad         text        not null,   -- qué quiere resolver
  interes           text        not null,   -- función que más le interesa
  acepta_contacto   boolean     not null,   -- consentimiento para contactarlo
  fecha_inscripcion timestamptz not null default now(),  -- la asigna el servidor

  -- Validaciones en el servidor (no dependen del navegador)
  constraint nombre_largo    check (char_length(btrim(nombre)) between 3 and 80),
  constraint correo_formato  check (correo ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' and char_length(correo) <= 120),
  constraint perfil_largo    check (char_length(perfil) between 1 and 80),
  constraint negocio_largo   check (negocio is null or char_length(negocio) <= 80),
  constraint necesidad_largo check (char_length(btrim(necesidad)) between 10 and 500),
  constraint interes_largo   check (char_length(interes) between 1 and 80),
  constraint consentimiento  check (acepta_contacto = true)
);

comment on table public.inscritos_beta is 'Inscritos a la beta de ALTIORA. Tabla única en FN0 (sin normalizar).';

-- Un mismo correo no puede inscribirse dos veces (sin distinguir mayúsculas).
create unique index if not exists inscritos_beta_correo_unico
  on public.inscritos_beta (lower(correo));

-- 2) Seguridad a nivel de fila (RLS): activada.
alter table public.inscritos_beta enable row level security;

-- 3) Permisos: el público (rol anon) SOLO puede insertar. No puede leer, editar ni borrar.
revoke all on public.inscritos_beta from anon, authenticated;
grant insert on public.inscritos_beta to anon;

-- 4) Política: cualquiera puede registrarse (INSERT). No se crea ninguna política
--    de SELECT, así que nadie desde el frontend puede ver los datos de otras personas.
drop policy if exists "Cualquiera puede inscribirse" on public.inscritos_beta;
create policy "Cualquiera puede inscribirse"
  on public.inscritos_beta
  for insert
  to anon
  with check (acepta_contacto = true);

-- =====================================================================
-- Verificación rápida (ejecútala después, como evidencia para tu informe)
-- =====================================================================
-- a) Columnas de la tabla:
--    select column_name, data_type, is_nullable
--    from information_schema.columns
--    where table_schema = 'public' and table_name = 'inscritos_beta'
--    order by ordinal_position;
--
-- b) Políticas activas (debe verse solo la de INSERT):
--    select policyname, cmd, roles from pg_policies where tablename = 'inscritos_beta';
--
-- c) Tus inscritos (esto SÍ lo ves tú en el panel de Supabase, porque usas tu cuenta de administrador):
--    select * from public.inscritos_beta order by fecha_inscripcion desc;
