import React, { useState, useEffect } from "react";
import { Member, Role } from "../types/types";
import { api } from "../services/api";
import { auth } from "../utils/auth";
import { useToast } from "../components/Toast";
import {
  User,
  Mail,
  Shield,
  Save,
  Loader2,
  Camera,
  Check,
  Lock,
  Key,
} from "lucide-react";

interface ProfileSettingsProps {
  currentUser: Member;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  currentUser,
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<Member>(currentUser);
  const [isSaving, setIsSaving] = useState(false);

  // Password Change State
  const [passwords, setPasswords] = useState({ new: "", confirm: "" });
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Sync state if currentUser updates elsewhere
  useEffect(() => {
    setFormData(currentUser);
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleRole = (role: Role) => {
    setFormData((prev) => {
      const roles = prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role];
      return { ...prev, roles };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateMember(formData);
      showToast("Profile updated successfully", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to update profile", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      showToast("Passwords do not match", "error");
      return;
    }
    if (passwords.new.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }

    setIsSavingPassword(true);
    try {
      await auth.updatePassword(passwords.new);
      showToast("Password updated successfully", "success");
      setPasswords({ new: "", confirm: "" });
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/requires-recent-login") {
        showToast(
          "Security check: Please log out and log back in to change your password.",
          "error"
        );
      } else {
        showToast("Failed to update password. " + (err.message || ""), "error");
      }
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Re-generate avatar based on new name if it was a default avatar
  const refreshAvatar = () => {
    setFormData((prev) => ({
      ...prev,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        prev.name
      )}&background=random`,
    }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-black h-32 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="relative group">
              <img
                src={formData.avatar}
                alt={formData.name}
                className="w-24 h-24 rounded-full border-4 border-white bg-white object-cover shadow-md"
              />
            </div>
          </div>
        </div>
        <div className="pt-14 pb-6 px-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {formData.name}
            </h1>
            <p className="text-slate-500">{formData.email}</p>
          </div>
          <div className="flex flex-col items-end">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                formData.systemRole === "Admin"
                  ? "bg-slate-100 text-slate-900 border-slate-300"
                  : "bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              {formData.systemRole} Access
            </span>
          </div>
        </div>
      </div>

      {/* Profile Form Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <User className="text-black" size={20} />
          Personal Details
        </h2>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-2.5 text-slate-400"
                  size={18}
                />
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email (Read Only)
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-2.5 text-slate-400"
                  size={18}
                />
                <input
                  value={formData.email}
                  readOnly
                  disabled
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Avatar URL
            </label>
            <div className="flex gap-2">
              <input
                name="avatar"
                value={formData.avatar}
                onChange={handleChange}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
                placeholder="https://..."
              />
              <button
                type="button"
                onClick={refreshAvatar}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 text-sm font-medium transition-colors"
                title="Generate from name"
              >
                Auto-Generate
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Paste a direct image link or click Auto-Generate.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Shield className="text-black" size={18} />
              My Roles
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Select the roles you perform in the worship team.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.values(Role).map((role) => {
                const isSelected = formData.roles.includes(role);
                return (
                  <div
                    key={role}
                    onClick={() => toggleRole(role)}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all text-sm font-medium
                                    ${
                                      isSelected
                                        ? "bg-slate-100 border-slate-500 text-slate-900 shadow-sm"
                                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? "bg-black border-black"
                          : "bg-white border-slate-300"
                      }`}
                    >
                      {isSelected && <Check size={10} className="text-white" />}
                    </div>
                    {role}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-lg hover:bg-slate-800 disabled:bg-slate-400 font-medium shadow-sm transition-all transform active:scale-95"
            >
              {isSaving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Security Section (Change Password) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Lock className="text-black" size={20} />
          Security Settings
        </h2>

        <form onSubmit={handleChangePassword} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <Key
                  className="absolute left-3 top-2.5 text-slate-400"
                  size={18}
                />
                <input
                  type="password"
                  value={passwords.new}
                  onChange={(e) =>
                    setPasswords({ ...passwords, new: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Key
                  className="absolute left-3 top-2.5 text-slate-400"
                  size={18}
                />
                <input
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) =>
                    setPasswords({ ...passwords, confirm: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingPassword || !passwords.new}
              className="flex items-center gap-2 px-6 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-400 font-medium transition-all"
            >
              {isSavingPassword ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Lock size={18} />
              )}
              {isSavingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
