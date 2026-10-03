ALTER TABLE public.custom_apps
  ADD COLUMN IF NOT EXISTS windows_app_id TEXT,
  ADD COLUMN IF NOT EXISTS windows_process_name TEXT;

ALTER TABLE public.custom_apps DROP CONSTRAINT IF EXISTS custom_apps_windows_identifiers;
ALTER TABLE public.custom_apps ADD CONSTRAINT custom_apps_windows_identifiers CHECK (
  (windows_app_id IS NULL OR (
    char_length(windows_app_id) BETWEEN 1 AND 255 AND
    btrim(windows_app_id) <> '' AND
    windows_app_id !~ '[[:cntrl:]]'
  )) AND
  (windows_process_name IS NULL OR (
    windows_process_name ~ '^[A-Za-z0-9][A-Za-z0-9 ._-]{0,99}$' AND
    windows_process_name !~ '[[:cntrl:]]' AND
    strpos(windows_process_name, '..') = 0 AND
    windows_process_name !~* '[.]exe$'
  ))
);
