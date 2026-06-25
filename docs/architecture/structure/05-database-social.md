# Схема базы данных — Документы, Голосования, Общение

## File — Файл

Общее хранилище бинарных файлов в PostgreSQL (bytea).

```prisma
model File {
  id           String    @id @default(cuid())
  originalName String
  mimeType     String
  size         Int
  content      Bytes     @db.Bytes
  isDeleted    Boolean   @default(false)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  documents    Document[]

  @@map("files")
}
```

## Document — Документ

```prisma
model Document {
  id           String     @id @default(cuid())
  title        String
  description  String?
  category     DocCategory
  isPublic     Boolean    @default(false)
  uploadedById String
  uploadedBy   User       @relation("UploadedDocs", fields: [uploadedById], references: [id])
  fileId       String
  file         File       @relation(fields: [fileId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([category])
  @@index([isPublic])
  @@map("documents")
}

enum DocCategory {
  CHARTER
  PROTOCOL
  RULE
  REPORT
  CONTRACT
  INVOICE
  OTHER
}
```

## Announcement — Объявление

```prisma
model Announcement {
  id       String  @id @default(cuid())
  title    String
  content  String
  isPinned Boolean @default(false)
  isPublic Boolean @default(false)
  authorId String
  author   User    @relation("AuthoredAnn", fields: [authorId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([isPinned])
  @@index([isPublic])
  @@map("announcements")
}
```

## Vote — Голосование

```prisma
model Vote {
  id          String     @id @default(cuid())
  title       String
  description String?
  type        VoteType
  status      VoteStatus @default(DRAFT)
  isAnonymous Boolean    @default(false)
  startedAt   DateTime?
  endedAt     DateTime?
  createdById String

  options   VoteOption[]
  responses VoteResponse[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status])
  @@map("votes")
}

enum VoteType {
  SINGLE_CHOICE
  MULTIPLE_CHOICE
}

enum VoteStatus {
  DRAFT
  ACTIVE
  CLOSED
}
```

## VoteOption — Вариант ответа

```prisma
model VoteOption {
  id        String   @id @default(cuid())
  voteId    String
  vote      Vote     @relation(fields: [voteId], references: [id], onDelete: Cascade)
  text      String
  sortOrder Int      @default(0)

  responses VoteResponse[]

  @@index([voteId])
  @@map("vote_options")
}
```

## VoteResponse — Ответ пользователя в голосовании

```prisma
model VoteResponse {
  id       String     @id @default(cuid())
  voteId   String
  vote     Vote       @relation(fields: [voteId], references: [id], onDelete: Cascade)
  optionId String
  option   VoteOption @relation(fields: [optionId], references: [id], onDelete: Cascade)
  userId   String
  user     User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@unique([userId, voteId, optionId])
  @@index([voteId])
  @@index([userId, voteId])
  @@map("vote_responses")
}
```

## ForumTopic — Тема форума

```prisma
model ForumTopic {
  id        String  @id @default(cuid())
  title     String
  isPinned  Boolean @default(false)
  isLocked  Boolean @default(false)
  authorId  String

  posts ForumPost[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([isPinned])
  @@map("forum_topics")
}
```

## ForumPost — Сообщение в теме форума

```prisma
model ForumPost {
  id       String     @id @default(cuid())
  topicId  String
  topic    ForumTopic @relation(fields: [topicId], references: [id], onDelete: Cascade)
  authorId String
  author   User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  content  String
  parentId String?    // Для вложенных ответов

  parent ForumPost?  @relation("ForumPostReplies", fields: [parentId], references: [id])
  replies ForumPost[] @relation("ForumPostReplies")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([topicId])
  @@map("forum_posts")
}
```

## Chat — Чат

```prisma
model Chat {
  id     String   @id @default(cuid())
  type   ChatType @default(PRIVATE)
  name   String?  // Для групповых чатов

  messages     ChatMessage[]
  participants ChatParticipant[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("chats")
}

enum ChatType {
  PRIVATE
  GROUP
}
```

## ChatParticipant — Участник чата

```prisma
model ChatParticipant {
  id     String  @id @default(cuid())
  chatId String
  userId String
  chat   Chat    @relation(fields: [chatId], references: [id], onDelete: Cascade)
  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  lastReadAt DateTime?

  @@unique([chatId, userId])
  @@map("chat_participants")
}
```

## ChatMessage — Сообщение в чате

```prisma
model ChatMessage {
  id       String  @id @default(cuid())
  chatId   String
  chat     Chat    @relation(fields: [chatId], references: [id], onDelete: Cascade)
  senderId String
  sender   User    @relation(fields: [senderId], references: [id], onDelete: Cascade)
  content  String

  createdAt DateTime @default(now())

  @@index([chatId, createdAt])
  @@map("chat_messages")
}
```

## Notification — Уведомление

```prisma
model Notification {
  id      String           @id @default(cuid())
  userId  String
  user    User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  type    NotificationType
  title   String
  content String?
  link    String?           // URL для перехода
  isRead  Boolean           @default(false)

  createdAt DateTime @default(now())

  @@index([userId, isRead])
  @@index([userId, createdAt])
  @@map("notifications")
}

enum NotificationType {
  ANNOUNCEMENT
  VOTE_STARTED
  VOTE_ENDED
  CHARGE_CREATED
  PAYMENT_RECEIVED
  DOCUMENT_UPLOADED
  CHAT_MESSAGE
  FORUM_REPLY
  SYSTEM
}
```

## InfoPage — Статическая информационная страница

Для публичных страниц о СНТ — /info/about, /info/rules и т.д.

```prisma
model InfoPage {
  id      String @id @default(cuid())
  slug    String @unique
  title   String
  content String
  isPublic Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("info_pages")
}
```

## Сводка по индексам

| Таблица | Индекс | Назначение |
|---------|--------|-----------|
| charges | plotId + period | Начисления по участку за период |
| charges | status | Фильтр по статусу |
| payments | memberId | Платежи садовода |
| payments | chargeId | Платежи по начислению |
| vote_responses | userId + voteId | Проверка: голосовал ли пользователь |
| chat_messages | chatId + createdAt | Сообщения чата по порядку |
| notifications | userId + isRead | Непрочитанные уведомления |
| documents | category | Фильтр по категории |
| forum_posts | topicId | Посты темы |
| files | mimeType | Фильтрация по типу файла |