export const belanjaData = [
  { id: 1, no: 1, tanggal: '02 Mei 2026', uraian: 'Belanja Alat Tulis Kantor', bagian: 'Bagian Keuangan', nilaiAngka: 25000000, nilai: 'Rp 25.000.000', status: 'Disetujui' },
  { id: 2, no: 2, tanggal: '05 Mei 2026', uraian: 'Perjalanan Dinas Luar Daerah', bagian: 'Bagian Perencanaan', nilaiAngka: 15500000, nilai: 'Rp 15.500.000', status: 'Verifikasi' },
  { id: 3, no: 3, tanggal: '10 Mei 2026', uraian: 'Pemeliharaan Kendaraan Dinas', bagian: 'Bagian Umum', nilaiAngka: 8200000, nilai: 'Rp 8.200.000', status: 'Draft' },
];

export const dpaList = [
  { id: 1, bagian: 'Bagian Keuangan', program: 'Program Penunjang Urusan Pemerintahan Daerah', kegiatan: 'Perencanaan, Penganggaran, dan Evaluasi', subKegiatan: 'Penyusunan Dokumen Perencanaan', nilaiAnggaran: 250000000 },
  { id: 2, bagian: 'Bagian Umum', program: 'Program Penunjang Urusan Pemerintahan Daerah', kegiatan: 'Administrasi Umum Perangkat Daerah', subKegiatan: 'Penyediaan Komponen Instalasi Listrik', nilaiAnggaran: 150000000 },
  { id: 3, bagian: 'Bagian Perencanaan', program: 'Program Perencanaan Pengendalian Pembangunan', kegiatan: 'Penyusunan Rencana Pembangunan', subKegiatan: 'Penyusunan Rencana Kerja (RKPD)', nilaiAnggaran: 300000000 },
];

export const dpaNestedData = [
  {
    id: 'B1',
    tipe: 'Bagian',
    kode: '4.01.0.00.0.00.01.0000',
    uraian: 'Sekretariat Daerah',
    totalAnggaran: 22569501129,
    rencanaKas: 22569501129,
    children: [
      {
        id: 'P1',
        tipe: 'Program',
        kode: '4.01.01',
        uraian: 'PROGRAM PENUNJANG URUSAN PEMERINTAHAN DAERAH',
        totalAnggaran: 13804658643,
        rencanaKas: 13804658643,
        children: [
          {
            id: 'K1',
            tipe: 'Kegiatan',
            kode: '1.01.01.2.01',
            uraian: 'Perencanaan, Penganggaran, dan Evaluasi Kinerja Perangkat Daerah',
            totalAnggaran: 50106500,
            rencanaKas: 50106500,
            children: [
              {
                id: 'SK1',
                tipe: 'Sub Kegiatan',
                kode: '1.01.01.2.01.0002',
                uraian: 'Koordinasi dan Penyusunan Dokumen RKA-SKPD',
                totalAnggaran: 2979000,
                rencanaKas: 2979000,
                rincianBelanja: [
                  { id: 'RB1', kode: '5.1.02.02.01.0013', uraian: 'Belanja Lembur', sumberDana: 'Dana Umum', hargaSatuan: 2979000, total: 2979000, rak: 2979000 }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];

export const anggaranData = [
  { id: 1, bagian: 'Bagian Keuangan', totalAnggaran: 100000000 },
  { id: 2, bagian: 'Bagian Umum', totalAnggaran: 75000000 },
  { id: 3, bagian: 'Bagian Perencanaan', totalAnggaran: 50000000 },
];

export const arsipData = [
  { id: 1, no: 1, nomorDokumen: 'ARS-2026-001', jenisDokumen: 'Dokumen SPJ', tanggalArsip: '10 Mei 2026', keterangan: 'Lengkap' },
  { id: 2, no: 2, nomorDokumen: 'ARS-2026-002', jenisDokumen: 'Bukti Bayar', tanggalArsip: '12 Mei 2026', keterangan: 'Valid' },
  { id: 3, no: 3, nomorDokumen: 'ARS-2026-003', jenisDokumen: 'Nota Dinas', tanggalArsip: '15 Mei 2026', keterangan: 'Menunggu TTD' },
];
