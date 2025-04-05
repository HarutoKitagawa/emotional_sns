"use client";

import { useState } from "react";
import { useAddReply } from "../features/post/hooks";
import UserAvatar from "./UserAvatar";
import { useAuth } from "@/features/auth/hooks";

interface ReplyFormProps {
  postId: string;
}

export default function ReplyForm({ postId }: ReplyFormProps) {
  const [content, setContent] = useState("");
  const { user } = useAuth();
  const { addReply, isLoading, error } = useAddReply(postId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isLoading) return;

    try {
      await addReply(user!.id, content);
      setContent("");
    } catch (err) {
      console.error("Failed to add reply:", err);
    }
  };

  if (!user) return null;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
    >
      <div className="flex items-start space-x-3">
        <UserAvatar user={user} size="sm" linkToProfile={false} />

        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="返信を入力..."
            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
            rows={3}
            disabled={isLoading}
          />

          {error && (
            <p className="mt-2 text-red-500 text-sm">
              返信の送信中にエラーが発生しました。再度お試しください。
            </p>
          )}

          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={!content.trim() || isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "送信中..." : "返信する"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
