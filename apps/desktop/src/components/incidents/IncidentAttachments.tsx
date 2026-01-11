/**
 * Galeria de anexos de incidente
 */

import { memo, useState } from "react";
import { Download, Trash2, FileText, X } from "lucide-react";
import { Button } from "../ui/Button";
import type { IncidentAttachment } from "../../types/incident.types";

interface IncidentAttachmentsProps {
  attachments: IncidentAttachment[];
  onDelete?: (attachmentId: string) => void;
  readOnly?: boolean;
}

export const IncidentAttachments = memo(function IncidentAttachments({
  attachments,
  onDelete,
  readOnly = false,
}: IncidentAttachmentsProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const isImage = (fileType: string) => fileType.startsWith("image/");

  const handleDownload = (attachment: IncidentAttachment) => {
    window.open(attachment.file_url, "_blank");
  };

  const handleImageClick = (fileUrl: string) => {
    setLightboxImage(fileUrl);
    setLightboxOpen(true);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  if (attachments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">Nenhum anexo disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Preview */}
            <div className="aspect-square bg-gray-50 flex items-center justify-center relative group">
              {isImage(attachment.file_type) ? (
                <>
                  <img
                    src={attachment.file_url}
                    alt={attachment.file_name}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => handleImageClick(attachment.file_url)}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all cursor-pointer" />
                </>
              ) : (
                <FileText className="w-12 h-12 text-gray-400" />
              )}
            </div>

            {/* Info */}
            <div className="p-3 bg-white">
              <p
                className="text-xs font-medium text-gray-900 truncate"
                title={attachment.file_name}
              >
                {attachment.file_name}
              </p>
              <p className="text-xs text-gray-500 mt-1">{formatFileSize(attachment.file_size)}</p>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="ghost"
                  onClick={() => handleDownload(attachment)}
                  className="flex-1 h-8 text-sm"
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Baixar
                </Button>
                {!readOnly && onDelete && (
                  <Button
                    variant="ghost"
                    onClick={() => onDelete(attachment.id)}
                    className="h-8 px-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && lightboxImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={lightboxImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
});
