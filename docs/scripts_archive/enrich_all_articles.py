#!/usr/bin/env python
"""Enrich all articles with realistic KMS data including embedded media."""
import os
import django
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.content.models import Article

# Article enrichment data with various content types
articles_data = [
    {
        "id": 1,
        "title_id": "Panduan Sistem Manajemen Pengetahuan DPD RI",
        "title_en": "DPD RI Knowledge Management System Guide",
        "summary_id": "Panduan lengkap tentang fitur-fitur KMS, cara penggunaan, dan best practices dalam mengelola pengetahuan organisasi.",
        "summary_en": "Comprehensive guide about KMS features, usage instructions, and best practices for managing organizational knowledge.",
        "content_id": """
<h1>Panduan Sistem Manajemen Pengetahuan DPD RI</h1>

<p>Selamat datang di Sistem Manajemen Pengetahuan (KMS) Dewan Perwakilan Daerah Republik Indonesia. Platform ini dirancang untuk memfasilitasi akses informasi, kolaborasi, dan berbagi pengetahuan di seluruh organisasi.</p>

<h2>Fitur Utama</h2>

<p>Platform kami menyediakan beberapa fitur unggulan:</p>

<ul>
<li><strong>Manajemen Konten Bilingual:</strong> Dukungan penuh untuk Bahasa Indonesia dan Inggris</li>
<li><strong>Sistem Kategorisasi:</strong> Organisasi informasi yang efisien dengan kategori hierarki</li>
<li><strong>Version Control:</strong> Pelacakan perubahan dan riwayat revisi</li>
<li><strong>Access Control:</strong> Manajemen akses berbasis peran</li>
<li><strong>Search & Filter:</strong> Pencarian canggih dengan filter mendalam</li>
</ul>

<h2>Video Pengantar</h2>

<p>Tonton video pengantar singkat tentang KMS DPD RI:</p>

<div style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px; margin: 20px 0;">
<iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; border-radius: 8px;" 
src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
title="KMS Introduction" 
allowfullscreen="" 
loading="lazy">
</iframe>
</div>

<h2>Mulai Menggunakan</h2>

<p>Langkah-langkah untuk memulai:</p>

<ol>
<li>Login dengan akun organisasi Anda</li>
<li>Jelajahi kategori dan artikel yang tersedia</li>
<li>Gunakan fitur pencarian untuk menemukan informasi spesifik</li>
<li>Berikan feedback dan saran untuk peningkatan sistem</li>
</ol>

<p>Untuk bantuan lebih lanjut, hubungi tim support di support@dpd.go.id</p>
""",
        "content_en": """
<h1>DPD RI Knowledge Management System Guide</h1>

<p>Welcome to the Knowledge Management System (KMS) of the Regional Representative Council of the Republic of Indonesia. This platform is designed to facilitate information access, collaboration, and knowledge sharing across the organization.</p>

<h2>Main Features</h2>

<p>Our platform provides several key features:</p>

<ul>
<li><strong>Bilingual Content Management:</strong> Full support for Indonesian and English languages</li>
<li><strong>Categorization System:</strong> Efficient information organization with hierarchical categories</li>
<li><strong>Version Control:</strong> Change tracking and revision history</li>
<li><strong>Access Control:</strong> Role-based access management</li>
<li><strong>Search & Filter:</strong> Advanced search with deep filtering</li>
</ul>

<h2>Introduction Video</h2>

<p>Watch a short introduction video about DPD RI KMS:</p>

<div style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px; margin: 20px 0;">
<iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; border-radius: 8px;" 
src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
title="KMS Introduction" 
allowfullscreen="" 
loading="lazy">
</iframe>
</div>

<h2>Getting Started</h2>

<p>Steps to get started:</p>

<ol>
<li>Login with your organization account</li>
<li>Explore available categories and articles</li>
<li>Use the search feature to find specific information</li>
<li>Provide feedback and suggestions for system improvements</li>
</ol>

<p>For further assistance, contact the support team at support@dpd.go.id</p>
""",
        "view_count": 2156,
        "like_count": 342
    },
    {
        "id": 2,
        "title_id": "Prosedur Keamanan Data Organisasi",
        "title_en": "Organizational Data Security Procedures",
        "summary_id": "Panduan komprehensif tentang protokol keamanan, enkripsi, dan best practices untuk melindungi data sensitif organisasi.",
        "summary_en": "Comprehensive guide on security protocols, encryption, and best practices to protect sensitive organizational data.",
        "content_id": """
<h1>Prosedur Keamanan Data Organisasi</h1>

<p>Keamanan data adalah prioritas utama dalam operasional DPD RI. Dokumen ini menjelaskan prosedur dan protokol keamanan yang harus diikuti oleh semua pengguna sistem.</p>

<h2>Prinsip Keamanan Utama</h2>

<ul>
<li><strong>Confidentiality:</strong> Hanya pengguna yang berwenang dapat mengakses data sensitif</li>
<li><strong>Integrity:</strong> Data tidak boleh diubah tanpa otorisasi</li>
<li><strong>Availability:</strong> Sistem harus selalu tersedia untuk pengguna yang berhak</li>
<li><strong>Accountability:</strong> Semua aktivitas harus dicatat dan dapat dilacak</li>
</ul>

<h2>Protokol Enkripsi</h2>

<p>Sistem menggunakan enkripsi end-to-end untuk semua komunikasi:</p>

<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
<tr style="background-color: #f2f2f2;">
<th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Layer</th>
<th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Teknologi</th>
<th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Standar</th>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 12px;">Transport</td>
<td style="border: 1px solid #ddd; padding: 12px;">TLS</td>
<td style="border: 1px solid #ddd; padding: 12px;">TLS 1.3 (RFC 8446)</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="border: 1px solid #ddd; padding: 12px;">Database</td>
<td style="border: 1px solid #ddd; padding: 12px;">AES-256</td>
<td style="border: 1px solid #ddd; padding: 12px;">AES Encryption Standard</td>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 12px;">Backup</td>
<td style="border: 1px solid #ddd; padding: 12px;">AES-256</td>
<td style="border: 1px solid #ddd; padding: 12px;">Encrypted Storage</td>
</tr>
</table>

<h2>Manajemen Password</h2>

<p>Kebijakan password yang ketat:</p>

<ul>
<li>Minimal 12 karakter dengan kombinasi uppercase, lowercase, angka, dan simbol</li>
<li>Password harus diubah setiap 90 hari</li>
<li>Jangan bagikan password dengan siapapun</li>
<li>Gunakan password manager untuk menyimpan password dengan aman</li>
</ul>

<h2>Audit Trail</h2>

<p>Semua aktivitas pengguna dicatat dalam audit log:</p>

<ul>
<li>Login dan logout</li>
<li>Akses dokumen</li>
<li>Perubahan data</li>
<li>Pemberian dan pencabutan akses</li>
<li>Aktivitas administratif</li>
</ul>

<p>Audit log disimpan minimal selama 7 tahun untuk keperluan compliance dan investigasi.</p>

<h2>Incident Response</h2>

<p>Jika terjadi insiden keamanan, segera lapor kepada tim security:</p>

<ul>
<li>Email: security@dpd.go.id</li>
<li>Telepon: +62-81-3948-4805</li>
<li>Response time: &lt;2 jam untuk insiden kritis</li>
</ul>
""",
        "content_en": """
<h1>Organizational Data Security Procedures</h1>

<p>Data security is a top priority in DPD RI operations. This document outlines the security procedures and protocols that must be followed by all system users.</p>

<h2>Core Security Principles</h2>

<ul>
<li><strong>Confidentiality:</strong> Only authorized users can access sensitive data</li>
<li><strong>Integrity:</strong> Data must not be altered without authorization</li>
<li><strong>Availability:</strong> System must always be available to authorized users</li>
<li><strong>Accountability:</strong> All activities must be recorded and traceable</li>
</ul>

<h2>Encryption Protocols</h2>

<p>The system uses end-to-end encryption for all communications:</p>

<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
<tr style="background-color: #f2f2f2;">
<th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Layer</th>
<th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Technology</th>
<th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Standard</th>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 12px;">Transport</td>
<td style="border: 1px solid #ddd; padding: 12px;">TLS</td>
<td style="border: 1px solid #ddd; padding: 12px;">TLS 1.3 (RFC 8446)</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="border: 1px solid #ddd; padding: 12px;">Database</td>
<td style="border: 1px solid #ddd; padding: 12px;">AES-256</td>
<td style="border: 1px solid #ddd; padding: 12px;">AES Encryption Standard</td>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 12px;">Backup</td>
<td style="border: 1px solid #ddd; padding: 12px;">AES-256</td>
<td style="border: 1px solid #ddd; padding: 12px;">Encrypted Storage</td>
</tr>
</table>

<h2>Password Management</h2>

<p>Strict password policy:</p>

<ul>
<li>Minimum 12 characters with combination of uppercase, lowercase, numbers, and symbols</li>
<li>Password must be changed every 90 days</li>
<li>Never share your password with anyone</li>
<li>Use password manager to securely store passwords</li>
</ul>

<h2>Audit Trail</h2>

<p>All user activities are logged in the audit log:</p>

<ul>
<li>Login and logout</li>
<li>Document access</li>
<li>Data changes</li>
<li>Access grants and revocations</li>
<li>Administrative activities</li>
</ul>

<p>Audit logs are retained for a minimum of 7 years for compliance and investigation purposes.</p>

<h2>Incident Response</h2>

<p>If a security incident occurs, report immediately to the security team:</p>

<ul>
<li>Email: security@dpd.go.id</li>
<li>Phone: +62-81-3948-4805</li>
<li>Response time: &lt;2 hours for critical incidents</li>
</ul>
""",
        "view_count": 1876,
        "like_count": 245
    },
    {
        "id": 3,
        "title_id": "Panduan API dan Integrasi Sistem",
        "title_en": "API and System Integration Guide",
        "summary_id": "Dokumentasi lengkap tentang REST API KMS, endpoint, authentication, rate limiting, dan contoh implementasi untuk developer.",
        "summary_en": "Complete documentation of KMS REST API, endpoints, authentication, rate limiting, and implementation examples for developers.",
        "content_id": """
<h1>Panduan API dan Integrasi Sistem</h1>

<p>KMS DPD RI menyediakan REST API yang powerful untuk integrasi dengan sistem eksternal. Dokumentasi ini menjelaskan semua endpoint, metode autentikasi, dan best practices.</p>

<h2>API Base URL</h2>

<pre style="background-color: #f4f4f4; padding: 12px; border-radius: 4px; overflow-x: auto;">
https://api.kms.dpd.go.id/v1
</pre>

<h2>Authentication</h2>

<p>Semua request harus menggunakan API Key yang valid:</p>

<pre style="background-color: #f4f4f4; padding: 12px; border-radius: 4px; overflow-x: auto;">
curl -H "Authorization: Bearer YOUR_API_KEY" https://api.kms.dpd.go.id/v1/articles
</pre>

<h2>Endpoint Utama</h2>

<h3>GET /articles</h3>

<p>Mendapatkan daftar artikel:</p>

<pre style="background-color: #f4f4f4; padding: 12px; border-radius: 4px; overflow-x: auto;">
GET /articles?category=news&amp;limit=10&amp;offset=0
</pre>

<p><strong>Response:</strong></p>

<pre style="background-color: #f4f4f4; padding: 12px; border-radius: 4px; overflow-x: auto;">
{
  "count": 150,
  "next": "https://api.kms.dpd.go.id/v1/articles?offset=10",
  "results": [
    {
      "id": 1,
      "title": "Article Title",
      "slug": "article-title",
      "content": "...",
      "view_count": 100,
      "like_count": 25,
      "published_at": "2026-01-12T10:00:00Z"
    }
  ]
}
</pre>

<h3>GET /articles/{id}</h3>

<p>Mendapatkan detail artikel spesifik.</p>

<h3>POST /articles</h3>

<p>Membuat artikel baru (memerlukan role Editor atau lebih tinggi).</p>

<h3>PUT /articles/{id}</h3>

<p>Memperbarui artikel (hanya untuk author atau reviewer).</p>

<h3>DELETE /articles/{id}</h3>

<p>Menghapus/mengarsipkan artikel (hanya untuk admin).</p>

<h2>Rate Limiting</h2>

<p>API membatasi request dengan rate limiting:</p>

<ul>
<li><strong>Free tier:</strong> 100 requests/hour</li>
<li><strong>Standard tier:</strong> 1,000 requests/hour</li>
<li><strong>Premium tier:</strong> Unlimited</li>
</ul>

<h2>Error Handling</h2>

<p>Sistem mengembalikan error dengan format standar:</p>

<pre style="background-color: #f4f4f4; padding: 12px; border-radius: 4px; overflow-x: auto;">
{
  "error": "Unauthorized",
  "status": 401,
  "message": "Invalid API Key"
}
</pre>

<h2>Tutorial Video - API Integration</h2>

<p>Tonton tutorial lengkap tentang integrasi API:</p>

<div style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px; margin: 20px 0;">
<iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; border-radius: 8px;" 
src="https://www.youtube.com/embed/tYzMGcUty6s" 
title="API Integration Tutorial" 
allowfullscreen="" 
loading="lazy">
</iframe>
</div>

<h2>Webhook Support</h2>

<p>KMS mendukung webhook untuk event-driven integration:</p>

<ul>
<li>Article published</li>
<li>Article updated</li>
<li>Comment added</li>
<li>User access changed</li>
</ul>

<p>Untuk setup webhook, kunjungi panel admin: Settings → Integrations → Webhooks</p>
""",
        "content_en": """
<h1>API and System Integration Guide</h1>

<p>KMS DPD RI provides a powerful REST API for integration with external systems. This documentation explains all endpoints, authentication methods, and best practices.</p>

<h2>API Base URL</h2>

<pre style="background-color: #f4f4f4; padding: 12px; border-radius: 4px; overflow-x: auto;">
https://api.kms.dpd.go.id/v1
</pre>

<h2>Authentication</h2>

<p>All requests must use a valid API Key:</p>

<pre style="background-color: #f4f4f4; padding: 12px; border-radius: 4px; overflow-x: auto;">
curl -H "Authorization: Bearer YOUR_API_KEY" https://api.kms.dpd.go.id/v1/articles
</pre>

<h2>Main Endpoints</h2>

<h3>GET /articles</h3>

<p>Get list of articles:</p>

<pre style="background-color: #f4f4f4; padding: 12px; border-radius: 4px; overflow-x: auto;">
GET /articles?category=news&amp;limit=10&amp;offset=0
</pre>

<p><strong>Response:</strong></p>

<pre style="background-color: #f4f4f4; padding: 12px; border-radius: 4px; overflow-x: auto;">
{
  "count": 150,
  "next": "https://api.kms.dpd.go.id/v1/articles?offset=10",
  "results": [
    {
      "id": 1,
      "title": "Article Title",
      "slug": "article-title",
      "content": "...",
      "view_count": 100,
      "like_count": 25,
      "published_at": "2026-01-12T10:00:00Z"
    }
  ]
}
</pre>

<h3>GET /articles/{id}</h3>

<p>Get specific article details.</p>

<h3>POST /articles</h3>

<p>Create a new article (requires Editor role or higher).</p>

<h3>PUT /articles/{id}</h3>

<p>Update an article (only for author or reviewer).</p>

<h3>DELETE /articles/{id}</h3>

<p>Delete/archive an article (only for admin).</p>

<h2>Rate Limiting</h2>

<p>API limits requests with rate limiting:</p>

<ul>
<li><strong>Free tier:</strong> 100 requests/hour</li>
<li><strong>Standard tier:</strong> 1,000 requests/hour</li>
<li><strong>Premium tier:</strong> Unlimited</li>
</ul>

<h2>Error Handling</h2>

<p>System returns errors in standard format:</p>

<pre style="background-color: #f4f4f4; padding: 12px; border-radius: 4px; overflow-x: auto;">
{
  "error": "Unauthorized",
  "status": 401,
  "message": "Invalid API Key"
}
</pre>

<h2>Video Tutorial - API Integration</h2>

<p>Watch the complete tutorial on API integration:</p>

<div style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px; margin: 20px 0;">
<iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; border-radius: 8px;" 
src="https://www.youtube.com/embed/tYzMGcUty6s" 
title="API Integration Tutorial" 
allowfullscreen="" 
loading="lazy">
</iframe>
</div>

<h2>Webhook Support</h2>

<p>KMS supports webhooks for event-driven integration:</p>

<ul>
<li>Article published</li>
<li>Article updated</li>
<li>Comment added</li>
<li>User access changed</li>
</ul>

<p>To setup webhooks, visit admin panel: Settings → Integrations → Webhooks</p>
""",
        "view_count": 3421,
        "like_count": 567
    },
    {
        "id": 4,
        "title_id": "Laporan Analisis Tren Kuartal Pertama 2026",
        "title_en": "Q1 2026 Trend Analysis Report",
        "summary_id": "Laporan analisis komprehensif tentang tren kegiatan organisasi, statistik penggunaan sistem, dan insight strategis untuk Q1 2026.",
        "summary_en": "Comprehensive analysis report on organizational activity trends, system usage statistics, and strategic insights for Q1 2026.",
        "content_id": """
<h1>Laporan Analisis Tren Kuartal Pertama 2026</h1>

<p>Laporan ini menyajikan analisis menyeluruh tentang tren kegiatan organisasi dan penggunaan Sistem Manajemen Pengetahuan selama kuartal pertama tahun 2026.</p>

<h2>Ringkasan Eksekutif</h2>

<ul>
<li><strong>Total Artikel Dipublikasi:</strong> 156 artikel</li>
<li><strong>Total Views:</strong> 45,230 views</li>
<li><strong>Pengguna Aktif:</strong> 1,245 pengguna</li>
<li><strong>Tingkat Engagement:</strong> 68% (meningkat 15% dari Q4 2025)</li>
</ul>

<h2>Data Statistik Terperinci</h2>

<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
<tr style="background-color: #f2f2f2;">
<th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Metrik</th>
<th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Januari</th>
<th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Februari</th>
<th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Maret</th>
<th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Total Q1</th>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 12px;">Artikel Baru</td>
<td style="border: 1px solid #ddd; padding: 12px;">48</td>
<td style="border: 1px solid #ddd; padding: 12px;">52</td>
<td style="border: 1px solid #ddd; padding: 12px;">56</td>
<td style="border: 1px solid #ddd; padding: 12px;">156</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="border: 1px solid #ddd; padding: 12px;">Total Views</td>
<td style="border: 1px solid #ddd; padding: 12px;">14,230</td>
<td style="border: 1px solid #ddd; padding: 12px;">15,450</td>
<td style="border: 1px solid #ddd; padding: 12px;">15,550</td>
<td style="border: 1px solid #ddd; padding: 12px;">45,230</td>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 12px;">Pengguna Aktif</td>
<td style="border: 1px solid #ddd; padding: 12px;">890</td>
<td style="border: 1px solid #ddd; padding: 12px;">1,050</td>
<td style="border: 1px solid #ddd; padding: 12px;">1,245</td>
<td style="border: 1px solid #ddd; padding: 12px;">1,245</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="border: 1px solid #ddd; padding: 12px;">Total Likes</td>
<td style="border: 1px solid #ddd; padding: 12px;">2,340</td>
<td style="border: 1px solid #ddd; padding: 12px;">2,890</td>
<td style="border: 1px solid #ddd; padding: 12px;">3,456</td>
<td style="border: 1px solid #ddd; padding: 12px;">8,686</td>
</tr>
</table>

<h2>Kategori Artikel Populer</h2>

<p>Kategori dengan engagement tertinggi:</p>

<ol>
<li><strong>Regulasi & Kebijakan:</strong> 35 artikel, 12,450 views (27.5%)</li>
<li><strong>Prosedur Operasional:</strong> 42 artikel, 11,230 views (24.8%)</li>
<li><strong>Dokumentasi Teknis:</strong> 28 artikel, 10,120 views (22.4%)</li>
<li><strong>Panduan Pengguna:</strong> 31 artikel, 8,950 views (19.8%)</li>
<li><strong>Berita & Pengumuman:</strong> 20 artikel, 2,480 views (5.5%)</li>
</ol>

<h2>Insight dan Rekomendasi</h2>

<h3>Positif</h3>

<ul>
<li>Peningkatan 15% dalam engagement dibandingkan quarter sebelumnya</li>
<li>Konten regulasi mendapat perhatian tertinggi dari pengguna</li>
<li>Sistem telah mencapai adoption rate 85% di kalangan staf</li>
<li>Fitur kolaborasi digunakan secara aktif oleh 60% pengguna</li>
</ul>

<h3>Area Perbaikan</h3>

<ul>
<li>Perlu peningkatan konten multimedia (video, infografis)</li>
<li>Sistem pencarian perlu optimasi untuk hasil yang lebih relevan</li>
<li>Mobile user experience memerlukan enhancement</li>
<li>Perlu pelatihan tambahan untuk fitur-fitur advanced</li>
</ul>

<h2>Rekomendasi Aksi</h2>

<p>Berdasarkan analisis, kami merekomendasikan:</p>

<ol>
<li>Fokus pada pembuatan konten video pendidikan</li>
<li>Implementasi AI-powered recommendations</li>
<li>Optimization aplikasi mobile</li>
<li>Penyelenggaraan workshop dan training rutin</li>
<li>Expansion ke social collaboration features</li>
</ol>

<p><em>Laporan ini disusun oleh Tim Analytics KMS pada 12 Januari 2026</em></p>
""",
        "content_en": """
<h1>Q1 2026 Trend Analysis Report</h1>

<p>This report presents a comprehensive analysis of organizational activity trends and Knowledge Management System usage during the first quarter of 2026.</p>

<h2>Executive Summary</h2>

<ul>
<li><strong>Total Articles Published:</strong> 156 articles</li>
<li><strong>Total Views:</strong> 45,230 views</li>
<li><strong>Active Users:</strong> 1,245 users</li>
<li><strong>Engagement Rate:</strong> 68% (up 15% from Q4 2025)</li>
</ul>

<h2>Detailed Statistics</h2>

<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
<tr style="background-color: #f2f2f2;">
<th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Metric</th>
<th style="border: 1px solid #ddd; padding: 12px; text-align: left;">January</th>
<th style="border: 1px solid #ddd; padding: 12px; text-align: left;">February</th>
<th style="border: 1px solid #ddd; padding: 12px; text-align: left;">March</th>
<th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Total Q1</th>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 12px;">New Articles</td>
<td style="border: 1px solid #ddd; padding: 12px;">48</td>
<td style="border: 1px solid #ddd; padding: 12px;">52</td>
<td style="border: 1px solid #ddd; padding: 12px;">56</td>
<td style="border: 1px solid #ddd; padding: 12px;">156</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="border: 1px solid #ddd; padding: 12px;">Total Views</td>
<td style="border: 1px solid #ddd; padding: 12px;">14,230</td>
<td style="border: 1px solid #ddd; padding: 12px;">15,450</td>
<td style="border: 1px solid #ddd; padding: 12px;">15,550</td>
<td style="border: 1px solid #ddd; padding: 12px;">45,230</td>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 12px;">Active Users</td>
<td style="border: 1px solid #ddd; padding: 12px;">890</td>
<td style="border: 1px solid #ddd; padding: 12px;">1,050</td>
<td style="border: 1px solid #ddd; padding: 12px;">1,245</td>
<td style="border: 1px solid #ddd; padding: 12px;">1,245</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="border: 1px solid #ddd; padding: 12px;">Total Likes</td>
<td style="border: 1px solid #ddd; padding: 12px;">2,340</td>
<td style="border: 1px solid #ddd; padding: 12px;">2,890</td>
<td style="border: 1px solid #ddd; padding: 12px;">3,456</td>
<td style="border: 1px solid #ddd; padding: 12px;">8,686</td>
</tr>
</table>

<h2>Popular Article Categories</h2>

<p>Categories with highest engagement:</p>

<ol>
<li><strong>Regulations & Policies:</strong> 35 articles, 12,450 views (27.5%)</li>
<li><strong>Operational Procedures:</strong> 42 articles, 11,230 views (24.8%)</li>
<li><strong>Technical Documentation:</strong> 28 articles, 10,120 views (22.4%)</li>
<li><strong>User Guides:</strong> 31 articles, 8,950 views (19.8%)</li>
<li><strong>News & Announcements:</strong> 20 articles, 2,480 views (5.5%)</li>
</ol>

<h2>Insights and Recommendations</h2>

<h3>Positive Findings</h3>

<ul>
<li>15% increase in engagement compared to previous quarter</li>
<li>Regulatory content receives highest user attention</li>
<li>System has achieved 85% adoption rate among staff</li>
<li>Collaboration features actively used by 60% of users</li>
</ul>

<h3>Areas for Improvement</h3>

<ul>
<li>Need to increase multimedia content (videos, infographics)</li>
<li>Search system requires optimization for more relevant results</li>
<li>Mobile user experience needs enhancement</li>
<li>Additional training needed for advanced features</li>
</ul>

<h2>Recommended Actions</h2>

<p>Based on the analysis, we recommend:</p>

<ol>
<li>Focus on creating educational video content</li>
<li>Implement AI-powered recommendations</li>
<li>Optimize mobile application</li>
<li>Conduct regular workshops and training</li>
<li>Expand social collaboration features</li>
</ol>

<p><em>Report prepared by KMS Analytics Team on January 12, 2026</em></p>
""",
        "view_count": 2654,
        "like_count": 198
    },
    {
        "id": 5,
        "title_id": "Tutorial: Cara Membuat Artikel Berkualitas di KMS",
        "title_en": "Tutorial: How to Create Quality Articles in KMS",
        "summary_id": "Panduan step-by-step tentang cara membuat artikel berkualitas dengan tips SEO, formatting, dan best practices untuk mendapatkan engagement maksimal.",
        "summary_en": "Step-by-step guide on how to create quality articles with SEO tips, formatting, and best practices for maximum engagement.",
        "content_id": """
<h1>Tutorial: Cara Membuat Artikel Berkualitas di KMS</h1>

<p>Artikel berkualitas adalah fondasi dari sistem manajemen pengetahuan yang efektif. Tutorial ini memandu Anda melalui proses pembuatan artikel yang menarik, informatif, dan mudah ditemukan di mesin pencari.</p>

<h2>Video Tutorial Lengkap</h2>

<p>Tonton video tutorial lengkap kami yang mencakup semua langkah pembuatan artikel:</p>

<div style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px; margin: 20px 0;">
<iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; border-radius: 8px;" 
src="https://www.youtube.com/embed/BXwYjMHLZ_s" 
title="Article Writing Tutorial" 
allowfullscreen="" 
loading="lazy">
</iframe>
</div>

<h2>Step 1: Persiapan</h2>

<h3>Tentukan Topik dan Target Audience</h3>

<p>Sebelum mulai menulis, tentukan:</p>

<ul>
<li>Topik artikel secara spesifik</li>
<li>Target pembaca (internal/external, expertise level)</li>
<li>Tujuan artikel (inform, educate, entertain)</li>
<li>Kata kunci yang ingin ditargetkan</li>
</ul>

<h3>Research dan Outline</h3>

<p>Lakukan research menyeluruh dan buat outline artikel:</p>

<ul>
<li>Kumpulkan sumber dan referensi</li>
<li>Tentukan struktur artikel (heading, subheading)</li>
<li>Identifikasi poin-poin kunci</li>
<li>Perencanaan visualisasi (image, table, list)</li>
</ul>

<h2>Step 2: Penulisan Konten</h2>

<h3>Judul yang Menarik dan SEO-Friendly</h3>

<p>Tips untuk judul yang efektif:</p>

<ul>
<li>Gunakan kata kunci utama di awal judul</li>
<li>Jangan lebih dari 60 karakter untuk optimal di search results</li>
<li>Buat judul yang descriptive dan menarik</li>
<li>Hindari clickbait atau judul yang menyesatkan</li>
</ul>

<h3>Penulisan Konten Body</h3>

<p>Panduan penulisan konten:</p>

<ol>
<li><strong>Gunakan Heading Hierarchy:</strong> H1 → H2 → H3 (jangan skip levels)</li>
<li><strong>Paragraph Pendek:</strong> Maksimal 3-4 kalimat per paragraph</li>
<li><strong>Gunakan Lists:</strong> Bullet points dan numbered lists untuk readability</li>
<li><strong>Highlight Penting:</strong> Gunakan bold untuk istilah penting</li>
<li><strong>Jarak Visual:</strong> Gunakan whitespace untuk memisahkan section</li>
</ol>

<h2>Step 3: Optimasi SEO</h2>

<p>Optimasi artikel untuk search engine:</p>

<ul>
<li><strong>Meta Description:</strong> Ringkas konten dalam 155 karakter</li>
<li><strong>Keywords:</strong> Gunakan kata kunci secara natural, hindari keyword stuffing</li>
<li><strong>Internal Links:</strong> Link ke artikel terkait di KMS</li>
<li><strong>Alt Text:</strong> Sertakan deskripsi untuk setiap gambar</li>
<li><strong>URL Structure:</strong> Gunakan slug yang descriptive dan readable</li>
</ul>

<h2>Step 4: Formatting dan Media</h2>

<h3>Penggunaan Heading</h3>

<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
<tr style="background-color: #f2f2f2;">
<th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Level</th>
<th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Penggunaan</th>
<th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Contoh</th>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 12px;">H1</td>
<td style="border: 1px solid #ddd; padding: 12px;">Judul artikel (hanya 1)</td>
<td style="border: 1px solid #ddd; padding: 12px;">Panduan KMS</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="border: 1px solid #ddd; padding: 12px;">H2</td>
<td style="border: 1px solid #ddd; padding: 12px;">Kategori/Section utama</td>
<td style="border: 1px solid #ddd; padding: 12px;">Fitur Utama</td>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 12px;">H3</td>
<td style="border: 1px solid #ddd; padding: 12px;">Subsection</td>
<td style="border: 1px solid #ddd; padding: 12px;">Manajemen Artikel</td>
</tr>
</table>

<h3>Media (Gambar dan Video)</h3>

<p>Gunakan media untuk meningkatkan engagement:</p>

<ul>
<li>Gunakan gambar dengan kualitas tinggi dan relevan</li>
<li>Optimasi ukuran gambar (max 300KB per image)</li>
<li>Sertakan captions di bawah gambar</li>
<li>Embed video dari YouTube untuk tutorial</li>
<li>Hindari penggunaan animated GIF yang besar</li>
</ul>

<h2>Step 5: Review dan Publikasi</h2>

<h3>Self Review Checklist</h3>

<ul>
<li>☐ Judul menarik dan deskriptif</li>
<li>☐ Konten grammatically correct</li>
<li>☐ Struktur logis dan mudah diikuti</li>
<li>☐ Media (gambar/video) relevan dan berkualitas</li>
<li>☐ Meta description dan keywords dioptimalkan</li>
<li>☐ Internal links ke artikel terkait ditambahkan</li>
<li>☐ Formatting konsisten di seluruh artikel</li>
<li>☐ Call-to-action jelas (jika diperlukan)</li>
</ul>

<h3>Submit untuk Review</h3>

<p>Sebelum publikasi, artikel harus melalui proses review:</p>

<ol>
<li>Submit artikel ke reviewer yang ditunjuk</li>
<li>Tunggu feedback dan saran perbaikan</li>
<li>Lakukan revisi sesuai feedback</li>
<li>Setelah approval, artikel ready untuk publikasi</li>
</ol>

<h2>Best Practices</h2>

<ul>
<li>Tulis dengan voice yang konsisten dan professional</li>
<li>Gunakan contoh nyata untuk illustrate konsep</li>
<li>Sertakan call-to-action yang clear</li>
<li>Update artikel secara berkala dengan informasi terbaru</li>
<li>Respons terhadap komentar dan pertanyaan pembaca</li>
<li>Monitor analytics untuk understand pembaca preferences</li>
</ul>

<p><em>Terakhir diupdate: 12 Januari 2026</em></p>
""",
        "content_en": """
<h1>Tutorial: How to Create Quality Articles in KMS</h1>

<p>Quality articles are the foundation of an effective knowledge management system. This tutorial guides you through the process of creating engaging, informative, and discoverable articles.</p>

<h2>Complete Video Tutorial</h2>

<p>Watch our comprehensive video tutorial covering all steps of article creation:</p>

<div style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px; margin: 20px 0;">
<iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; border-radius: 8px;" 
src="https://www.youtube.com/embed/BXwYjMHLZ_s" 
title="Article Writing Tutorial" 
allowfullscreen="" 
loading="lazy">
</iframe>
</div>

<h2>Step 1: Preparation</h2>

<h3>Determine Topic and Target Audience</h3>

<p>Before starting to write, determine:</p>

<ul>
<li>Specific article topic</li>
<li>Target readers (internal/external, expertise level)</li>
<li>Article purpose (inform, educate, entertain)</li>
<li>Target keywords</li>
</ul>

<h3>Research and Outline</h3>

<p>Conduct thorough research and create article outline:</p>

<ul>
<li>Collect sources and references</li>
<li>Determine article structure (headings, subheadings)</li>
<li>Identify key points</li>
<li>Plan visualizations (images, tables, lists)</li>
</ul>

<h2>Step 2: Content Writing</h2>

<h3>Attractive and SEO-Friendly Title</h3>

<p>Tips for effective titles:</p>

<ul>
<li>Use main keyword at the beginning of title</li>
<li>Keep under 60 characters for optimal search results display</li>
<li>Make title descriptive and engaging</li>
<li>Avoid clickbait or misleading titles</li>
</ul>

<h3>Body Content Writing</h3>

<p>Content writing guidelines:</p>

<ol>
<li><strong>Use Heading Hierarchy:</strong> H1 → H2 → H3 (don't skip levels)</li>
<li><strong>Short Paragraphs:</strong> Maximum 3-4 sentences per paragraph</li>
<li><strong>Use Lists:</strong> Bullet points and numbered lists for readability</li>
<li><strong>Highlight Important:</strong> Use bold for important terms</li>
<li><strong>Visual Space:</strong> Use whitespace to separate sections</li>
</ol>

<h2>Step 3: SEO Optimization</h2>

<p>Optimize article for search engines:</p>

<ul>
<li><strong>Meta Description:</strong> Summarize content in 155 characters</li>
<li><strong>Keywords:</strong> Use keywords naturally, avoid keyword stuffing</li>
<li><strong>Internal Links:</strong> Link to related articles in KMS</li>
<li><strong>Alt Text:</strong> Include descriptions for each image</li>
<li><strong>URL Structure:</strong> Use descriptive and readable slugs</li>
</ul>

<h2>Step 4: Formatting and Media</h2>

<h3>Heading Usage</h3>

<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
<tr style="background-color: #f2f2f2;">
<th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Level</th>
<th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Usage</th>
<th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Example</th>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 12px;">H1</td>
<td style="border: 1px solid #ddd; padding: 12px;">Article title (only 1)</td>
<td style="border: 1px solid #ddd; padding: 12px;">KMS Guide</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="border: 1px solid #ddd; padding: 12px;">H2</td>
<td style="border: 1px solid #ddd; padding: 12px;">Main categories/sections</td>
<td style="border: 1px solid #ddd; padding: 12px;">Main Features</td>
</tr>
<tr>
<td style="border: 1px solid #ddd; padding: 12px;">H3</td>
<td style="border: 1px solid #ddd; padding: 12px;">Subsections</td>
<td style="border: 1px solid #ddd; padding: 12px;">Article Management</td>
</tr>
</table>

<h3>Media (Images and Videos)</h3>

<p>Use media to increase engagement:</p>

<ul>
<li>Use high-quality and relevant images</li>
<li>Optimize image size (max 300KB per image)</li>
<li>Include captions below images</li>
<li>Embed videos from YouTube for tutorials</li>
<li>Avoid large animated GIFs</li>
</ul>

<h2>Step 5: Review and Publication</h2>

<h3>Self Review Checklist</h3>

<ul>
<li>☐ Title is attractive and descriptive</li>
<li>☐ Content is grammatically correct</li>
<li>☐ Structure is logical and easy to follow</li>
<li>☐ Media (images/videos) are relevant and quality</li>
<li>☐ Meta description and keywords are optimized</li>
<li>☐ Internal links to related articles are added</li>
<li>☐ Formatting is consistent throughout</li>
<li>☐ Call-to-action is clear (if needed)</li>
</ul>

<h3>Submit for Review</h3>

<p>Before publication, article must go through review process:</p>

<ol>
<li>Submit article to designated reviewer</li>
<li>Wait for feedback and improvement suggestions</li>
<li>Revise according to feedback</li>
<li>After approval, article is ready for publication</li>
</ol>

<h2>Best Practices</h2>

<ul>
<li>Write with consistent and professional voice</li>
<li>Use real examples to illustrate concepts</li>
<li>Include clear call-to-action</li>
<li>Update articles regularly with latest information</li>
<li>Respond to reader comments and questions</li>
<li>Monitor analytics to understand reader preferences</li>
</ul>

<p><em>Last updated: January 12, 2026</em></p>
""",
        "view_count": 1567,
        "like_count": 234
    }
]

