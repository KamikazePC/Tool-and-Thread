import UserSettings from "@/components/UserSettings";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
      <UserSettings />
    </div>
  );
}
