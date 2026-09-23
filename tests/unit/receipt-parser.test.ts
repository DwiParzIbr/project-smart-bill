import { describe, it, expect } from "vitest";
import { parseReceiptText } from "@/lib/ocr/receipt-parser";

describe("Receipt Parser", () => {
  it("parses multi-line thermal receipt with name on line 1 and qty/price on line 2", () => {
    const raw = `
Berkaa Shop
Jl. Medayu Utara 50, Surabaya
81529620220414142434
-------------------------------
2022-04-14            Afi
14:24:34            sheila
No.0-24
-------------------------------
Nasi Ayam Geprek
1 X 12.000          Rp 12.000
Nasi Ayam Kremes
1 X 15.000          Rp 15.000
Nasi Goreng Spesial
1 X 20.000          Rp 20.000
-------------------------------
Sub Total              47.000
Total                  47.000
Bayar (Cash)           47.000
Kembali                     0
`;

    const result = parseReceiptText(raw);
    expect(result.isReceipt).toBe(true);
    expect(result.storeName).toBe("Berkaa Shop");
    expect(result.items).toHaveLength(3);

    expect(result.items[0].name).toBe("Nasi Ayam Geprek");
    expect(result.items[0].quantity).toBe(1);
    expect(result.items[0].unitPrice).toBe(12000);
    expect(result.items[0].totalPrice).toBe(12000);

    expect(result.items[1].name).toBe("Nasi Ayam Kremes");
    expect(result.items[1].quantity).toBe(1);
    expect(result.items[1].unitPrice).toBe(15000);
    expect(result.items[1].totalPrice).toBe(15000);

    expect(result.items[2].name).toBe("Nasi Goreng Spesial");
    expect(result.items[2].quantity).toBe(1);
    expect(result.items[2].unitPrice).toBe(20000);
    expect(result.items[2].totalPrice).toBe(20000);

    expect(result.subtotal).toBe(47000);
    expect(result.total).toBe(47000);
    expect(result.isTotalMatching).toBe(true);
  });

  it("parses single-line receipt correctly", () => {
    const raw = `
WARUNG NUSANTARA
1 Nasi Goreng Seafood    45.000
1 Mie Ayam Pangsit      38.000
2 Es Teh Manis          20.000
Subtotal               103.000
PB1 (Pajak 10%)         10.300
Total                  113.300
`;

    const result = parseReceiptText(raw);
    expect(result.isReceipt).toBe(true);
    expect(result.items).toHaveLength(3);
    expect(result.items[0].name).toBe("Nasi Goreng Seafood");
    expect(result.items[2].quantity).toBe(2);
    expect(result.items[2].unitPrice).toBe(10000);
    expect(result.items[2].totalPrice).toBe(20000);
    expect(result.tax).toBe(10300);
    expect(result.total).toBe(113300);
  });

  it("parses retail receipt with units (lusin, ml) and item numbering (1. 2. 3.)", () => {
    const raw = `
Karis Jaya Shop
Jl. Dr. Ir. H. Soekarno No. 19, Medokan Semampir
Surabaya
No. Telp 0812345678
16413520230802084636
2023-08-02           karis
08:46:36            Sheila
No.0-3
1. Indomie Goreng
1 lusin x 36.000        Rp 36.000
2. Fruit Tea Apple
1 500 ml x 7,000        Rp 7.000
3. Belfood Sosis Bakar
1 x 27,000             Rp 27.000
TOTAL QTY : 14
Sub Total               Rp 70.000
Total                   Rp 70.000
Bayar (Cash)            Rp 70.000
Kembali                 Rp 0
`;

    const result = parseReceiptText(raw);
    expect(result.isReceipt).toBe(true);
    expect(result.storeName).toBe("Karis Jaya Shop");
    expect(result.items).toHaveLength(3);

    expect(result.items[0].name).toBe("Indomie Goreng");
    expect(result.items[0].quantity).toBe(1);
    expect(result.items[0].totalPrice).toBe(36000);

    expect(result.items[1].name).toBe("Fruit Tea Apple");
    expect(result.items[1].quantity).toBe(1);
    expect(result.items[1].totalPrice).toBe(7000);

    expect(result.items[2].name).toBe("Belfood Sosis Bakar");
    expect(result.items[2].quantity).toBe(1);
    expect(result.items[2].totalPrice).toBe(27000);

    expect(result.subtotal).toBe(70000);
    expect(result.total).toBe(70000);
    expect(result.isTotalMatching).toBe(true);
  });

  it("parses Pawoon POS receipt with trailing x2 quantity multiplier (Martabak Original x2 40,000)", () => {
    const raw = `
No. Meja : 3
Kasir : Ibrahim Abdullah
Pelanggan : Bilal Fahreda
------------------------------------
Martabak Original      x2    40,000
Es Teh Manis           x1     4,000
Martabak Telur         x1    33,000
------------------------------------
Subtotal                     77,000
PPN (10%)                     7,700
Total                        84,700
Tunai                       100,000
Kembali                      15,300
`;

    const result = parseReceiptText(raw);
    expect(result.isReceipt).toBe(true);
    expect(result.items).toHaveLength(3);

    // Martabak Original: 2x, unit price 20.000, total price 40.000
    expect(result.items[0].name).toBe("Martabak Original");
    expect(result.items[0].quantity).toBe(2);
    expect(result.items[0].unitPrice).toBe(20000);
    expect(result.items[0].totalPrice).toBe(40000);

    // Es Teh Manis: 1x, 4.000
    expect(result.items[1].name).toBe("Es Teh Manis");
    expect(result.items[1].quantity).toBe(1);
    expect(result.items[1].unitPrice).toBe(4000);
    expect(result.items[1].totalPrice).toBe(4000);

    // Martabak Telur: 1x, 33.000
    expect(result.items[2].name).toBe("Martabak Telur");
    expect(result.items[2].quantity).toBe(1);
    expect(result.items[2].unitPrice).toBe(33000);
    expect(result.items[2].totalPrice).toBe(33000);

    expect(result.subtotal).toBe(77000);
    expect(result.tax).toBe(7700);
    expect(result.total).toBe(84700);
    expect(result.isTotalMatching).toBe(true);
  });

  it("parses Alfamart convenience store receipt accurately", () => {
    const raw = `
Alfamart
Belanja puas harga pas
Alfamart Jogja
Jl. Kenangan Jogja
08897482739
18.7.2024 08:49 #281
------------------------------------
Cimory
1x 2.000 2.000
Cimory hazelnut
1x 9.000 9.000
Frestea madu
1x 8.000 8.000
Ice cream aice
1x 5.000 5.000
Kanzler
1x 10.000 10.000
Le Minerale
1x 4.000 4.000
------------------------------------
Total Rp38.000
Tunai Rp38.000
Lunas
Barang yang sudah dibeli tidak b
isa dikembalikan lagi
Kasir : Sinta
Terima kasih
`;

    const result = parseReceiptText(raw);
    expect(result.isReceipt).toBe(true);
    expect(result.storeName).toBe("Alfamart");
    expect(result.items).toHaveLength(6);

    expect(result.items[0].name).toBe("Cimory");
    expect(result.items[0].quantity).toBe(1);
    expect(result.items[0].unitPrice).toBe(2000);
    expect(result.items[0].totalPrice).toBe(2000);

    expect(result.items[1].name).toBe("Cimory hazelnut");
    expect(result.items[1].totalPrice).toBe(9000);

    expect(result.items[2].name).toBe("Frestea madu");
    expect(result.items[2].totalPrice).toBe(8000);

    expect(result.items[3].name).toBe("Ice cream aice");
    expect(result.items[3].totalPrice).toBe(5000);

    expect(result.items[4].name).toBe("Kanzler");
    expect(result.items[4].totalPrice).toBe(10000);

    expect(result.items[5].name).toBe("Le Minerale");
    expect(result.items[5].totalPrice).toBe(4000);

    expect(result.total).toBe(38000);
    expect(result.subtotal).toBe(38000);
    expect(result.isTotalMatching).toBe(true);
    expect(result.discrepancy).toBe(0);
  });

  it("rejects non-receipt text cleanly", () => {
    const raw = `
Universitas Terbuka Wisuda ke-45
Selamat kepada seluruh wisudawan dan wisudawati
Program Studi Teknik Informatika
Jakarta, 2026
`;

    const result = parseReceiptText(raw);
    expect(result.isReceipt).toBe(false);
    expect(result.items).toHaveLength(0);
    expect(result.error).toBeDefined();
  });
});
