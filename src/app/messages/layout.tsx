import { messagesFrameClass } from "@/lib/surfaceStyles";

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={messagesFrameClass}>{children}</div>;
}
