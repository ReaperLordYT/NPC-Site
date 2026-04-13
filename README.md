# NPC Championship Tournament Site

## Что изменилось

Проект переведен на Supabase:
- данные хранятся в Postgres;
- админка работает через Supabase Auth (email/password);
- обновления приходят клиентам через Realtime;
- есть бэкапы и откат из админки.

`public/data.json` используется только как исходник для первичной миграции.

## 1) Регистрация и создание проекта Supabase

1. Зарегистрируйся: https://supabase.com
2. Создай новый project.
3. В `Project Settings -> API` скопируй:
   - `Project URL`
   - `anon public key`
4. В `Project Settings -> API` также сохрани `service_role key` (нужен только для скрипта импорта, не для фронта).

## 2) Запуск SQL схемы и RLS

Открой `SQL Editor` в Supabase и выполни файл:

`supabase/migrations/001_initial_schema.sql`

После этого:
- создадутся таблицы `teams`, `players`, `news`, `matches`, `groups`, `site_settings`, `meta_state`, `backups`, `profiles`;
- включатся RLS-политики.

## 3) Создание админа

1. В Supabase -> `Authentication -> Users` создай пользователя (email + password).
2. В `Table Editor -> profiles` добавь строку:
   - `id` = UUID пользователя из `auth.users`
   - `role` = `admin`

Опционально можно использовать allowlist email через env (см. ниже).

## 4) Настройка env во фронте

Создай `.env.local` и добавь:

```bash
VITE_BASE_URL=/NPC-Site/
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_SUPABASE_ADMIN_EMAILS=admin1@mail.com,admin2@mail.com
```

`VITE_SUPABASE_ADMIN_EMAILS` необязателен, это fallback allowlist.

## 5) Первичный импорт текущих данных из data.json

Перед запуском установи переменные окружения для service role:

```bash
set SUPABASE_URL=...
set SUPABASE_SERVICE_ROLE_KEY=...
npm run supabase:import
```

Это загрузит `public/data.json` в таблицы Supabase.

## 6) Локальная проверка

```bash
npm install
npm run dev
```

Проверь:
- вход в `/admin` по email/password;
- редактирование данных;
- открытие второго браузера/вкладки: изменения должны прилетать почти сразу (Realtime).

## 7) Бэкапы и откат

В `Админ-панель`:
- блок `Бэкапы и откат` -> `Создать бэкап`;
- можно выбрать любой snapshot и нажать `Восстановить`.

Рекомендация: делать snapshot перед массовыми правками сетки/матчей.

## 8) Деплой

Для GitHub Pages:
- убедись, что `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY` подставляются в build (через secrets/env CI);
- после deploy проверь сайт в инкогнито.

## Разработка

```bash
npm run dev
```

## Сборка

```bash
npm run build
```
