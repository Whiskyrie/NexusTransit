/**
 * Thread de comentários de incidente
 */

import { memo, useState } from "react";
import { Send, MessageSquare } from "lucide-react";
import { Button } from "../ui/Button";
import type { IncidentComment } from "../../types/incident.types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface IncidentCommentThreadProps {
  comments: IncidentComment[];
  onAddComment: (content: string) => Promise<void>;
  isLoading?: boolean;
  readOnly?: boolean;
}

export const IncidentCommentThread = memo(function IncidentCommentThread({
  comments,
  onAddComment,
  readOnly = false,
}: IncidentCommentThreadProps) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAddComment(newComment.trim());
      setNewComment("");
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Nenhum comentário ainda</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{comment.user_name}</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(comment.created_at), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* New Comment Form */}
      {!readOnly && (
        <form onSubmit={handleSubmit} className="border-t border-gray-200 pt-4">
          <div className="space-y-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Adicione um comentário..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:border-transparent resize-none text-sm"
              disabled={isSubmitting}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="h-9 px-4"
              >
                {isSubmitting ? (
                  <>Enviando...</>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-1" />
                    Enviar Comentário
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
});
