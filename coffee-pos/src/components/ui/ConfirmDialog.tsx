import Modal from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
}

export default function ConfirmDialog({
  isOpen, onClose, onConfirm, title, message, confirmLabel = 'تأكيد', loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? '...' : confirmLabel}
          </button>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>إلغاء</button>
        </>
      }
    >
      <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}
