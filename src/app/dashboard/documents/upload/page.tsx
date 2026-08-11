'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DocumentUploadZone } from '@/components/features/documents/DocumentUploadZone';
// import { DocumentMetadataForm } from '@/components/features/documents/DocumentMetadataForm';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';

/**
 * @page /dashboard/documents/upload
 * @auth admin
 * @description Пошаговая форма загрузки документа: файл → метаданные
 *
 * @spec
 * - State machine: 'upload' → 'metadata' → 'done'
 * - Шаг 1: DocumentUploadZone
 * - Шаг 2: DocumentMetadataForm
 * - После успеха → redirect на /dashboard/documents/:id
 *
 * @traces US-22-03 AC-1..6, US-22-04 AC-1..5
 * @task DOCS-T4.3.2
 */
export default function UploadDocumentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { uploadFile, uploading, error, uploadedDocument } = useDocumentUpload();
  const [step, setStep] = useState<'upload' | 'metadata'>('upload');

  if (status === 'loading') {
    return <div role="status">Загрузка...</div>;
  }

  if (status === 'unauthenticated' || !session?.user?.roles?.includes('ADMIN')) {
    router.push('/login');
    return null;
  }

  const handleUploadSuccess = async (file: File) => {
    await uploadFile(file);
    setStep('metadata');
  };

  const handleMetadataSuccess = (doc: { id: string }) => {
    router.push(`/dashboard/documents/${doc.id}`);
  };

  return (
    <div role="region" aria-label="Загрузка документа">
      <h1>Загрузка документа</h1>
      {step === 'upload' && (
        <DocumentUploadZone onUpload={handleUploadSuccess} />
      )}
      {step === 'metadata' && uploadedDocument && (
        <div>
          {/* [TODO] DocumentMetadataForm — DOCS-T4.3.2 */}
          <p>Шаг 2: Заполнение метаданных</p>
        </div>
      )}
      {error && (
        <div role="alert">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
