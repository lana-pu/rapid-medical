# Хранилище файлов — upload, защищённая отдача (signed URLs), картинки, HLS-видео

Запускай, когда продукт хранит пользовательские файлы (аватары, лого, фото, документы, видео). Если конкретных файлов в спеке пока нет — всё равно подними базовое хранилище под аватар пользователя.

Нужно на входе: auth с сессиями (`auth-setup.md`) и БД с ORM (`db-schema-migrations-seed.md`); для MinIO — VPS с docker-compose.

Стек по умолчанию: S3-совместимое хранилище через `@aws-sdk/client-s3`, Prisma, Next.js. Другой стек — адаптируй.

Прочитай `docs/spec.md` и составь список того, что загружают пользователи (типы, размеры, приватность).

## Архитектура
```
Browser → POST /api/files/upload → S3-совместимое хранилище → запись (key) в БД
                                        ↓
               GET /api/files/... → проверка владельца → signed URL / CDN
```

## Выбор хранилища
Все варианты — S3-совместимые за одним API; переключение = смена четырёх env (`STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `STORAGE_BUCKET`), код не меняется.

| Вариант | Когда |
|---|---|
| **MinIO на своём VPS** | дефолт: рядом в docker-compose, данные под контролем и в нужной юрисдикции |
| **Managed S3 провайдера** (Yandex Object Storage, Selectel, VK Cloud, Timeweb для РФ; AWS S3 / Cloudflare R2 за рубежом) | не хочется держать файлы на VPS (диск/RAM маленького бокса быстро кончаются) или нужна managed-надёжность; платится за ГБ и трафик |
| **Bunny** | нужен CDN для отдачи (видео, картинки) |

Учитывай доступность сервиса для аудитории: Cloudflare R2 / AWS S3 из РФ часто недоступны или нестабильны (блокировки, оплата).

Если по спеке файлов будет много и они тяжёлые (видео, большие галереи, архивы) — бери managed S3 (а под видео ещё и CDN) сразу, а не MinIO: на росте MinIO упрётся в память и диск, и переезжать придётся под нагрузкой. Для обычного случая (аватары, лого, единичные вложения) — MinIO.

Отдавай файлы через основной домен роутами приложения (`/api/files/...`) с проверкой владельца. Отдельный поддомен под хранилище (`storage.<домен>`) по умолчанию не настраивай — упомяни как опцию (DNS + nginx; пригодится под CDN).

## 1. Модель File — первой
```prisma
model File {
  id           String   @id @default(cuid())
  key          String   @unique          // путь файла в хранилище
  originalName String
  size         Int
  contentType  String
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now())
  @@index([userId])
}
```
Если файл — аватар, в той же миграции добавь `avatarUrl String?` в `User`. `npx prisma migrate dev --name add-files`; на проде применится через `migrate deploy` в `deploy.sh`.

## 2a. MinIO — поднять в docker-compose (автоматически, без веб-консоли)
```yaml
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${STORAGE_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${STORAGE_SECRET_KEY}
    volumes:
      - minio_data:/data
    ports:
      - "127.0.0.1:9000:9000"      # API — только 127.0.0.1, наружу закрыт
      - "127.0.0.1:9001:9001"      # консоль — только 127.0.0.1
    restart: unless-stopped
    mem_limit: 512m                # обязателен: MinIO кэширует в RAM

  minio-init:                       # создаёт бакет при старте
    image: minio/mc
    depends_on: [minio]
    environment:
      STORAGE_ACCESS_KEY: ${STORAGE_ACCESS_KEY}
      STORAGE_SECRET_KEY: ${STORAGE_SECRET_KEY}
      STORAGE_BUCKET: ${STORAGE_BUCKET}
    entrypoint: >
      /bin/sh -c "
      mc alias set local http://minio:9000 $$STORAGE_ACCESS_KEY $$STORAGE_SECRET_KEY &&
      mc mb -p local/$$STORAGE_BUCKET"

volumes:
  minio_data:
```
Приложение ходит в MinIO по внутреннему адресу `STORAGE_ENDPOINT=http://minio:9000`. Ключи генерируешь сам (надёжные строки), имя бакета — любое; пользователю ничего вписывать не нужно.

Память: на боксе 1 ГБ web (~512m) + Postgres (256m) + MinIO (512m) — почти весь объём, нужен swap (`vm.swappiness=10`). Слишком низкий лимит → OOM-kill контейнера. Если MinIO упирается в память — выноси файлы в managed S3 / Bunny или бери VPS 2 ГБ+, а не занижай лимит.

## 2b. Managed S3 — MinIO не поднимаем
- В docker-compose не добавляй `minio` / `minio-init` / `minio_data`.
- Бакет создаёт пользователь в кабинете провайдера (или ты через `aws s3 mb` / `mc mb`, если есть CLI с ключами).
- `STORAGE_ENDPOINT` — S3-endpoint провайдера (напр. `https://storage.yandexcloud.net`), ключи и бакет — из кабинета.
- Код (upload, signed URLs, deploy) не меняется.

## 3. Ключи в env
Для MinIO заполняешь сам. Для внешнего провайдера создай/дополни `.env.local` и `.env.production` плейсхолдерами:
```
STORAGE_ENDPOINT=впиши-сюда-endpoint-хранилища
STORAGE_ACCESS_KEY=впиши-сюда-access-key
STORAGE_SECRET_KEY=впиши-сюда-secret-key
STORAGE_BUCKET=впиши-сюда-имя-бакета
```
Скажи пользователю открыть файл и вписать значения после `=` — не в чат и не в терминал; ты читаешь их только через `process.env`. Проверь, что `.env.*` в `.gitignore`.

## 4. Upload endpoint — `src/app/api/files/upload/route.ts`
```ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  endpoint: process.env.STORAGE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY!,
    secretAccessKey: process.env.STORAGE_SECRET_KEY!,
  },
  region: 'auto',
  forcePathStyle: true,   // нужно для MinIO
})

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']   // whitelist из спеки
const MAX_SIZE = 10 * 1024 * 1024

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })

  const file = (await req.formData()).get('file') as File | null
  if (!file) return Response.json({ error: 'no_file' }, { status: 400 })
  if (file.size > MAX_SIZE) return Response.json({ error: 'too_large' }, { status: 400 })
  if (!ALLOWED.includes(file.type)) return Response.json({ error: 'bad_type' }, { status: 400 })

  const key = `uploads/${session.user.id}/${crypto.randomUUID()}`   // не оригинальное имя
  await s3.send(new PutObjectCommand({
    Bucket: process.env.STORAGE_BUCKET, Key: key,
    Body: Buffer.from(await file.arrayBuffer()), ContentType: file.type,
  }))

  await db.file.create({
    data: { userId: session.user.id, key, originalName: file.name, size: file.size, contentType: file.type },
  })
  return Response.json({ key })
}
```

## 5. Защищённая отдача — signed URLs
Для приватных файлов:
```ts
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'unauthorized' }, { status: 401 })
  const file = await db.file.findUnique({ where: { id: params.id } })
  if (!file || (file.userId !== session.user.id && session.user.role !== 'ADMIN')) {
    return Response.json({ error: 'not_found' }, { status: 404 })
  }
  const url = await getSignedUrl(s3, new GetObjectCommand({
    Bucket: process.env.STORAGE_BUCKET, Key: file.key,
  }), { expiresIn: 3600 })
  return Response.redirect(url)
}
```
Signed URL должен быть доступен браузеру: если endpoint внутренний (`http://minio:9000`), отдавай файл стримом через роут приложения или подписывай публичным адресом хранилища. Публичные файлы — прямой URL через CDN.

## 6. UI загрузки — `src/features/file-upload/ui/FileUpload.tsx`
Drag-and-drop зона, прогресс-бар, превью картинок, toast после успеха, понятные ошибки (размер, тип). Компоненты — из UI-кита.

## 7. Картинки
Отображение через `next/image` (WebP, lazy loading, responsive); домен/роут хранилища добавь в `images.remotePatterns`.

## 8. HLS-видео (если в продукте есть видео)
Варианты конвертации: Bunny Stream (проще всего: mp4 → `.m3u8`); AWS MediaConvert + S3; свой ffmpeg-воркер. Плеер — `hls.js`:
```ts
import Hls from 'hls.js'
const hls = new Hls()
hls.loadSource(playlistUrl)
hls.attachMedia(videoElement)
```
Защита видео — signed URLs на playlist.

## 9. Безопасность
- Лимит размера на запрос (напр. 10 МБ) и квота на пользователя (напр. 1 ГБ).
- Типы — whitelist (`image/*`, `video/mp4`, `application/pdf`), не blacklist; проверяй и реальное содержимое (magic bytes), не только `Content-Type`.
- Ключ — UUID, не оригинальное имя файла.
- Для пользовательского контента — по необходимости антивирус (ClamAV или сервис).

## После реализации
1. Покажи загрузку в UI.
2. Проверь отдачу: чужой приватный файл под другим аккаунтом → 404.
3. В `docs/spec.md` — лимиты и поддерживаемые типы файлов.
4. ADR в `docs/memory/decisions/`: выбор хранилища, лимиты, политика приватности.
5. `docs/memory/infrastructure.md` — раздел «Хранилище»: сервис, endpoint, бакет, ENV, volume.
