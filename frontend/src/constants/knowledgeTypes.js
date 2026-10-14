/**
 * Klasifikasi Bentuk Pengetahuan
 * Sesuai PERATURAN SEKRETARIS JENDERAL DEWAN PERWAKILAN DAERAH REPUBLIK INDONESIA
 * NOMOR 8 TAHUN 2026 TENTANG MANAJEMEN PENGETAHUAN DI LINGKUNGAN SEKRETARIAT JENDERAL
 * DEWAN PERWAKILAN DAERAH REPUBLIK INDONESIA
 * 
 * Bab II: Bentuk dan Sumber Pengetahuan
 * Pasal 7: Bentuk Pengetahuan yang terdokumentasi dan terstandardisasi berupa:
 * a. buku, peraturan, kajian, jurnal;
 * b. ringkasan kebijakan atau policy brief;
 * c. laporan resmi, buletin, dan artikel Pengetahuan; dan/atau
 * d. infografis dan produk audiovisual.
 */

export const PERSEKJEN_REFERENCE = {
  nomor: 'Nomor 8 Tahun 2026',
  tentang: 'Manajemen Pengetahuan di Lingkungan Sekretariat Jenderal DPD RI',
  bab: 'Bab II: Bentuk dan Sumber Pengetahuan',
  pasal: 'Pasal 7',
  judul_lengkap: 'Peraturan Sekretaris Jenderal DPD RI No. 8 Tahun 2026 (Bab II Pasal 7)'
};

export const KNOWLEDGE_CLUSTERS = [
  {
    code: 'a',
    title_id: 'Buku, Peraturan, Kajian, Jurnal',
    title_en: 'Books, Regulations, Studies, Journals',
    short_title_id: 'Buku & Kajian',
    short_title_en: 'Books & Studies',
    pasal_ref: 'Pasal 7 huruf a',
    icon: 'book',
    color: '#2563eb', // Blue
    bgLight: 'rgba(37, 99, 235, 0.1)',
    description_id: 'Koleksi buku referensi, regulasi kelembagaan, hasil riset/kajian strategis, dan publikasi ilmiah jurnal.',
    description_en: 'Collection of reference books, institutional regulations, strategic research/studies, and journal publications.',
    types: ['buku', 'peraturan', 'kajian', 'jurnal']
  },
  {
    code: 'b',
    title_id: 'Ringkasan Kebijakan / Policy Brief',
    title_en: 'Policy Brief',
    short_title_id: 'Policy Brief',
    short_title_en: 'Policy Brief',
    pasal_ref: 'Pasal 7 huruf b',
    icon: 'briefcase',
    color: '#7c3aed', // Purple
    bgLight: 'rgba(124, 58, 237, 0.1)',
    description_id: 'Dokumen ringkas berbasis bukti yang menyajikan analisis isu dan rekomendasi kebijakan strategis bagi DPD RI.',
    description_en: 'Evidence-based concise documents presenting issue analysis and strategic policy recommendations for DPD RI.',
    types: ['policy_brief']
  },
  {
    code: 'c',
    title_id: 'Laporan Resmi, Buletin, dan Artikel Pengetahuan',
    title_en: 'Official Reports, Bulletins, and Knowledge Articles',
    short_title_id: 'Laporan & Artikel',
    short_title_en: 'Reports & Articles',
    pasal_ref: 'Pasal 7 huruf c',
    icon: 'layers',
    color: '#0d9488', // Teal
    bgLight: 'rgba(13, 148, 136, 0.1)',
    description_id: 'Laporan kinerja dan persidangan resmi, buletin periodik kelembagaan, serta artikel berbagi pengetahuan ASN.',
    description_en: 'Official performance and session reports, institutional bulletins, and ASN knowledge sharing articles.',
    types: ['laporan_resmi', 'buletin', 'artikel']
  },
  {
    code: 'd',
    title_id: 'Infografis dan Produk Audiovisual',
    title_en: 'Infographics and Audiovisual Products',
    short_title_id: 'Infografis & Multimedia',
    short_title_en: 'Infographics & Media',
    pasal_ref: 'Pasal 7 huruf d',
    icon: 'activity',
    color: '#ea580c', // Orange
    bgLight: 'rgba(234, 88, 12, 0.1)',
    description_id: 'Visualisasi data ringkas (infografis), podcast, video tutorial, dokumentasi persidangan, dan produk multimedia kreatif.',
    description_en: 'Data visualizations (infographics), podcasts, video tutorials, session documentations, and creative multimedia.',
    types: ['infografis', 'audiovisual']
  }
];