print("\n" + "="*80)
print("ENRICHING ALL ARTICLES WITH REALISTIC KMS DATA")
print("="*80 + "\n")

updated_count = 0
for data in articles_data:
    article = Article.objects.filter(id=data["id"]).first()
    
    if not article:
        print(f"⚠️  Article ID {data['id']} not found, skipping...")
        continue
    
    print(f"📝 Updating Article {data['id']}: {data['title_id'][:50]}...")
    
    article.title_id = data["title_id"]
    article.title_en = data["title_en"]
    article.summary_id = data["summary_id"]
    article.summary_en = data["summary_en"]
    article.content_id = data["content_id"]
    article.content_en = data["content_en"]
    article.view_count = data["view_count"]
    article.like_count = data["like_count"]
    
    # Ensure published
    if article.status != 'published':
        article.status = 'published'
        article.is_published = True
        article.published_at = datetime.now()
    
    article.save()
    updated_count += 1
    print(f"   ✅ Updated - Content: {len(data['content_id'])} chars (ID), Views: {data['view_count']}, Likes: {data['like_count']}")

print("\n" + "="*80)
print(f"✅ SUCCESS: {updated_count} articles enriched with realistic KMS data!")
print("="*80)
print("\n📊 Articles now include:")
print("   • Long-form, comprehensive content (2000-6500+ characters each)")
print("   • Embedded YouTube videos for tutorials")
print("   • Professional formatting with headings, lists, and tables")
print("   • Realistic engagement metrics (views, likes)")
print("   • Bilingual content (Indonesian & English)")
print("   • SEO-optimized titles and descriptions")
print("   • Rich HTML formatting with proper structure")
print("\n🎯 Content types represented:")
print("   ✓ KMS System Guide with embedded video")
print("   ✓ Security Procedures with tables and data")
print("   ✓ API Documentation with code examples and tutorial video")
print("   ✓ Analytics Report with detailed statistics tables")
print("   ✓ Tutorial Guide with step-by-step instructions and video")
print("\n" + "="*80)
