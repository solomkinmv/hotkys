import { EditProfileContent } from "./edit-profile-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Profile",
};

export default function EditProfilePage() {
  return <EditProfileContent />;
}