export const KNOWLEDGE_TYPES = {
  buku: {
    id: 'buku',
    name_id: 'Buku',
    name_en: 'Book',
    cluster: 'a',
    icon: 'book',
    emoji: '📚',
    color: '#1d4ed8',
    pasal_ref: 'Pasal 7 huruf a'
  },
  peraturan: {
    id: 'peraturan',
    name_id: 'Peraturan',
    name_en: 'Regulation',
    cluster: 'a',
    icon: 'shield',
    emoji: '⚖️',
    color: '#0284c7',
    pasal_ref: 'Pasal 7 huruf a'
  },
  kajian: {
    id: 'kajian',
    name_id: 'Kajian',
    name_en: 'Study / Research',
    cluster: 'a',
    icon: 'search',
    emoji: '🔬',
    color: '#4338ca',
    pasal_ref: 'Pasal 7 huruf a'
  },
  jurnal: {
    id: 'jurnal',
    name_id: 'Jurnal',
    name_en: 'Journal',
    cluster: 'a',
    icon: 'file-text',
    emoji: '📑',
    color: '#3b82f6',
    pasal_ref: 'Pasal 7 huruf a'
  },
  policy_brief: {
    id: 'policy_brief',
    name_id: 'Ringkasan Kebijakan (Policy Brief)',
    name_en: 'Policy Brief',
    cluster: 'b',
    icon: 'briefcase',
    emoji: '📋',
    color: '#7c3aed',
    pasal_ref: 'Pasal 7 huruf b'
  },
  laporan_resmi: {
    id: 'laporan_resmi',
    name_id: 'Laporan Resmi',
    name_en: 'Official Report',
    cluster: 'c',
    icon: 'bar-chart',
    emoji: '📊',
    color: '#0891b2',
    pasal_ref: 'Pasal 7 huruf c'
  },
  buletin: {
    id: 'buletin',
    name_id: 'Buletin',
    name_en: 'Bulletin',
    cluster: 'c',
    icon: 'newspaper',
    emoji: '📰',
    color: '#059669',
    pasal_ref: 'Pasal 7 huruf c'
  },
  artikel: {
    id: 'artikel',
    name_id: 'Artikel Pengetahuan',
    name_en: 'Knowledge Article',
    cluster: 'c',
    icon: 'file-text',
    emoji: '📝',
    color: '#0d9488',
    pasal_ref: 'Pasal 7 huruf c'
  },
  infografis: {
    id: 'infografis',
    name_id: 'Infografis',
    name_en: 'Infographic',
    cluster: 'd',
    icon: 'image',
    emoji: '🖼️',
    color: '#d97706',
    pasal_ref: 'Pasal 7 huruf d'
  },
  audiovisual: {
    id: 'audiovisual',
    name_id: 'Produk Audiovisual',
    name_en: 'Audiovisual Product',
    cluster: 'd',
    icon: 'video',
    emoji: '🎥',
    color: '#ea580c',
    pasal_ref: 'Pasal 7 huruf d'
  }
};

/**
 * Get details for a given knowledge type ID
 */
export const getKnowledgeTypeInfo = (typeId) => {
  if (!typeId) return KNOWLEDGE_TYPES.artikel;
  const cleanId = String(typeId).toLowerCase().trim();
  return KNOWLEDGE_TYPES[cleanId] || {
    id: cleanId,
    name_id: cleanId,
    name_en: cleanId,
    cluster: 'c',
    icon: 'file-text',
    emoji: '📄',
    color: '#6b7280',
    pasal_ref: 'Pasal 7'
  };
};

/**
 * Get cluster details for a given cluster code ('a', 'b', 'c', or 'd')
 */
export const getKnowledgeClusterInfo = (clusterCode) => {
  if (!clusterCode) return null;
  const clean = String(clusterCode).toLowerCase().replace('cluster_', '').replace('klaster_', '').trim();
  return KNOWLEDGE_CLUSTERS.find(c => c.code === clean) || null;
};
