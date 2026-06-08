export type DocumentType = 'law' | 'decree' | 'circular' | 'decision' | 'policy' | 'sop' | 'other';
export type FreshnessStatus = 'effective' | 'amended' | 'repealed' | 'draft' | 'obsolete' | 'unknown';
export type ProcessingStatus = 'pending' | 'processing' | 'ready' | 'error';
export type Sensitivity = 'public' | 'internal' | 'confidential' | 'restricted';
export type AnswerClass = 'direct_cited' | 'summary' | 'procedural' | 'abstain';

export interface CorpusItem {
  id: string;
  fileName: string;
  documentType: DocumentType;
  issuingBody: string;
  effectiveDate: string;
  freshnessStatus: FreshnessStatus;
  sensitivity: Sensitivity;
  processingStatus: ProcessingStatus;
  topicTags: string[];
  matchedSection?: string;
  sourcePath: string;
  normalizedPath: string;
  sourceHash: string;
  jurisdiction: string;
  authorityLevel: string;
}

export interface QueryEntry {
  id: string;
  kind: 'chat' | 'search';
  text: string;
  answerClass?: AnswerClass;
  sources?: number;
  results?: number;
  time: string;
  date: string;
  provider?: string;
}

const C = (
  id: string, fileName: string, doctype: DocumentType, body: string, eff: string,
  fresh: FreshnessStatus, sens: Sensitivity, status: ProcessingStatus, tags: string[], sect?: string
): CorpusItem => ({
  id, fileName, documentType: doctype, issuingBody: body, effectiveDate: eff,
  freshnessStatus: fresh, sensitivity: sens, processingStatus: status, topicTags: tags,
  matchedSection: sect,
  sourcePath: `mock-corpus/${id}.md`,
  normalizedPath: `mock-corpus/${id}.md`,
  sourceHash: `prototype-only-${id}`,
  jurisdiction: (doctype === 'policy' || doctype === 'sop') ? 'company_internal' : 'VN',
  authorityLevel: ({ law: 'national_law', decree: 'government_decree', circular: 'ministerial_circular', decision: 'official_decision', policy: 'company_policy', sop: 'company_sop', other: 'unknown' } as Record<string, string>)[doctype] ?? 'unknown',
});

export const CORPUS: CorpusItem[] = [
  C('ci_01', 'Luật Doanh nghiệp số 59/2020/QH14', 'law', 'Quốc hội', '2021-01-01', 'effective', 'public', 'ready', ['doanh nghiệp', 'cổ đông', 'quản trị'], 'Điều 115 — Quyền của cổ đông phổ thông'),
  C('ci_02', 'Luật Bảo hiểm xã hội số 58/2014/QH13', 'law', 'Quốc hội', '2016-01-01', 'amended', 'public', 'ready', ['BHXH', 'lao động', 'hưu trí'], 'Điều 85 — Mức đóng và phương thức đóng của người lao động'),
  C('ci_03', 'Bộ luật Lao động số 45/2019/QH14', 'law', 'Quốc hội', '2021-01-01', 'effective', 'public', 'ready', ['lao động', 'hợp đồng', 'nghỉ phép'], 'Điều 113 — Nghỉ hằng năm'),
  C('ci_04', 'Luật Đầu tư số 61/2020/QH14', 'law', 'Quốc hội', '2021-01-01', 'effective', 'public', 'ready', ['đầu tư', 'ưu đãi', 'ngành nghề']),
  C('ci_05', 'Nghị định 145/2020/NĐ-CP', 'decree', 'Chính phủ', '2021-02-01', 'effective', 'public', 'ready', ['lao động', 'tiền lương', 'hướng dẫn'], 'Điều 65 — Thời giờ làm thêm trong năm'),
  C('ci_06', 'Nghị định 12/2022/NĐ-CP về xử phạt vi phạm hành chính lĩnh vực lao động', 'decree', 'Chính phủ', '2022-01-17', 'effective', 'public', 'ready', ['xử phạt', 'lao động', 'BHXH']),
  C('ci_07', 'Thông tư 10/2020/TT-BLĐTBXH', 'circular', 'Bộ LĐ-TB&XH', '2021-01-01', 'effective', 'public', 'ready', ['hợp đồng lao động', 'biểu mẫu']),
  C('ci_08', 'Thông tư 111/2013/TT-BTC về thuế thu nhập cá nhân', 'circular', 'Bộ Tài chính', '2013-10-01', 'amended', 'public', 'ready', ['thuế', 'TNCN', 'giảm trừ']),
  C('ci_09', 'Quyết định 595/QĐ-BHXH về quy trình thu BHXH, BHYT', 'decision', 'Bảo hiểm xã hội VN', '2017-07-01', 'amended', 'public', 'ready', ['BHXH', 'BHYT', 'quy trình']),
  C('ci_10', 'Luật Bảo hiểm xã hội số 41/2024/QH15', 'law', 'Quốc hội', '2025-07-01', 'draft', 'public', 'ready', ['BHXH', 'sửa đổi', 'hưu trí'], 'Điều 33 — Mức đóng bảo hiểm xã hội bắt buộc'),
  C('ci_11', 'Quy chế quản lý nhân sự nội bộ — Phiên bản 2025', 'policy', 'Phòng Nhân sự', '2025-01-01', 'effective', 'internal', 'ready', ['nhân sự', 'nội bộ', 'quy chế'], 'Mục 4.2 — Quy trình phê duyệt nghỉ phép'),
  C('ci_12', 'SOP-HR-007: Quy trình onboarding nhân viên mới', 'sop', 'Phòng Nhân sự', '2024-06-15', 'effective', 'internal', 'ready', ['onboarding', 'SOP', 'nhân sự']),
  C('ci_13', 'Quyết định 1234/QĐ-CT về cơ cấu tổ chức (đã thay thế)', 'decision', 'Hội đồng quản trị', '2022-03-01', 'repealed', 'confidential', 'ready', ['tổ chức', 'nội bộ']),
  C('ci_14', 'Chính sách bảo mật thông tin nội bộ', 'policy', 'Phòng CNTT', '2023-09-01', 'effective', 'confidential', 'ready', ['bảo mật', 'CNTT', 'nội bộ']),
  C('ci_15', 'Thông tư 39/2014/TT-BTC về hóa đơn (hết hiệu lực)', 'circular', 'Bộ Tài chính', '2014-06-01', 'repealed', 'public', 'ready', ['hóa đơn', 'thuế']),
  C('ci_16', 'Nghị định 123/2020/NĐ-CP về hóa đơn, chứng từ', 'decree', 'Chính phủ', '2020-10-19', 'effective', 'public', 'processing', ['hóa đơn', 'chứng từ', 'thuế']),
];

