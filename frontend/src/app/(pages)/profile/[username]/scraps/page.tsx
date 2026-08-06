"use client";

import { useParams } from "next/navigation";

import { ScrapbookPage } from "@/components/ScrapbookPage/page";

export default function OwnScrapbookRoute() {
  const { username } = useParams<{ username: string }>();
  return <ScrapbookPage username={username} isOwnProfile />;
}
