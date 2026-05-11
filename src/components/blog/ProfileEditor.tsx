"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/generated/prisma";

interface ProfileEditorProps {
  user: User;
  isOwner: boolean;
}

export function ProfileEditor({ user, isOwner }: ProfileEditorProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || "",
    bio: user.bio || "",
    signature: user.signature || "",
    tags: user.tags || "",
    location: user.location || "",
    occupation: user.occupation || "",
    github: user.github || "",
    wechat: user.wechat || "",
    website: user.website || "",
  });

  const handleSave = async () => {
    if (!isOwner) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to update");

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOwner) {
    return null;
  }

  return (
    <div className="mb-4 flex justify-end">
      {!isEditing ? (
        <button
          onClick={() => setIsEditing(true)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          ✏️ 编辑
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "保存中..." : "保存"}
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setFormData({
                name: user.name || "",
                bio: user.bio || "",
                signature: user.signature || "",
                tags: user.tags || "",
                location: user.location || "",
                occupation: user.occupation || "",
                github: user.github || "",
                wechat: user.wechat || "",
                website: user.website || "",
              });
            }}
            disabled={loading}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            取消
          </button>
        </div>
      )}
    </div>
  );
}

interface EditableFieldProps {
  label: string;
  value: string;
  isEditing: boolean;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  multiline?: boolean;
}

export function EditableField({
  label,
  value,
  isEditing,
  onChange,
  type = "text",
  placeholder,
  multiline = false,
}: EditableFieldProps) {
  if (isEditing) {
    if (multiline) {
      return (
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {label}
          </label>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
            rows={3}
          />
        </div>
      );
    }
    return (
      <div className="space-y-1">
        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {label}
        </label>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
        />
      </div>
    );
  }

  return (
    <div>
      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {label}:
      </span>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {value || placeholder || "未填写"}
      </p>
    </div>
  );
}
