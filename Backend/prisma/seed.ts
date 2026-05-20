import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  UserRole,
  QuestionStatus,
  RoomType,
  MessageType,
} from "../src/generated/prisma/client.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log(" Seeding database...");

  // USERS
  const student1 = await prisma.user.create({
    data: {
      anonymousId: "anon_student_1",
      role: UserRole.STUDENT,
    },
  });

  const student2 = await prisma.user.create({
    data: {
      anonymousId: "anon_student_2",
      role: UserRole.STUDENT,
    },
  });

  const teacher1 = await prisma.user.create({
    data: {
      anonymousId: "anon_teacher_1",
      role: UserRole.TEACHER,
    },
  });

  const admin = await prisma.user.create({
    data: {
      anonymousId: "anon_admin_1",
      role: UserRole.ADMIN,
    },
  });

  // TAGS
  const faithTag = await prisma.tag.create({
    data: { name: "Faith" },
  });

  const doubtTag = await prisma.tag.create({
    data: { name: "Doubt" },
  });

  const prayerTag = await prisma.tag.create({
    data: { name: "Prayer" },
  });

  // ROOMS
  const freeRoom = await prisma.room.create({
    data: {
      name: "General Discussion",
      type: RoomType.FREE_CHAT,
      createdById: admin.id,
    },
  });

  const sermonRoom = await prisma.room.create({
    data: {
      name: "Sunday Sermon Q&A",
      type: RoomType.SERMON,
      createdById: teacher1.id,
    },
  });

  // QUESTIONS
  const question1 = await prisma.question.create({
    data: {
      content: "Is doubt a sin?",
      status: QuestionStatus.APPROVED,
      authorId: student1.id,
      tags: {
        create: [{ tagId: faithTag.id }, { tagId: doubtTag.id }],
      },
    },
  });

  const question2 = await prisma.question.create({
    data: {
      content: "How should I pray daily?",
      status: QuestionStatus.ANSWERED,
      authorId: student2.id,
      roomId: sermonRoom.id,
      tags: {
        create: [{ tagId: prayerTag.id }],
      },
    },
  });

  // ANSWERS
  const answer1 = await prisma.answer.create({
    data: {
      content: "Doubt can be part of a growing faith...",
      questionId: question1.id,
      authorId: teacher1.id,
    },
  });

  const answer2 = await prisma.answer.create({
    data: {
      content: "Start with small consistent prayers daily...",
      questionId: question2.id,
      authorId: teacher1.id,
    },
  });

  // MESSAGES (ROOM CHAT)
  await prisma.message.createMany({
    data: [
      {
        content: "Welcome to the discussion!",
        type: MessageType.COMMENT,
        senderId: admin.id,
        roomId: freeRoom.id,
      },
      {
        content: "What does forgiveness mean?",
        type: MessageType.QUESTION,
        senderId: student1.id,
        roomId: sermonRoom.id,
      },
      {
        content: "Forgiveness is letting go of resentment...",
        type: MessageType.ANSWER,
        senderId: teacher1.id,
        roomId: sermonRoom.id,
      },
    ],
  });

  // VOTES
  await prisma.vote.createMany({
    data: [
      {
        value: 1,
        userId: student2.id,
        questionId: question1.id,
      },
      {
        value: 1,
        userId: student1.id,
        answerId: answer1.id,
      },
    ],
  });

  // NOTIFICATIONS
  await prisma.notification.createMany({
    data: [
      {
        content: "Your question has been answered.",
        userId: student1.id,
      },
      {
        content: "New sermon room started.",
        userId: student2.id,
      },
    ],
  });

  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
