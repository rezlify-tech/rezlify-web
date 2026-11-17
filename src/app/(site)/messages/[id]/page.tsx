import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatShell } from "@/components/chat/ChatShell";

export const metadata: Metadata = {
  title: "Messages",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ id: string }> };

export default async function ConversationPage({ params }: Props) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  return <ChatShell selectedId={Number(id)} />;
}
