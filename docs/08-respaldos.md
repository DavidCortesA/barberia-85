# Respaldos · 85 BARBERÍA

Supabase Free **no hace respaldos automáticos**. Este proyecto respalda cada semana con GitHub Actions (`.github/workflows/db-backup.yml`):

- **Base de datos**: roles, esquema y datos (`supabase db dump`).
- **Fotos** del bucket `media` (`scripts/backup-media.mjs`): el volcado de la base no incluye archivos.
- Todo va en un solo archivo **cifrado con AES-256** (`openssl`), guardado como artefacto del workflow durante **90 días**.

> El repositorio es **público**. Sin cifrado, cualquiera con cuenta de GitHub podría descargar nombres y teléfonos de clientes. Nunca subas un respaldo sin cifrar ni guardes la frase en el repositorio.

## Activarlo (una vez)

Necesitas la [CLI de GitHub](https://cli.github.com) con sesión iniciada (`gh auth login`). Cada comando pide el valor sin mostrarlo:

```bash
gh secret set SUPABASE_DB_URL --repo DavidCortesA/barberia-85
```

Valor: `postgresql://postgres.<ref>:<contraseña-de-la-base>@aws-0-us-east-1.pooler.supabase.com:5432/postgres` (la misma contraseña de `SUPABASE_DB_PASSWORD`; si tuviera símbolos, codifícalos en URL).

```bash
gh secret set NEXT_PUBLIC_SUPABASE_URL --repo DavidCortesA/barberia-85
```

```bash
gh secret set SUPABASE_SECRET_KEY --repo DavidCortesA/barberia-85
```

```bash
gh secret set BACKUP_PASSPHRASE --repo DavidCortesA/barberia-85
```

`BACKUP_PASSPHRASE`: una frase larga (16+ caracteres) que guardes **fuera** de GitHub, por ejemplo en tu gestor de contraseñas. **Si se pierde, los respaldos no se pueden abrir.**

Luego pruébalo a mano: GitHub → Actions → *Respaldo semanal* → *Run workflow*, o:

```bash
gh workflow run db-backup.yml --repo DavidCortesA/barberia-85
```

## Restaurar

1. Descarga el artefacto (GitHub → Actions → la ejecución → *Artifacts*) y descomprime el `.zip`.
2. Descifra (pide la frase) y extrae:

   ```bash
   openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -in respaldo-85barberia-AAAA-MM-DD.tar.gz.enc -out respaldo.tar.gz
   ```

   ```bash
   tar xzf respaldo.tar.gz
   ```

3. Restaura en un proyecto de Supabase (idealmente uno **nuevo**; requiere `psql`):

   ```bash
   psql --single-transaction --variable ON_ERROR_STOP=1 --file backup/roles.sql --file backup/schema.sql --command 'SET session_replication_role = replica' --file backup/data.sql --dbname "postgresql://postgres.<ref-nuevo>:<contraseña>@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
   ```

4. Fotos: sube el contenido de `backup/media/` al bucket `media` del proyecto (Supabase → Storage → *Upload*), respetando las carpetas (`content/`, `gallery/`, `services/`, `barbers/`). Si el proyecto nuevo tiene otra URL, actualiza las URL guardadas (`site_content`, `gallery_images`, `services.image_url`, `barbers.image_url`).
5. Actualiza `.env.local` y las variables de Vercel con las claves del proyecto nuevo.

## Probar el script de fotos en local

```bash
node scripts/backup-media.mjs ./respaldo-fotos
```

Descarga todo el bucket con las claves de `.env.local`. Las carpetas `respaldo*` y `backup/` están en `.gitignore`; aun así, bórrala al terminar.