export const QUERIES: QueryEntry[] = [
  { id: 'q1', kind: 'chat', text: 'Mức đóng BHXH của người lao động là bao nhiêu?', answerClass: 'direct_cited', sources: 2, time: '14:32', date: '02/06', provider: 'Anthropic' },
  { id: 'q2', kind: 'search', text: 'quyền cổ đông phổ thông', results: 12, time: '14:15', date: '02/06' },
  { id: 'q3', kind: 'chat', text: 'Số ngày nghỉ phép năm tối thiểu theo luật?', answerClass: 'direct_cited', sources: 1, time: '11:48', date: '02/06', provider: 'Anthropic' },
  { id: 'q4', kind: 'chat', text: 'Thủ tục xin nghỉ thai sản công ty quy định thế nào?', answerClass: 'summary', sources: 1, time: '10:20', date: '02/06', provider: 'Anthropic' },
  { id: 'q5', kind: 'chat', text: 'Mức phạt khi sa thải trái pháp luật là bao nhiêu tiền?', answerClass: 'abstain', sources: 0, time: '09:41', date: '02/06' },
  { id: 'q6', kind: 'search', text: 'thời giờ làm thêm tối đa', results: 5, time: '09:12', date: '02/06' },
  { id: 'q7', kind: 'search', text: 'giảm trừ gia cảnh thuế TNCN', results: 8, time: '16:55', date: '01/06' },
];

export const STATS = { total: 247, ready: 231, pending: 3, error: 1, queries: 1842, effective: 198, amended: 31, repealed: 12, draft: 2, unknown: 4, flagged: 16 };

export const CROSS_REFS: Record<string, { type: string; target: string | null; note: string }> = {
  ci_02: { type: 'amended_by', target: 'ci_10', note: 'Một số điều khoản được sửa đổi bởi Luật BHXH 2024, hiệu lực 01/07/2025.' },
  ci_15: { type: 'replaced_by', target: 'ci_16', note: 'Hết hiệu lực, thay thế bởi Nghị định 123/2020/NĐ-CP.' },
  ci_13: { type: 'replaced_by', target: null, note: 'Đã thay thế bởi Quyết định 2025/QĐ-CT (chưa nhập corpus).' },
  ci_09: { type: 'amended_by', target: null, note: 'Sửa đổi bởi QĐ 505/QĐ-BHXH và QĐ 490/QĐ-BHXH.' },
  ci_08: { type: 'amended_by', target: null, note: 'Sửa đổi, bổ sung bởi Thông tư 92/2015/TT-BTC.' },
};

