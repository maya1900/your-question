"use client";

import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/toast-provider";

type DeleteButtonProps = {
  action: (formData: FormData) => void;
  confirmMessage: string;
  hiddenFields: Record<string, string>;
  label?: string;
  disabled?: boolean;
  successMessage?: string;
};

function SubmitButton({ label, disabled }: { label: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn small danger" type="submit" disabled={disabled || pending}>
      {pending ? "删除中..." : label}
    </button>
  );
}

export function DeleteButton({
  action,
  confirmMessage,
  hiddenFields,
  label = "删除",
  disabled = false,
  successMessage = "删除成功"
}: DeleteButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setFormData(data);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    if (formData) {
      startTransition(() => {
        try {
          action(formData);
          showToast(successMessage, "success");
        } catch (error) {
          showToast("删除失败，请重试", "error");
        }
      });
    }
    setShowConfirm(false);
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setFormData(null);
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        {Object.entries(hiddenFields).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
        <SubmitButton label={label} disabled={disabled || isPending} />
      </form>
      <ConfirmDialog
        isOpen={showConfirm}
        title="确认删除"
        message={confirmMessage}
        confirmLabel="删除"
        cancelLabel="取消"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
}
