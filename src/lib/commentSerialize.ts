import type { CommentNode } from "@/components/comment/CommentSection";

type Row = {
  id: string;
  content: string;
  guestName: string | null;
  userId: string | null;
  user: { id: string; name: string | null } | null;
  createdAt: Date;
  replies?: Row[];
};

export function serializeComments(rows: Row[]): CommentNode[] {
  return rows.map((row) => ({
    id: row.id,
    content: row.content,
    guestName: row.guestName,
    userId: row.userId,
    user: row.user,
    createdAt: row.createdAt.toISOString(),
    replies: serializeComments(row.replies ?? []),
  }));
}
