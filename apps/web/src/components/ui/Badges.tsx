'use client';
import { useApp } from '@/context/AppContext';
import { Icon } from './Icon';

const DT_SHORT: Record<string, string> = {
  law: 'LUẬT', decree: 'NĐ', circular: 'TT', decision: 'QĐ', policy: 'CS', sop: 'SOP', other: 'KHÁC',
};
const FRESH_COLOR: Record<string, string> = {
  effective: 'green', amended: 'amber', repealed: 'red', draft: 'blue', obsolete: 'gray', unknown: 'gray',
};

export function DocTypeBadge({ type }: { type: string }) {
  return <span className="badge-doctype">{DT_SHORT[type] || 'KHÁC'}</span>;
}

export function FreshBadge({ status }: { status: string }) {
  const { t } = useApp();
  const c = FRESH_COLOR[status] || 'gray';
  return (
    <span className={'badge s-' + c}>
      <span className={'badge-dot dot-' + c}></span>
      {t('fs.' + status)}
    </span>
  );
}

const ANSWER_CLASS_STYLE: Record<string, string> = {
  DIRECT_CITED_ANSWER: 'ac-direct', direct_cited: 'ac-direct',
  SUMMARY_WITH_SOURCE: 'ac-summary', summary: 'ac-summary',
  PROCEDURAL_GUIDANCE: 'ac-procedural', procedural: 'ac-procedural',
  ESCALATE_OR_ABSTAIN: 'ac-abstain', abstain: 'ac-abstain',
};
const ANSWER_CLASS_LABEL: Record<string, string> = {
  DIRECT_CITED_ANSWER: 'Trích dẫn', direct_cited: 'Trích dẫn',
  SUMMARY_WITH_SOURCE: 'Tóm tắt', summary: 'Tóm tắt',
  PROCEDURAL_GUIDANCE: 'Thủ tục', procedural: 'Thủ tục',
  ESCALATE_OR_ABSTAIN: 'Chuyển tiếp', abstain: 'Chuyển tiếp',
};

export function AnswerBadge({ value }: { value: string }) {
  const cls = ANSWER_CLASS_STYLE[value] || 'ac-summary';
  const label = ANSWER_CLASS_LABEL[value] || value;
  return <span className={'ac ' + cls}>{label}</span>;
}

export function SensBadge({ value }: { value: string }) {
  const { t } = useApp();
  const c = value === 'confidential' || value === 'restricted' ? 'red' : value === 'internal' ? 'amber' : 'gray';
  return (
    <span className={'badge s-' + c} style={{ fontSize: 11 }}>
      <Icon name="lock" size={10} sw={2.4} />
      {t('sv.' + value)}
    </span>
  );
}
