import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Keystatic Admin — priyanshu.dev",
};

export default function KeystaticLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
