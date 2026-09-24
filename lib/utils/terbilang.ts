/**
 * Helper terbilang nominal angka ke kalimat bahasa Indonesia
 * Digunakan untuk dokumen klaim reimbursement dan kuitansi formal.
 */

const SATUAN = [
  "",
  "Satu",
  "Dua",
  "Tiga",
  "Empat",
  "Lima",
  "Enam",
  "Tujuh",
  "Delapan",
  "Sembilan",
  "Sepuluh",
  "Sebelas",
];

function angkaKeKata(num: number): string {
  const n = Math.floor(Math.abs(num));

  if (n < 12) {
    return SATUAN[n];
  }
  if (n < 20) {
    return `${angkaKeKata(n - 10)} Belas`;
  }
  if (n < 100) {
    const sisa = n % 10;
    return `${angkaKeKata(Math.floor(n / 10))} Puluh${sisa > 0 ? ` ${angkaKeKata(sisa)}` : ""}`;
  }
  if (n < 200) {
    const sisa = n - 100;
    return `Seratus${sisa > 0 ? ` ${angkaKeKata(sisa)}` : ""}`;
  }
  if (n < 1000) {
    const sisa = n % 100;
    return `${angkaKeKata(Math.floor(n / 100))} Ratus${sisa > 0 ? ` ${angkaKeKata(sisa)}` : ""}`;
  }
  if (n < 2000) {
    const sisa = n - 1000;
    return `Seribu${sisa > 0 ? ` ${angkaKeKata(sisa)}` : ""}`;
  }
  if (n < 1000000) {
    const sisa = n % 1000;
    return `${angkaKeKata(Math.floor(n / 1000))} Ribu${sisa > 0 ? ` ${angkaKeKata(sisa)}` : ""}`;
  }
  if (n < 1000000000) {
    const sisa = n % 1000000;
    return `${angkaKeKata(Math.floor(n / 1000000))} Juta${sisa > 0 ? ` ${angkaKeKata(sisa)}` : ""}`;
  }
  if (n < 1000000000000) {
    const sisa = n % 1000000000;
    return `${angkaKeKata(Math.floor(n / 1000000000))} Miliar${sisa > 0 ? ` ${angkaKeKata(sisa)}` : ""}`;
  }
  const sisa = n % 1000000000000;
  return `${angkaKeKata(Math.floor(n / 1000000000000))} Triliun${sisa > 0 ? ` ${angkaKeKata(sisa)}` : ""}`;
}

export function formatTerbilangRupiah(amount: number): string {
  if (amount === 0) return "Nol Rupiah";
  const kata = angkaKeKata(amount).trim();
  return `${kata} Rupiah`;
}
