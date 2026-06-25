# Схема базы данных — Основные модели

## ER-диаграмма

```mermaid
erDiagram
    User ||--o| Member : has
    Member ||--o{ PlotMembership : has
    Plot ||--o{ PlotMembership : has
    Plot ||--o{ Charge : receives
    Member ||--o{ Payment : makes
    Charge ||--o{ Payment : covers
    User ||--o{ Document : uploads
    User ||--o{ Announcement : authors
    User ||--o{ ForumPost : writes
    User ||--o{ ChatMessage : sends
    User ||--o{ Notification : receives
    User ||--o{ VoteResponse : casts
    Vote ||--o{ VoteOption : has
    VoteOption ||--o{ VoteResponse : receives
    ForumTopic ||--o{ ForumPost : contains
    Chat ||--o{ ChatMessage : contains
    Chat }o--o{ User : participants

    File ||--o{ Document : documents
    Document }|--| File : links_to
```

## User — Пользователь системы

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  role          UserRole  @default(MEMBER)
  name          String?
  phone         String?
  avatarUrl     String?
  isActive      Boolean   @default(true)
  emailVerified DateTime?
  resetToken    String?    @unique
  resetTokenExp DateTime?

  member            Member?
  notifications     Notification[]
  forumPosts        ForumPost[]
  chatMessages      ChatMessage[]
  voteResponses     VoteResponse[]
  uploadedDocs      Document[]       @relation("UploadedDocs")
  authoredAnn       Announcement[]   @relation("AuthoredAnn")
  chatParticipants  ChatParticipant[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

enum UserRole {
  ADMIN
  MEMBER
  GUEST
}
```

## Member — Садовод

Связан с User 1:1. Хранит данные о членстве в СНТ.

```prisma
model Member {
  id         String  @id @default(cuid())
  userId     String  @unique
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  surname    String
  firstName  String
  patronymic String?
  address    String?
  snn        String?

  plotMemberships PlotMembership[]
  payments        Payment[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("members")
}
```

## Plot — Садовый участок

```prisma
model Plot {
  id           String     @id @default(cuid())
  number       String     @unique
  area         Float
  address      String?
  cadastralNum String?
  status       PlotStatus @default(ACTIVE)

  plotMemberships PlotMembership[]
  charges         Charge[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("plots")
}

enum PlotStatus {
  ACTIVE
  INACTIVE
  ABANDONED
}
```

## PlotMembership — Связь участок-садовод

Один участок может иметь нескольких владельцев — долевая собственность.

```prisma
model PlotMembership {
  id       String         @id @default(cuid())
  plotId   String
  memberId String
  role     MembershipRole @default(OWNER)
  share    Float?
  since    DateTime       @default(now())
  until    DateTime?

  plot   Plot   @relation(fields: [plotId], references: [id], onDelete: Cascade)
  member Member @relation(fields: [memberId], references: [id], onDelete: Cascade)

  @@unique([plotId, memberId, since])
  @@map("plot_memberships")
}

enum MembershipRole {
  OWNER
  CO_OWNER
  TENANT
  FAMILY
}
```

## Charge — Начисление

```prisma
model Charge {
  id          String       @id @default(cuid())
  plotId      String
  plot        Plot         @relation(fields: [plotId], references: [id], onDelete: Cascade)
  type        ChargeType
  amount      Decimal      @db.Decimal(12, 2)
  description String?
  period      String
  dueDate     DateTime?
  status      ChargeStatus @default(PENDING)

  payments Payment[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([plotId, period])
  @@index([status])
  @@map("charges")
}

enum ChargeType {
  MEMBERSHIP_FEE
  TARGET_FEE
  ELECTRICITY
  WATER
  LAND_TAX
  OTHER
}

enum ChargeStatus {
  PENDING
  PARTIALLY_PAID
  PAID
  CANCELLED
}
```

## Payment — Платёж

```prisma
model Payment {
  id         String       @id @default(cuid())
  memberId   String
  member     Member       @relation(fields: [memberId], references: [id], onDelete: Cascade)
  chargeId   String?
  charge     Charge?      @relation(fields: [chargeId], references: [id], onDelete: SetNull)
  amount     Decimal      @db.Decimal(12, 2)
  method     PaymentMethod
  receiptNum String?
  receiptUrl String?
  note       String?
  paidAt     DateTime     @default(now())

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([memberId])
  @@index([chargeId])
  @@map("payments")
}

enum PaymentMethod {
  CASH
  CARD
  TRANSFER
  SBERPAY
  OTHER
}