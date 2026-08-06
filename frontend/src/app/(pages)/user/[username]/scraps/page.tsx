"use client";

import { useParams } from "next/navigation";

import { ScrapbookPage } from "@/components/ScrapbookPage/page";

export default function UserScrapbookRoute() {
  const { username } = useParams<{ username: string }>();
  return <ScrapbookPage username={username} isOwnProfile={false} />;
}
