'use client';
import { useState, useRef, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Icon } from '@/components/ui/Icon';
import { PageHead } from '@/components/ui/PageHead';
import { toast } from '@/components/ui/Toast';

type FileEntry = {
  file: File;
  docType: string;
  issuingBody: string;
  effectiveDate: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  errorMsg?: string;
};

const STEPS = ['upload', 'classify', 'process', 'done'] as const;
const ACCEPTED = '.pdf,.docx,.doc,.txt,.md';

function guessDocType(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('luat') || n.includes('luật') || n.match(/\d{2}-\d{4}-qh/)) return 'law';
  if (n.includes('nghi-dinh') || n.includes('nghị định') || n.match(/\d{3}-\d{4}-nd/)) return 'decree';
  if (n.includes('thong-tu') || n.includes('thông tư') || n.match(/\d{2}-\d{4}-bld/)) return 'circular';
  if (n.includes('quyet-dinh') || n.includes('quyết định')) return 'decision';
  if (n.includes('quy-che') || n.includes('quy chế') || n.includes('policy')) return 'policy';
  return 'other';
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

export default function ImportPage() {
  const { t } = useApp();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  const addFiles = (fileList: FileList) => {
    const newEntries: FileEntry[] = Array.from(fileList).map(f => ({
      file: f,
      docType: guessDocType(f.name),
      issuingBody: '',
      effectiveDate: '',
      status: 'pending',
    }));
    setEntries(prev => [...prev, ...newEntries]);
    setStep(1);
  };

  const updateEntry = (i: number, patch: Partial<FileEntry>) =>
    setEntries(prev => prev.map((e, j) => j === i ? { ...e, ...patch } : e));

  const processFiles = async () => {
    setStep(2);
    let done = 0;
    let errors = 0;

    for (let i = 0; i < entries.length; i++) {
      updateEntry(i, { status: 'uploading' });
      const e = entries[i];
      const fd = new FormData();
      fd.append('file', e.file);
      fd.append('documentType', e.docType);
      if (e.issuingBody) fd.append('issuingBody', e.issuingBody);
      if (e.effectiveDate) fd.append('effectiveDate', e.effectiveDate);

      try {
        const res = await fetch('/api/ingest', { method: 'POST', body: fd });
        const data = await res.json();
        if (res.ok && data.ok) {
          updateEntry(i, { status: 'done' });
          done++;
        } else {
          updateEntry(i, { status: 'error', errorMsg: data.error || 'Lỗi xử lý' });
          errors++;
        }
      } catch {
        updateEntry(i, { status: 'error', errorMsg: 'Lỗi kết nối' });
        errors++;
      }
    }

    setDoneCount(done);
    setErrorCount(errors);
    setStep(3);
    if (done > 0) toast(`Đã nhập ${done} văn bản`, { kind: 'success' });
    if (errors > 0) toast(`${errors} tệp lỗi`, { kind: 'error' });
  };

  return (
    <div className="anim-up" style={{ maxWidth: 880, margin: '0 auto' }}>
      <PageHead title={t('import.title')} />

      {/* stepper */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        {STEPS.map((s, i) => (
          <Fragment key={s}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{
                width: 26, height: 26, borderRadius: 99, display: 'grid', placeItems: 'center',
                fontSize: 12.5, fontWeight: 600, fontFamily: 'var(--font-mono)',
                background: i < step ? 'var(--green-solid)' : i === step ? 'var(--accent)' : 'var(--surface-2)',
                color: i <= step ? '#fff' : 'var(--text-3)',
                border: i > step ? '1px solid var(--border)' : 'none',
              }}>
                {i < step ? <Icon name="check" size={14} sw={3} /> : i + 1}
              </span>
              <span style={{ fontSize: 13, fontWeight: i === step ? 600 : 500, color: i <= step ? 'var(--text)' : 'var(--text-3)' }}>
                {t('import.step.' + s)}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 1, background: i < step ? 'var(--green-solid)' : 'var(--border)', margin: '0 12px', transition: 'background 0.4s' }} />
            )}
          </Fragment>
        ))}
      </div>

      {/* step 0: drop zone */}
      {step === 0 && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); }}
          className="card"
          style={{ padding: '56px 24px', textAlign: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: dragOver ? 'var(--accent)' : 'var(--border-strong)', background: dragOver ? 'var(--accent-soft)' : 'var(--surface)', transition: 'all 0.18s' }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--accent-soft)', color: 'var(--accent-text)', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
            <Icon name="upload" size={28} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{t('import.drop')}</div>
          <div style={{ fontSize: 14, color: 'var(--text-3)', margin: '6px 0 16px' }}>{t('import.or')}</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button type="button" className="btn btn-primary" onClick={() => inputRef.current?.click()}>
              <Icon name="fileText" size={15} />{t('import.pickFile')}
            </button>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 20, fontFamily: 'var(--font-mono)' }}>{t('import.formats')}</div>
          <input ref={inputRef} type="file" accept={ACCEPTED} multiple style={{ display: 'none' }}
            title="Chọn tệp văn bản" aria-label="Chọn tệp văn bản"
            onChange={e => { if (e.target.files?.length) addFiles(e.target.files); }} />
        </div>
      )}

      {/* step 1: classify */}
      {step === 1 && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{t('import.classify.title')}</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>{t('import.classify.sub')}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {entries.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 13, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-2)', flexWrap: 'wrap' }}>
                <Icon name="fileText" size={18} style={{ color: 'var(--text-3)', flex: 'none' }} />
                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.file.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{fmtSize(e.file.size)}</div>
                </div>
                <select className="field" value={e.docType} onChange={ev => updateEntry(i, { docType: ev.target.value })} style={{ width: 140, padding: '7px 10px', fontSize: 13 }}>
                  {(['law', 'decree', 'circular', 'decision', 'policy', 'sop', 'other'] as const).map(dt => (
                    <option key={dt} value={dt}>{t('dt.' + dt)}</option>
                  ))}
                </select>
                <input className="field" value={e.issuingBody} onChange={ev => updateEntry(i, { issuingBody: ev.target.value })}
                  placeholder="Cơ quan ban hành" style={{ width: 160, padding: '7px 10px', fontSize: 13 }} />
                <input className="field" type="date" value={e.effectiveDate} onChange={ev => updateEntry(i, { effectiveDate: ev.target.value })}
                  style={{ width: 140, padding: '7px 10px', fontSize: 13 }} />
                <button type="button" title="Xóa" style={{ border: 'none', background: 'transparent', color: 'var(--text-3)', cursor: 'pointer', padding: 4 }}
                  onClick={() => setEntries(prev => prev.filter((_, j) => j !== i))}>
                  <Icon name="x" size={16} />
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => inputRef.current?.click()}>
              <Icon name="plus" size={13} />Thêm tệp
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-ghost" onClick={() => { setEntries([]); setStep(0); }}>{t('common.cancel')}</button>
              <button type="button" className="btn btn-primary" onClick={processFiles} disabled={entries.length === 0}>
                <Icon name="arrowRight" size={15} />{t('import.step.process')} ({entries.length})
              </button>
            </div>
          </div>
          <input ref={inputRef} type="file" accept={ACCEPTED} multiple style={{ display: 'none' }}
            title="Thêm tệp văn bản" aria-label="Thêm tệp văn bản"
            onChange={e => { if (e.target.files?.length) addFiles(e.target.files); }} />
        </div>
      )}

      {/* step 2: processing */}
      {step === 2 && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{t('import.process.title')}</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>{t('import.process.sub')}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {entries.map((e, i) => {
              const pct = e.status === 'done' ? 100 : e.status === 'error' ? 100 : e.status === 'uploading' ? 55 : 0;
              const color = e.status === 'done' ? 'var(--green-solid)' : e.status === 'error' ? 'var(--red-solid)' : 'var(--accent)';
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, alignItems: 'center' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0, marginRight: 10 }}>{e.file.name}</span>
                    <span style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 11.5, flex: 'none' }}>
                      {e.status === 'uploading' && <><Icon name="refresh" size={12} style={{ animation: 'spin 0.8s linear infinite', marginRight: 4 }} />indexing…</>}
                      {e.status === 'done' && <span style={{ color: 'var(--green-text)' }}>✓ xong</span>}
                      {e.status === 'error' && <span style={{ color: 'var(--red-text)' }}>{e.errorMsg}</span>}
                      {e.status === 'pending' && 'chờ…'}
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, background: color, width: pct + '%', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* step 3: done */}
      {step === 3 && (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: 99, background: errorCount === entries.length ? 'var(--red-bg)' : 'var(--green-bg)', color: errorCount === entries.length ? 'var(--red-text)' : 'var(--green-text)', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
            <Icon name={errorCount === entries.length ? 'x' : 'check'} size={30} sw={2.6} />
          </div>
          <div style={{ fontSize: 19, fontWeight: 600 }}>{t('import.done.title')}</div>
          <div style={{ fontSize: 14, color: 'var(--text-2)', margin: '6px 0 20px' }}>
            {doneCount} thành công · {errorCount} lỗi
          </div>
          {errorCount > 0 && (
            <div style={{ maxWidth: 500, margin: '0 auto 20px', textAlign: 'left' }}>
              {entries.filter(e => e.status === 'error').map((e, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'var(--red-bg)', marginBottom: 6, fontSize: 12.5 }}>
                  <Icon name="alert" size={14} style={{ color: 'var(--red-text)', flex: 'none', marginTop: 1 }} />
                  <div>
                    <div style={{ fontWeight: 500 }}>{e.file.name}</div>
                    <div style={{ color: 'var(--text-3)' }}>{e.errorMsg}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button type="button" className="btn btn-primary" onClick={() => router.push('/corpus')}>
              {t('import.done.view')}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => { setEntries([]); setDoneCount(0); setErrorCount(0); setStep(0); }}>
              <Icon name="plus" size={15} />{t('import.done.more')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