export const REPORTS = {
  kpi: {
    queries: { value: 1842, delta: 12.4 },
    citeRate: { value: 86, delta: 3.1 },
    abstainRate: { value: 9, delta: -2.4 },
    avgSources: { value: 1.7, delta: 0.2 },
  },
  volume: [
    { d: '20/05', chat: 22, search: 31 }, { d: '21/05', chat: 28, search: 26 },
    { d: '22/05', chat: 19, search: 34 }, { d: '23/05', chat: 35, search: 29 },
    { d: '24/05', chat: 14, search: 18 }, { d: '25/05', chat: 9, search: 12 },
    { d: '26/05', chat: 31, search: 40 }, { d: '27/05', chat: 42, search: 37 },
    { d: '28/05', chat: 38, search: 44 }, { d: '29/05', chat: 33, search: 39 },
    { d: '30/05', chat: 17, search: 21 }, { d: '31/05', chat: 11, search: 15 },
    { d: '01/06', chat: 45, search: 52 }, { d: '02/06', chat: 48, search: 49 },
  ],
  answerMix: [
    { k: 'direct_cited', value: 58, color: 'var(--green-solid)' },
    { k: 'summary', value: 21, color: 'var(--blue-solid)' },
    { k: 'procedural', value: 12, color: 'var(--amber-solid)' },
    { k: 'abstain', value: 9, color: 'var(--red-solid)' },
  ],
  corpusComp: [
    { k: 'law', value: 64 }, { k: 'decree', value: 52 }, { k: 'circular', value: 48 },
    { k: 'decision', value: 39 }, { k: 'policy', value: 28 }, { k: 'sop', value: 16 },
  ],
  topDocs: [
    { name: 'Luật BHXH 2014 (58/2014/QH13)', type: 'law', count: 142 },
    { name: 'Bộ luật Lao động 2019 (45/2019/QH14)', type: 'law', count: 118 },
    { name: 'Nghị định 145/2020/NĐ-CP', type: 'decree', count: 87 },
    { name: 'Luật Doanh nghiệp 2020 (59/2020/QH14)', type: 'law', count: 74 },
    { name: 'Thông tư 111/2013/TT-BTC', type: 'circular', count: 53 },
  ],
  topQueries: [
    { q: 'mức đóng BHXH', count: 96 }, { q: 'nghỉ phép năm', count: 81 },
    { q: 'thời giờ làm thêm', count: 67 }, { q: 'giảm trừ gia cảnh', count: 54 },
    { q: 'quyền cổ đông', count: 43 },
  ],
  spark: {
    queries: [120, 138, 129, 152, 96, 60, 171, 188, 174, 162, 96, 184],
    citeRate: [80, 82, 81, 83, 84, 85, 84, 86, 85, 86, 87, 86],
    abstainRate: [13, 12, 12, 11, 11, 10, 11, 9, 10, 9, 9, 9],
    avgSources: [1.4, 1.5, 1.5, 1.6, 1.5, 1.6, 1.7, 1.6, 1.7, 1.7, 1.8, 1.7],
  },
  heatmap: Array.from({ length: 84 }, (_, i) => {
    const wd = i % 7;
    const base = wd === 5 || wd === 6 ? 4 : 22;
    return Math.max(0, Math.round(base + 18 * Math.sin(i / 5) + (i % 3) * 6 + (i > 70 ? 14 : 0)));
  }),
  gaps: [
    { topic: 'Xử phạt sa thải trái pháp luật', asked: 17, status: 'abstain', note: 'Chưa có văn bản nguồn' },
    { topic: 'Thuế tối thiểu toàn cầu', asked: 11, status: 'abstain', note: 'Ngoài phạm vi corpus' },
    { topic: 'Bảo hiểm thất nghiệp 2025', asked: 9, status: 'weak', note: 'Chỉ có bản dự thảo' },
    { topic: 'Hợp đồng điện tử', asked: 6, status: 'weak', note: 'Nguồn cũ, cần cập nhật' },
  ],
};

export const COLLECTIONS = [
  { id: 'col1', name: 'Hồ sơ BHXH 2025', count: 8, updated: '02/06/2026', color: 'blue' },
  { id: 'col2', name: 'Quy chế nhân sự nội bộ', count: 14, updated: '28/05/2026', color: 'green' },
  { id: 'col3', name: 'Văn bản cần rà soát', count: 16, updated: '01/06/2026', color: 'amber' },
];

export const SAVED_SEARCHES = [
  { id: 'ss1', query: 'nghỉ phép năm', filters: 'Luật · Hiệu lực', count: 6 },
  { id: 'ss2', query: 'mức đóng bảo hiểm', filters: 'Luật · Nghị định', count: 9 },
  { id: 'ss3', query: 'xử phạt vi phạm lao động', filters: 'Nghị định', count: 4 },
];
