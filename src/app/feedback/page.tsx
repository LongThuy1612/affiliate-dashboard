'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MessageSquare } from 'lucide-react';
import { feedbackApi } from '@/lib/feedbackApi';
import { useToast } from '@/components/ui/Toaster';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

export default function FeedbackPage() {
  const t = useTranslations('feedback');
  const { toast } = useToast();

  const [type, setType] = useState('general');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const typeOptions = [
    { value: 'general',    label: t('types.general') },
    { value: 'bug',        label: t('types.bug') },
    { value: 'suggestion', label: t('types.suggestion') },
    { value: 'other',      label: t('types.other') },
  ];

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast(t('validationError'), { type: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      await feedbackApi.submit(type, message.trim());
      toast(t('successMessage'), { type: 'success' });
      setMessage('');
      setSubmitted(true);
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Error', { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center">
          <MessageSquare size={18} className="text-[var(--accent)]" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-[var(--text)]">{t('title')}</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{t('subtitle')}</p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
        <Select
          label={t('typeLabel')}
          value={type}
          onValueChange={setType}
          options={typeOptions}
        />

        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--text-muted)]">{t('messageLabel')}</label>
          <textarea
            className="w-full rounded-md border bg-[var(--surface-2)] border-[var(--border)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] h-36 resize-y"
            placeholder={t('messagePlaceholder')}
            value={message}
            onChange={(e) => { setMessage(e.target.value); setSubmitted(false); }}
          />
        </div>

        <Button
          icon={<MessageSquare size={13} />}
          loading={submitting}
          onClick={handleSubmit}
          disabled={submitted}
        >
          {submitting ? t('submitting') : t('submitButton')}
        </Button>
      </div>
    </div>
  );
}
