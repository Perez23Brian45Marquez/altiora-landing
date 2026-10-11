/* Configuración pública de ALTIORA.
 *
 * Aquí van SOLO valores públicos. La clave "anon" (o "publishable") de Supabase está
 * pensada para estar en el frontend: la seguridad la dan las políticas RLS de la base
 * de datos (ver supabase/schema.sql).
 *
 * NUNCA pegues aquí la clave "service_role" / "secret": da acceso total a tu base de datos.
 */
window.ALTIORA_CONFIG = {
  // Settings → API en tu proyecto de Supabase
  SUPABASE_URL: 'https://yskjstothrweucvutnin.supabase.co',        // ej. 'https://abcdefgh.supabase.co'
  SUPABASE_ANON_KEY: 'sb_publishable_qMDQY8lLgH6AJNO3UUoJMg_mSKvSozP',   // clave pública (anon / publishable)
  TABLE: 'inscritos_beta'
};
