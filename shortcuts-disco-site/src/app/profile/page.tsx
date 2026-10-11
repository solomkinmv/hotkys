import { ProfileContent } from "./profile-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false },
};

export default function ProfilePage() {
  return <ProfileContent />;
}
