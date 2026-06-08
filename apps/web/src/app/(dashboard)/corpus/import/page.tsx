'use client';
import { useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Icon } from '@/components/ui/Icon';
import { PageHead } from '@/components/ui/PageHead';

interface FileEntry { name: string; size: string; type: string; body: string; date: string; }

const SAMPLE_FILES: FileEntry[] = [
  { name: 'Luat-Doanh-nghiep-59-2020-QH14.pdf', size: '2.4 MB', type: 'law', body: 'Quốc hội', date: '2020-06-17' },
  { name: 'Nghi-dinh-145-2020-ND-CP.pdf', size: '1.8 MB', type: 'decree', body: 'Chính phủ', date: '2020-12-14' },
  { name: 'Quy-che-nhan-su-2025.docx', size: '340 KB', type: 'policy', body: 'Phòng Nhân sự', date: '2025-01-01' },
];

const STEPS = ['upload', 'classify', 'process', 'done'] as const;

export default function ImportPage() {
  const { t } = useApp();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [dragOver, setDragOver] = useState(false);

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
              <div style={{ flex: 1, height: 1, background: i < step ? 'var(--green-solid)' : 'var(--border)', margin: '0 12px' }} />
            )}
          </Fragment>
        ))}
      </div>

      {/* step 0: drop zone */}
      {step === 0 && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); setFiles(SAMPLE_FILES); setStep(1); }}
          className="card"
          style={{ padding: '56px 24px', textAlign: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: dragOver ? 'var(--accent)' : 'var(--border-strong)', background: dragOver ? 'var(--accent-soft)' : 'var(--surface)', transition: 'all 0.18s' }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--accent-soft)', color: 'var(--accent-text)', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
            <Icon name="upload" size={28} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{t('import.drop')}</div>
          <div style={{ fontSize: 14, color: 'var(--text-3)', margin: '6px 0 16px' }}>{t('import.or')}</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => { setFiles(SAMPLE_FILES); setStep(1); }}>
              <Icon name="fileText" size={15} />{t('import.pickFile')}
            </button>
            <button className="btn btn-ghost" onClick={() => { setFiles(SAMPLE_FILES); setStep(1); }}>
              <Icon name="folder" size={15} />{t('import.pickFolder')}
            </button>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 20, fontFamily: 'var(--font-mono)' }}>{t('import.formats')}</div>
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
            {files.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 13, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                <Icon name="fileText" size={18} style={{ color: 'var(--text-3)', flex: 'none' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{f.size}</div>
                </div>
                <select className="field" defaultValue={f.type} style={{ width: 140, padding: '7px 10px', fontSize: 13 }}>
                  {(['law', 'decree', 'circular', 'decision', 'policy', 'sop', 'other'] as const).map(dt => (
                    <option key={dt} value={dt}>{t('dt.' + dt)}</option>
                  ))}
                </select>
                <input className="field" defaultValue={f.body} style={{ width: 150, padding: '7px 10px', fontSize: 13 }} />
                <button style={{ border: 'none', background: 'transparent', color: 'var(--text-3)', cursor: 'pointer' }}
                  onClick={() => setFiles(files.filter((_, j) => j !== i))}>
                  <Icon name="x" size={16} />
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
            <button className="btn btn-ghost" onClick={() => setStep(0)}>{t('common.cancel')}</button>
            <button className="btn btn-primary" onClick={() => { setStep(2); setTimeout(() => setStep(3), 2200); }}>
              <Icon name="arrowRight" size={15} />{t('import.step.process')} ({files.length})
            </button>
          </div>
        </div>
      )}

      {/* step 2: processing */}
      {step === 2 && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{t('import.process.title')}</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>{t('import.process.sub')}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {files.map((f, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span>{f.name}</span>
                  <span style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>indexing…</span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden' }}>
                  <div className="shimmer" style={{ height: '100%', borderRadius: 99, background: 'var(--accent)', width: '70%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* step 3: done */}
      {step === 3 && (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: 99, background: 'var(--green-bg)', color: 'var(--green-text)', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
            <Icon name="check" size={30} sw={2.6} />
          </div>
          <div style={{ fontSize: 19, fontWeight: 600 }}>{t('import.done.title')}</div>
          <div style={{ fontSize: 14, color: 'var(--text-2)', margin: '6px 0 20px' }}>{files.length} thành công · 0 lỗi</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => router.push('/corpus')}>
              {t('import.done.view')}
            </button>
            <button className="btn btn-ghost" onClick={() => { setFiles([]); setStep(0); }}>
              <Icon name="plus" size={15} />{t('import.done.more')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
