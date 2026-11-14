import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", database: "ok", timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("[health] falha ao conectar no banco", error);
    return Response.json({ status: "erro", database: "indisponivel" }, { status: 503 });
  }
}
