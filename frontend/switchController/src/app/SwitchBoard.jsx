import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import swIMG from './../assest/switch.png';
import {getDesign, updateSwitch} from './../services/DesignService';
import { isAdmin } from './../shared/auth';


/*
  KART CONFIG'İ
  ---------------
  switch_id'nin son 2 biti (sağdan) hangi kartı temsil ediyor:
    "00" -> 1. kart
    "01" -> 2. kart
    "10" -> 3. kart
    "11" -> 4. kart

  Her kart için:
    - image: kartın fotoğrafının URL'i
    - points: o kart üzerindeki her switch_id'nin fotoğraf üzerindeki
      x/y yüzde koordinatı (kalibrasyon aracından çıkan JSON buraya girilecek)

  NOT: Aşağıdaki koordinatlar örnek/placeholder'dır.
  Kalibrasyon aracından çıkardığın gerçek JSON'u ilgili kartın
  "points" alanına yapıştırman yeterli.
*/
const CARD_CONFIG = {
    "00": {
        label: "1. kart",
        image: swIMG,
        points: {

            "10000100": {
                "x": 22.44,
                "y": 87.9
            },
            "10001000": {
                "x": 29.12,
                "y": 87.65
            },
            "10001100": {
                "x": 35.94,
                "y": 87.4
            },
            "10010000": {
                "x": 43.04,
                "y": 87.4
            },
            "10010100": {
                "x": 49.72,
                "y": 87.4
            },
            "10011000": {
                "x": 58.49,
                "y": 87.4
            },
            "10011100": {
                "x": 65.59,
                "y": 87.4
            },
            "10100000": {
                "x": 72.55,
                "y": 87.9
            },
            "10100100": {
                "x": 78.67,
                "y": 88.15
            },
            "10101000": {
                "x": 86.19,
                "y": 87.65
            },
            "00000100": {
                "x": 10.75,
                "y": 8.22
            },
            "01000100": {
                "x": 14.64,
                "y": 8.96
            },
            "00001000": {
                "x": 19.52,
                "y": 9.21
            },
            "01001000": {
                "x": 23.41,
                "y": 8.96
            },
            "00001100": {
                "x": 28.56,
                "y": 8.71
            },
            "01001100": {
                "x": 32.04,
                "y": 8.96
            },
            "00010000": {
                "x": 36.92,
                "y": 9.7
            },
            "01010000": {
                "x": 41.37,
                "y": 9.95
            },
            "00010100": {
                "x": 45.96,
                "y": 8.46
            },
            "01010100": {
                "x": 49.72,
                "y": 9.21
            },
            "00011000": {
                "x": 57.8,
                "y": 8.96
            },
            "01011000": {
                "x": 62.39,
                "y": 8.46
            },
            "00011100": {
                "x": 67.4,
                "y": 8.71
            },
            "01011100": {
                "x": 71.85,
                "y": 8.22
            },
            "00100000": {
                "x": 76.45,
                "y": 8.96
            },
            "01100000": {
                "x": 80.07,
                "y": 8.96
            },
            "00100100": {
                "x": 85.08,
                "y": 9.21
            },
            "01100100": {
                "x": 88.98,
                "y": 9.21
            },
            "00101000": {
                "x": 93.85,
                "y": 9.7
            },
            "01101000": {
                "x": 97.88,
                "y": 9.21
            }

        },
    },
    "01": {
        label: "2. kart",
        image: swIMG,
        points: {
 "10000101": {
    "x": 22.44,
    "y": 87.9
  },
  "10001001": {
    "x": 29.12,
    "y": 87.65
  },
  "10001101": {
    "x": 35.94,
    "y": 87.4
  },
  "10010001": {
    "x": 43.04,
    "y": 87.4
  },
  "10010101": {
    "x": 49.72,
    "y": 87.4
  },
  "10011001": {
    "x": 58.49,
    "y": 87.4
  },
  "10011101": {
    "x": 65.59,
    "y": 87.4
  },
  "10100001": {
    "x": 72.55,
    "y": 87.9
  },
  "10100101": {
    "x": 78.67,
    "y": 88.15
  },
  "10101001": {
    "x": 86.19,
    "y": 87.65
  },
  "00000101": {
    "x": 10.75,
    "y": 8.22
  },
  "01000101": {
    "x": 14.64,
    "y": 8.96
  },
  "00001001": {
    "x": 19.52,
    "y": 9.21
  },
  "01001001": {
    "x": 23.41,
    "y": 8.96
  },
  "00001101": {
    "x": 28.56,
    "y": 8.71
  },
  "01001101": {
    "x": 32.04,
    "y": 8.96
  },
  "00010001": {
    "x": 36.92,
    "y": 9.7
  },
  "01010001": {
    "x": 41.37,
    "y": 9.95
  },
  "00010101": {
    "x": 45.96,
    "y": 8.46
  },
  "01010101": {
    "x": 49.72,
    "y": 9.21
  },
  "00011001": {
    "x": 57.8,
    "y": 8.96
  },
  "01011001": {
    "x": 62.39,
    "y": 8.46
  },
  "00011101": {
    "x": 67.4,
    "y": 8.71
  },
  "01011101": {
    "x": 71.85,
    "y": 8.22
  },
  "00100001": {
    "x": 76.45,
    "y": 8.96
  },
  "01100001": {
    "x": 80.07,
    "y": 8.96
  },
  "00100101": {
    "x": 85.08,
    "y": 9.21
  },
  "01100101": {
    "x": 88.98,
    "y": 9.21
  },
  "00101001": {
    "x": 93.85,
    "y": 9.7
  },
  "01101001": {
    "x": 97.88,
    "y": 9.21
  }
        },
    },
    "10": {
        label: "3. kart",
        image: swIMG,
        points: {
  "10000110": {
    "x": 22.44,
    "y": 87.9
  },
  "10001010": {
    "x": 29.12,
    "y": 87.65
  },
  "10001110": {
    "x": 35.94,
    "y": 87.4
  },
  "10010010": {
    "x": 43.04,
    "y": 87.4
  },
  "10010110": {
    "x": 49.72,
    "y": 87.4
  },
  "10011010": {
    "x": 58.49,
    "y": 87.4
  },
  "10011110": {
    "x": 65.59,
    "y": 87.4
  },
  "10100010": {
    "x": 72.55,
    "y": 87.9
  },
  "10100110": {
    "x": 78.67,
    "y": 88.15
  },
  "10101010": {
    "x": 86.19,
    "y": 87.65
  },
  "00000110": {
    "x": 10.75,
    "y": 8.22
  },
  "01000110": {
    "x": 14.64,
    "y": 8.96
  },
  "00001010": {
    "x": 19.52,
    "y": 9.21
  },
  "01001010": {
    "x": 23.41,
    "y": 8.96
  },
  "00001110": {
    "x": 28.56,
    "y": 8.71
  },
  "01001110": {
    "x": 32.04,
    "y": 8.96
  },
  "00010010": {
    "x": 36.92,
    "y": 9.7
  },
  "01010010": {
    "x": 41.37,
    "y": 9.95
  },
  "00010110": {
    "x": 45.96,
    "y": 8.46
  },
  "01010110": {
    "x": 49.72,
    "y": 9.21
  },
  "00011010": {
    "x": 57.8,
    "y": 8.96
  },
  "01011010": {
    "x": 62.39,
    "y": 8.46
  },
  "00011110": {
    "x": 67.4,
    "y": 8.71
  },
  "01011110": {
    "x": 71.85,
    "y": 8.22
  },
  "00100010": {
    "x": 76.45,
    "y": 8.96
  },
  "01100010": {
    "x": 80.07,
    "y": 8.96
  },
  "00100110": {
    "x": 85.08,
    "y": 9.21
  },
  "01100110": {
    "x": 88.98,
    "y": 9.21
  },
  "00101010": {
    "x": 93.85,
    "y": 9.7
  },
  "01101010": {
    "x": 97.88,
    "y": 9.21
  }


        },
    },
    "11": {
        label: "4. kart",
        image: swIMG,
        points: {

              "10000111": {
    "x": 22.44,
    "y": 87.9
  },
  "10001011": {
    "x": 29.12,
    "y": 87.65
  },
  "10001111": {
    "x": 35.94,
    "y": 87.4
  },
  "10010011": {
    "x": 43.04,
    "y": 87.4
  },
  "10010111": {
    "x": 49.72,
    "y": 87.4
  },
  "10011011": {
    "x": 58.49,
    "y": 87.4
  },
  "10011111": {
    "x": 65.59,
    "y": 87.4
  },
  "10100011": {
    "x": 72.55,
    "y": 87.9
  },
  "10100111": {
    "x": 78.67,
    "y": 88.15
  },
  "10101011": {
    "x": 86.19,
    "y": 87.65
  },
  "00000111": {
    "x": 10.75,
    "y": 8.22
  },
  "01000111": {
    "x": 14.64,
    "y": 8.96
  },
  "00001011": {
    "x": 19.52,
    "y": 9.21
  },
  "01001011": {
    "x": 23.41,
    "y": 8.96
  },
  "00001111": {
    "x": 28.56,
    "y": 8.71
  },
  "01001111": {
    "x": 32.04,
    "y": 8.96
  },
  "00010011": {
    "x": 36.92,
    "y": 9.7
  },
  "01010011": {
    "x": 41.37,
    "y": 9.95
  },
  "00010111": {
    "x": 45.96,
    "y": 8.46
  },
  "01010111": {
    "x": 49.72,
    "y": 9.21
  },
  "00011011": {
    "x": 57.8,
    "y": 8.96
  },
  "01011011": {
    "x": 62.39,
    "y": 8.46
  },
  "00011111": {
    "x": 67.4,
    "y": 8.71
  },
  "01011111": {
    "x": 71.85,
    "y": 8.22
  },
  "00100011": {
    "x": 76.45,
    "y": 8.96
  },
  "01100011": {
    "x": 80.07,
    "y": 8.96
  },
  "00100111": {
    "x": 85.08,
    "y": 9.21
  },
  "01100111": {
    "x": 88.98,
    "y": 9.21
  },
  "00101011": {
    "x": 93.85,
    "y": 9.7
  },
  "01101011": {
    "x": 97.88,
    "y": 9.21
  }
        },
    },
};

// Bir switch_id'nin hangi kartta, fotoğrafın neresinde olduğunu verir.
function getSlotCoords(switchId) {
    const cardKey = getCardKeyFromSwitchId(switchId);
    const coords = cardKey && CARD_CONFIG[cardKey]
        ? CARD_CONFIG[cardKey].points[switchId]
        : null;
    return coords ? { cardKey, x: coords.x, y: coords.y } : null;
}

/*
  Kartların kullanım sırası. AÇIKÇA yazılmak zorunda: Object.keys(CARD_CONFIG)
  ["10","11","00","01"] döndürür, çünkü JS "10" ve "11"i geçerli dizi indeksi
  sayıp başa, sayısal sırayla alır. Buna güvenilirse hem kartlar 3,4,1,2 diye
  dizilir hem de slot numaralandırması komple kayar.
*/
const CARD_ORDER = ["00", "01", "10", "11"];

// switch_id'nin son 2 bitini okuyup hangi karta ait olduğunu bulur
function getCardKeyFromSwitchId(switchId) {
    const s = String(switchId ?? "");
    return s.length === 8 ? s.slice(-2) : null;
}

/*
  YERLEŞİM MODELİ
  ---------------
  switch_id taşınan şeyin değil, KARTTAKİ KONUMUN kimliğidir; hepsi
  CARD_CONFIG içinde tanımlı. Burada hiçbir switch_id üretilmez —
  CARD_CONFIG'te zaten var olanlar sırayla gruplara dağıtılır.

  Her grubun kendi BAŞLANGIÇ unit'i vardır (basesByGroup). Grubu taşımak =
  bu başlangıcı değiştirmek. Konum mutlaktır: araya boşluk bırakabilirsin,
  1. switch'i boş bırakıp 5.'ten başlayabilirsin. Yalnızca üstüne denk gelen
  gruplar ileri kaydırılır.
*/

// Slot sırasını CARD_CONFIG'in KOORDİNATLARINDAN türetir.
// Alt sıra (y >= 50) = çıkışlar, x'e göre 1..10.
// Üst sıra (y < 50)  = girişler, x'e göre ikişerli: her switch'in in1/in2'si.
// Bir "unit" = tek bir fiziksel switch: { in1, in2, out }.
function buildSlotUnits() {
    const units = [];
    CARD_ORDER.forEach((cardKey) => {
        const entries = Object.entries(CARD_CONFIG[cardKey].points);
        const byX = (a, b) => a[1].x - b[1].x;
        const outs = entries.filter(([, c]) => c.y >= 50).sort(byX).map(([id]) => id);
        const ins = entries.filter(([, c]) => c.y < 50).sort(byX).map(([id]) => id);
        outs.forEach((out, k) => {
            units.push({ card: cardKey, in1: ins[2 * k], in2: ins[2 * k + 1], out });
        });
    });
    return units;
}

// switch_id -> { unit, terminal } ters indeksi
function buildSlotIndex(units) {
    const index = {};
    units.forEach((u, i) => {
        if (u.in1) index[u.in1] = { unit: i, terminal: "in1" };
        if (u.in2) index[u.in2] = { unit: i, terminal: "in2" };
        if (u.out) index[u.out] = { unit: i, terminal: "out" };
    });
    return index;
}

/*
  Her grubun mevcut veriden okunan yerleşim ŞABLONU:
    span       -> kaç switch unit kaplıyor
    ownerSlot  -> çıkışın, grubun başlangıcına göre konumu
    inputSlots -> grubun giriş slotları, kart üzerindeki sırayla
                  (önce unit, aynı unit içinde in1 sonra in2)
    connectionIndices -> bu slotlara varsayılan olarak oturan bağlantı sırası

  Şablon gruba aittir ve sabittir. Grup taşınınca yalnız başlangıç unit'i,
  grup içi giriş takasında ise yalnız connectionIndices permütasyonu değişir.
*/
function buildGroupLayouts(enrichedData, slotIndex) {
    const layouts = {};
    Object.entries(enrichedData || {}).forEach(([groupId, pointData]) => {
        const ownerAt = slotIndex[String(pointData.swicth_id)];
        const connections = (pointData.connections || [])
            .map((c, i) => ({ index: i, at: slotIndex[String(c.swicth_id)] }))
            .filter((c) => c.at);

        const unitIndexes = [
            ...(ownerAt ? [ownerAt.unit] : []),
            ...connections.map((c) => c.at.unit),
        ];
        if (unitIndexes.length === 0) return; // hiçbir noktası tanınmıyor

        const base = Math.min(...unitIndexes);

        // Giriş slotlarını kart üzerindeki fiziksel sıraya göre diz.
        const ordered = [...connections].sort(
            (a, b) =>
                a.at.unit - b.at.unit ||
                (a.at.terminal === "in1" ? -1 : 1) - (b.at.terminal === "in1" ? -1 : 1)
        );

        layouts[groupId] = {
            base,
            span: Math.max(...unitIndexes) - base + 1,
            ownerSlot: ownerAt
                ? { offset: ownerAt.unit - base, terminal: ownerAt.terminal }
                : null,
            inputSlots: ordered.map((c) => ({
                offset: c.at.unit - base,
                terminal: c.at.terminal,
            })),
            connectionIndices: ordered.map((c) => c.index),
        };
    });
    return layouts;
}

// inputOrder[k] = k'ıncı giriş slotunda oturan bağlantının indeksi.
// İki bağlantının slotlarını takas eder (sadece grup içinde).
function swapInputsInOrder(inputOrder, connA, connB) {
    const next = [...inputOrder];
    const i = next.indexOf(connA);
    const j = next.indexOf(connB);
    if (i < 0 || j < 0) return inputOrder;
    next[i] = connB;
    next[j] = connA;
    return next;
}

// Her grubu kendi başlangıç unit'ine oturtur. Kapasite dışına taşan slot
// null kalır (yukarıda uyarı olarak raporlanır).
function allocateSlots(basesByGroup, layouts, units, inputOrderByGroup) {
    const slots = {};
    Object.entries(layouts).forEach(([groupId, layout]) => {
        const base = basesByGroup[groupId];
        if (base == null) return;

        const at = (slot) => {
            const unit = slot ? units[base + slot.offset] : null;
            return unit ? unit[slot.terminal] : null;
        };

        const groupSlots = { owner: at(layout.ownerSlot), connections: [] };

        // Giriş slotlarına, geçerli permütasyona göre bağlantıları dağıt.
        const order = inputOrderByGroup[groupId] || layout.connectionIndices;
        order.forEach((connIndex, k) => {
            groupSlots.connections[connIndex] = at(layout.inputSlots[k]);
        });

        slots[groupId] = groupSlots;
    });
    return slots;
}

/*
  GRUP İÇİ (dahili) BAĞLANTILAR — SADECE GÖRSEL
  ---------------------------------------------
  Bir grup kartta n switch'lik yer kaplar ama bu slotların hepsi dışarıya
  bağlanmaz; aradakiler kart üzerinde birbirine bağlıdır. Burada o boşta
  kalan slotlar eşleştirilir. ÇİZGİ YOK: her eşleşen çift, grup renginde AYNI
  NUMARAYI taşır (bir uç çıkış, bir uç giriş). Aynı renk + aynı numara = bağlı.

  Kurallar:
    1. Bağlantı DAİMA bir giriş ile bir çıkış arasındadır — giriş-girişe
       ya da çıkış-çıkışa bağlanmaz.
    2. Bir switch'in girişi KENDİ çıkışına bağlanamaz (2. switch'in girişi
       2. switch'in çıkışına gitmez); bağlantı hep başka bir switch'e gider.
    3. Birden fazla boş varsa birbirine en yakın olanlar eşleşir.

  Hiçbir veri değişmez; enrichedData ve slotlar aynen kalır.
*/
function buildInternalLinks(layouts, basesByGroup, slotsByGroup, units, groupMeta) {
    const linksByCard = {};
    let pairNo = 0; // tüm gruplar boyunca artan tek sayaç -> her çift benzersiz numara

    Object.entries(layouts).forEach(([groupId, layout]) => {
        const base = basesByGroup[groupId];
        const slots = slotsByGroup[groupId];
        if (base == null || !slots) return;

        const used = new Set([slots.owner, ...slots.connections].filter(Boolean));

        // Grubun kapladığı unit aralığında dışarıya bağlanmayan slotlar
        const freeInputs = [];
        const freeOutputs = [];
        for (let u = base; u < base + layout.span; u++) {
            const unit = units[u];
            if (!unit) continue;
            ["in1", "in2"].forEach((terminal) => {
                if (unit[terminal] && !used.has(unit[terminal])) {
                    freeInputs.push({ unit: u, switchId: unit[terminal] });
                }
            });
            if (unit.out && !used.has(unit.out)) {
                freeOutputs.push({ unit: u, switchId: unit.out });
            }
        }

        // Her çıkışı, en yakın boş girişle eşle (giriş-çıkış zorunlu).
        // Aynı unit atlanır: bir switch kendi çıkışına bağlanamaz.
        const candidates = [];
        freeOutputs.forEach((out) =>
            freeInputs.forEach((input) => {
                if (input.unit === out.unit) return;
                candidates.push({ out, input, distance: Math.abs(input.unit - out.unit) });
            })
        );
        candidates.sort((a, b) => a.distance - b.distance || a.out.unit - b.out.unit);

        const takenOutputs = new Set();
        const takenInputs = new Set();
        const color = groupMeta[groupId]?.color || "#94a3b8";

        candidates.forEach(({ out, input }) => {
            if (takenOutputs.has(out.switchId) || takenInputs.has(input.switchId)) return;
            takenOutputs.add(out.switchId);
            takenInputs.add(input.switchId);

            const from = getSlotCoords(out.switchId);
            const to = getSlotCoords(input.switchId);
            if (!from || !to) return;
            pairNo += 1;

            // Çift, iki ayrı marker olarak gösterilir; ikisinde de aynı grup rengi
            // ve aynı pairNo. Uçlar farklı kartlarda olabilir -> her uç kendi kartına.
            const push = (coords, switchId, role) => {
                if (!linksByCard[coords.cardKey]) linksByCard[coords.cardKey] = [];
                linksByCard[coords.cardKey].push({
                    groupId,
                    color,
                    pairNo,
                    role, // "out" (çıkış) | "in" (giriş)
                    switchId,
                    x: coords.x,
                    y: coords.y,
                });
            };
            push(from, out.switchId, "out");
            push(to, input.switchId, "in");
        });
    });

    return linksByCard;
}

/*
  Kaydedilecek "switch" verisi: gelen enrichedData ile BİREBİR aynı şekil,
  yalnız swicth_id alanları güncel yerleşimden yazılır. Diğer her alan
  (label'lar, owner_node, count, direction...) olduğu gibi korunur.
  Karttan kaldırılmış grupların swicth_id'si null olur.

  NOT: "swicth_id" yazımı kasıtlı — API sözleşmesi böyle.
*/
function buildSwitchPayload(enrichedData, slotsByGroup) {
    const payload = {};
    Object.entries(enrichedData || {}).forEach(([groupId, pointData]) => {
        const slots = slotsByGroup[groupId];
        payload[groupId] = {
            ...pointData,
            swicth_id: slots ? slots.owner ?? null : null,
            connections: (pointData.connections || []).map((conn, i) => ({
                ...conn,
                swicth_id: slots ? slots.connections[i] ?? null : null,
            })),
        };
    });
    return payload;
}

// Kenarda bekleyen (karttan kaldırılmış) gruplar için etiket/renk bilgisi.
// Renk sırası buildLabelsByCard ile aynı olsun diye aynı indeks kullanılır.
function buildGroupMeta(enrichedData) {
    const meta = {};
    Object.entries(enrichedData || {}).forEach(([groupId, pointData], i) => {
        meta[groupId] = {
            color: GROUP_PALETTE[i % GROUP_PALETTE.length],
            primary: pointData.owner_node_label || groupId,
            secondary: pointData.handle_label || "",
            connectionCount: (pointData.connections || []).length,
        };
    });
    return meta;
}

// Başlangıç konumları: gruplar kart üzerinde hâlihazırda nerede duruyorsa orada.
function buildInitialBases(layouts) {
    const bases = {};
    Object.entries(layouts).forEach(([groupId, layout]) => {
        bases[groupId] = layout.base;
    });
    return bases;
}

/*
  movedGroup'u targetUnit'ten başlatır. Konum mutlaktır; boşluklar korunur.
  Sadece taşınan grubun üstüne denk gelen gruplar ilk boş yere kaydırılır
  (kaydırma zinciri artan başlangıç sırasıyla, hep ileri doğru -> sonlanır).
*/
function placeGroupAt(basesByGroup, layouts, movedGroup, targetUnit, totalUnits) {
    const next = { ...basesByGroup, [movedGroup]: targetUnit };
    const movedSpan = layouts[movedGroup]?.span ?? 1;
    const taken = [{ start: targetUnit, end: targetUnit + movedSpan - 1 }];
    const collides = (start, end) => taken.some((t) => start <= t.end && end >= t.start);

    Object.keys(next)
        // base'i null olanlar kartta değil (kenarda bekliyor) -> kaydırmaya girmez
        .filter((g) => g !== movedGroup && layouts[g] && next[g] != null)
        .sort((a, b) => next[a] - next[b])
        .forEach((groupId) => {
            const span = layouts[groupId].span;
            let start = next[groupId];
            while (start + span - 1 < totalUnits && collides(start, start + span - 1)) start++;
            next[groupId] = start;
            taken.push({ start, end: start + span - 1 });
        });

    return next;
}

/*
  enrichedData (etiketler/gruplar) + slotsByGroup (kim nerede oturuyor)
  birleştirilip, kart kart çizilecek marker listesi çıkarılır.
  Bir slot CARD_CONFIG'te yoksa nokta çizilemez; sessizce düşmesin diye
  ayrıca "unplaced" listesinde raporlanır.
*/
function buildLabelsByCard(enrichedData, slotsByGroup) {
    const labelsByCard = {}; // { "00": [{switch_id, x, y, ...}], "01": [...] }
    const unplaced = [];     // CARD_CONFIG'te karşılığı olmayan slotlar

    const place = (switchId, item) => {
        const cardKey = getCardKeyFromSwitchId(switchId);
        const coords = cardKey && CARD_CONFIG[cardKey]
            ? CARD_CONFIG[cardKey].points[switchId]
            : null;
        if (!coords) {
            unplaced.push({ ...item, switch_id: switchId });
            return;
        }
        if (!labelsByCard[cardKey]) labelsByCard[cardKey] = [];
        labelsByCard[cardKey].push({ ...item, switch_id: switchId, x: coords.x, y: coords.y });
    };

    // Her üst seviye anahtar (h-...) bir gruptur: bir owner (çıkış) ve ona bağlı
    // connections. Aynı grubun tüm noktaları aynı rengi alır; böylece hangi
    // çıkışın hangi bağlantılara gittiği renkten anlaşılır.
    Object.entries(enrichedData || {}).forEach(([groupId, pointData], groupIndex) => {
        const color = GROUP_PALETTE[groupIndex % GROUP_PALETTE.length];
        const slots = slotsByGroup[groupId];
        if (!slots) return;

        // 1. Grubun çıkışı (owner)
        place(slots.owner, {
            groupId,
            kind: "owner",
            color,
            primary: pointData.owner_node_label ?? "",
            secondary: pointData.handle_label ?? "",
        });

        // 2. Grubun her bağlantısı (giriş) — sıra slots.connections ile birebir
        (pointData.connections || []).forEach((conn, i) => {
            place(slots.connections[i], {
                groupId,
                kind: "connection",
                connIndex: i,
                color,
                primary: conn.connected_node_label ?? "",
                secondary: conn.connected_handle_label ?? "",
            });
        });
    });

    return { labelsByCard, unplaced };
}

// Her grup (üst seviye h-... anahtarı) sıradaki rengi alır.
const GROUP_PALETTE = [
    "#2563eb", // mavi
    "#0d9488", // teal
    "#db2777", // pembe
    "#ea580c", // turuncu
    "#7c3aed", // mor
    "#16a34a", // yeşil
    "#0891b2", // camgöbeği
    "#ca8a04", // amber
    "#dc2626", // kırmızı
    "#4f46e5", // indigo
];

/*
  Tek bir switch işareti: fotoğraf üzerinde tam (x, y) noktasına oturan bir nokta,
  ondan çıkan ince bir bağlantı çizgisi ve DİKEY yazılmış bir etiket.
  y < 50 ise nokta üst sırada demektir; etiket yukarı doğru uzar, aksi halde aşağı.
*/
function Marker({ item, selected, pinned, dimmed, onSelect }) {
    const isTop = item.y < 50;
    const color = item.color || "#2563eb";
    const ring = pinned ? "#f59e0b" : color; // takas için seçilmiş giriş -> amber

    const dot = (
        <div
            style={{
                width: selected || pinned ? 13 : 11,
                height: selected || pinned ? 13 : 11,
                borderRadius: "50%",
                background: color,
                border: "2px solid #fff",
                boxShadow: selected || pinned ? `0 0 0 3px ${ring}` : `0 0 0 1.5px ${color}`,
                flexShrink: 0,
            }}
        />
    );

    const connector = (
        <div style={{ width: 2, height: 9, background: color, opacity: 0.45, flexShrink: 0 }} />
    );

    const pill = (
        <div
            style={{
                writingMode: "vertical-rl",
                textOrientation: "mixed",
                transform: "rotate(180deg)", // dikey yazıyı aşağıdan yukarı okunur yapar
                background: selected ? color : "#fff",
                border: `${selected || pinned ? 2 : 1}px solid ${ring}`,
                borderRadius: 7,
                padding: "6px 4px",
                boxShadow: pinned
                    ? `0 0 0 2px ${ring}55, 0 4px 12px ${ring}44`
                    : selected
                    ? `0 4px 12px ${color}66`
                    : "0 3px 8px rgba(15,23,42,0.14)",
                whiteSpace: "nowrap",
                lineHeight: 1.2,
                letterSpacing: 0,
            }}
        >
            <span
                style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: selected ? "#fff" : "#0f172a",
                }}
            >
                {item.primary}
            </span>
            {item.secondary && (
                <span
                    style={{
                        fontSize: 10,
                        fontWeight: 500,
                        color: selected ? "#e2e8f0" : "#64748b",
                    }}
                >
                    {" · " + item.secondary}
                </span>
            )}
        </div>
    );

    return (
        <div
            title={`${item.primary}${item.secondary ? " · " + item.secondary : ""}\nswitch_id: ${item.switch_id}`}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(item);
            }}
            style={{
                position: "absolute",
                left: item.x + "%",
                top: item.y + "%",
                transform: isTop ? "translate(-50%, -100%)" : "translate(-50%, 0)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: isAdmin ? "pointer" : "default",
                opacity: dimmed ? 0.28 : 1,
                zIndex: pinned ? 4 : selected ? 3 : 1,
                transition: "opacity 120ms ease",
            }}
        >
            {isTop ? (
                <>
                    {pill}
                    {connector}
                    {dot}
                </>
            ) : (
                <>
                    {dot}
                    {connector}
                    {pill}
                </>
            )}
        </div>
    );
}

/*
  Dahili bağlantı ucu: çizgi yerine numara rozeti. Aynı grup renginde aynı
  numarayı taşıyan iki uç (biri çıkış, biri giriş) birbirine bağlıdır.
  Salt görsel; tıklanmaz, veriye dokunmaz.
*/
function InternalMarker({ item, dimmed }) {
    const isTop = item.y < 50;
    const color = item.color || "#94a3b8";
    const roleText = item.role === "out" ? "JOIN" : "JOIN";

    const dot = (
        <div
            style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: color,
                border: "2px solid #fff",
                boxShadow: `0 0 0 1.5px ${color}`,
                flexShrink: 0,
            }}
        />
    );

    const connector = (
        <div style={{ width: 2, height: 8, background: color, opacity: 0.45, flexShrink: 0 }} />
    );

    // Numara rozeti: grup renginde, kısa. Çıkış dolu, giriş içi boş -> yön ayrımı.
    const filled = item.role === "out";
    const badge = (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: filled ? color : "#fff",
                border: `1.5px solid ${color}`,
                borderRadius: 999,
                padding: "2px 7px",
                boxShadow: "0 2px 6px rgba(15,23,42,0.16)",
                whiteSpace: "nowrap",
                lineHeight: 1,
            }}
        >
            <span style={{ fontSize: 11, fontWeight: 800, color: filled ? "#fff" : color }}>
                {item.pairNo}
            </span>
            <span style={{ fontSize: 8.5, fontWeight: 600, color: filled ? "#e2e8f0" : "#94a3b8" }}>
                {roleText}
            </span>
        </div>
    );

    return (
        <div
            title={`Dahili bağlantı #${item.pairNo} — ${roleText}\nswitch_id: ${item.switchId}`}
            style={{
                position: "absolute",
                left: item.x + "%",
                top: item.y + "%",
                transform: isTop ? "translate(-50%, -100%)" : "translate(-50%, 0)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                pointerEvents: "none",
                opacity: dimmed ? 0.18 : 1,
                zIndex: 1,
                transition: "opacity 120ms ease",
            }}
        >
            {isTop ? (
                <>
                    {badge}
                    {connector}
                    {dot}
                </>
            ) : (
                <>
                    {dot}
                    {connector}
                    {badge}
                </>
            )}
        </div>
    );
}

/*
  Boş slot: üzerinde grup olmayan bir konum. Bir grup seçiliyken tıklanabilir
  hedefe dönüşür; tıklanınca seçili grup o unit'ten BAŞLAR.
*/
function EmptySlot({ x, y, active, onClick }) {
    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            title={active ? "Seçili grubu buradan başlat" : undefined}
            style={{
                position: "absolute",
                left: x + "%",
                top: y + "%",
                transform: "translate(-50%, -50%)",
                width: active ? 15 : 9,
                height: active ? 15 : 9,
                borderRadius: "50%",
                border: active ? "2px dashed #2563eb" : "1.5px solid #cbd5e1",
                background: active ? "rgba(37,99,235,0.14)" : "transparent",
                cursor: active ? "pointer" : "default",
                pointerEvents: active ? "auto" : "none",
                zIndex: 2,
            }}
        />
    );
}

function SwitchCard({
    cardKey,
    cardConfig,
    labels,
    selectedGroup,
    selectedInput,
    onSelect,
    freeSlots,
    onPlace,
    links,
}) {
    return (
        <div style={{ position: "relative", marginBottom: 20 }}>
            {/* Kart numarası: kutu yerine, üstteki boşluğa oturan sade küçük başlık */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                    color: "#94a3b8",
                }}
            >
                {cardConfig.label}
            </div>

            {/* Dikey etiketlerin fotoğrafın alt/üstünde taşabilmesi için dikey boşluk */}
            <div style={{ padding: "105px 8px 175px", overflow: "visible" }}>
                <div style={{ position: "relative", maxWidth: 1000, margin: "0 auto" }}>
                    <img
                        src={cardConfig.image}
                        alt={cardConfig.label}
                        style={{
                            display: "block",
                            width: "100%",
                            height: "auto",
                            borderRadius: 12,
                            boxShadow: "0 4px 16px rgba(15,23,42,0.14)",
                        }}
                    />
                    {/* Grup içi dahili bağlantılar — çizgi yok, numara rozetleri.
                        Aynı renk + aynı numara olan iki uç birbirine bağlıdır. */}
                    {(links || []).map((link, i) => (
                        <InternalMarker
                            key={"lnk-" + link.groupId + "-" + link.switchId + "-" + i}
                            item={link}
                            dimmed={selectedGroup != null && selectedGroup !== link.groupId}
                        />
                    ))}

                    {/* Boş slotlar sadece düzenlemede (admin) hedef olur; user modunda gizli */}
                    {isAdmin &&
                        (freeSlots || []).map((slot) => (
                            <EmptySlot
                                key={"free-" + slot.switchId}
                                x={slot.x}
                                y={slot.y}
                                active={selectedGroup != null}
                                onClick={() => onPlace(slot.unit)}
                            />
                        ))}
                    {(labels || []).map((item, i) => (
                        <Marker
                            key={cardKey + "-" + item.switch_id + "-" + i}
                            item={item}
                            selected={selectedGroup === item.groupId}
                            pinned={
                                selectedInput != null &&
                                selectedInput.groupId === item.groupId &&
                                selectedInput.connIndex === item.connIndex
                            }
                            dimmed={selectedGroup != null && selectedGroup !== item.groupId}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}



export default function SwitchCardBoard() {
    const { id } = useParams();
    const [enrichedData, setEnrichedData] = useState({});
    const [basesByGroup, setBasesByGroup] = useState({});
    const [inputOrderByGroup, setInputOrderByGroup] = useState({}); // grup içi giriş permütasyonu
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [selectedInput, setSelectedInput] = useState(null); // { groupId, connIndex }
    const [cardCount, setCardCount] = useState(2); // kaç kart kullanılıyor (1-4)
    const [message, setMessage] = useState(null); // { kind: "error"|"info", text }
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Slot şeması CARD_CONFIG'ten türetilir, veriye bağlı değil -> bir kez hesapla.
    const units = useMemo(buildSlotUnits, []);
    const slotIndex = useMemo(() => buildSlotIndex(units), [units]);
    const layouts = useMemo(
        () => buildGroupLayouts(enrichedData, slotIndex),
        [enrichedData, slotIndex]
    );

    // Sayfa açılınca URL'deki design id ile getDesign'a istek at.
    // Dönen kayıttaki "switch" verisi (bazen string) bizim enrichedData'mız.
    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        setLoading(true);
        getDesign({ id })
            .then((res) => {
                if (cancelled) return;
                const item = Array.isArray(res) ? res[0] : res;
                const sw = item?.switch ?? item?.Switch;
                let parsed = {};
                if (sw) {
                    try {
                        parsed = (typeof sw === "string" ? JSON.parse(sw) : sw) || {};
                    } catch (e) {
                        console.error("switch verisi parse edilemedi:", e);
                    }
                }
                setEnrichedData(parsed);
            })
            .catch((e) => {
                if (cancelled) return;
                console.error("design yüklenemedi:", e);
                setEnrichedData({});
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [id]);

    // Veri değiştiğinde konumları kartta hâlihazırda durdukları hâle göre kur.
    useEffect(() => {
        setBasesByGroup(buildInitialBases(layouts));
        setInputOrderByGroup({});
        setSelectedGroup(null);
        setSelectedInput(null);
        setMessage(null);
    }, [layouts]);

    // Seçili grup o unit'ten BAŞLAR; üstüne denk gelen gruplar ileri kayar.
    const handlePlace = (targetUnit) => {
        if (selectedGroup == null || targetUnit == null) return;
        setBasesByGroup((bases) =>
            placeGroupAt(bases, layouts, selectedGroup, targetUnit, units.length)
        );
        setSelectedGroup(null);
        setSelectedInput(null);
        setMessage({ kind: "info", text: "Grup yeni konumuna taşındı." });
    };

    /*
      Tıklama kuralları:
        - Seçim yokken bir markera tıkla    -> o grubu seç
        - Seçiliyken BAŞKA bir slota tıkla  -> grup oradan başlar (çakışanlar kayar)
        - Seçili grubun kendi GİRİŞİNE tıkla-> o girişi işaretle; ikinci girişe
                                               tıklayınca ikisi grup içinde takas olur
        - Seçili grubun ÇIKIŞINA tıkla      -> seçimi bırak
    */
    const handleSelect = (item) => {
        if (!isAdmin) return; // user modu: salt görüntüleme, düzenleme yok
        setMessage(null);
        const { groupId, switch_id: switchId, kind, connIndex } = item;

        if (selectedGroup == null) {
            setSelectedGroup(groupId);
            setSelectedInput(null);
            return;
        }

        if (selectedGroup !== groupId) {
            setSelectedInput(null);
            handlePlace(slotIndex[String(switchId)]?.unit);
            return;
        }

        // Buradan sonrası seçili grubun kendi noktaları
        if (kind !== "connection") {
            setSelectedGroup(null);
            setSelectedInput(null);
            return;
        }

        if (selectedInput == null) {
            setSelectedInput({ groupId, connIndex });
            return;
        }
        if (selectedInput.connIndex === connIndex) {
            setSelectedInput(null); // aynı girişe tekrar -> işareti kaldır
            return;
        }

        const layout = layouts[groupId];
        setInputOrderByGroup((orders) => ({
            ...orders,
            [groupId]: swapInputsInOrder(
                orders[groupId] || layout.connectionIndices,
                selectedInput.connIndex,
                connIndex
            ),
        }));
        setSelectedInput(null);
        setMessage({ kind: "info", text: "Grup içindeki iki giriş takas edildi." });
    };

    // Seçili grubu karttan kaldırıp kenarda beklet. Slotları boşalır, yerleşimi
    // (layout) korunur; sonra istediğin slota geri koyabilirsin.
    const handleRemove = () => {
        if (selectedGroup == null) return;
        setBasesByGroup((bases) => ({ ...bases, [selectedGroup]: null }));
        setSelectedGroup(null);
        setSelectedInput(null);
        setMessage({ kind: "info", text: "Grup karttan kaldırıldı, kenarda bekliyor." });
    };

    // Güncel yerleşimi { design_ID, switch } olarak backend'e gönderir.
    const handleSave = async () => {
        const payload = buildSwitchPayload(enrichedData, slotsByGroup);

        // Eski/yeni karşılaştırması -> gözle doğrulamak için
        const ids = (list) => (list || []).map((c) => c.swicth_id ?? "—").join(" ");
        console.group("Kaydedilecek switch verisi");
        console.table(
            Object.entries(payload).map(([groupId, pointData]) => {
                const before = enrichedData[groupId] || {};
                return {
                    grup: groupId,
                    etiket: pointData.owner_node_label ?? "",
                    cikis_eski: before.swicth_id ?? "—",
                    cikis_yeni: pointData.swicth_id ?? "(kaldırıldı)",
                    girisler_eski: ids(before.connections),
                    girisler_yeni: ids(pointData.connections),
                };
            })
        );
        console.log("gönderilen:", { design_ID: id, switch: payload });
        console.groupEnd();

        setSaving(true);
        setMessage(null);
        try {
            const res = await updateSwitch({ design_ID: id, switch: payload });
            console.log("updateSwitch cevabı:", res);
            if (res?.error) {
                setMessage({
                    kind: "error",
                    text: "Kaydedilemedi: " + (res.error.message ?? res.error),
                });
            } else {
                setMessage({ kind: "info", text: "Yerleşim kaydedildi." });
            }
        } catch (e) {
            console.error("updateSwitch hatası:", e);
            setMessage({ kind: "error", text: "Kaydedilemedi: " + (e.message || e) });
        } finally {
            setSaving(false);
        }
    };

    const resetPlacement = () => {
        setBasesByGroup(buildInitialBases(layouts));
        setInputOrderByGroup({});
        setSelectedGroup(null);
        setSelectedInput(null);
        setMessage({ kind: "info", text: "Yerleşim ilk haline döndürüldü." });
    };

    const slotsByGroup = allocateSlots(basesByGroup, layouts, units, inputOrderByGroup);
    const { labelsByCard, unplaced } = buildLabelsByCard(enrichedData, slotsByGroup);
    const groupMeta = buildGroupMeta(enrichedData);
    const parkedGroups = Object.keys(layouts).filter((g) => basesByGroup[g] == null);
    const linksByCard = buildInternalLinks(
        layouts,
        basesByGroup,
        slotsByGroup,
        units,
        groupMeta
    );

    // Seçilen kart sayısı kadar kart + veri taşan bir karta düştüyse o da görünür.
    const keysToRender = CARD_ORDER.filter(
        (k, i) => i < cardCount || labelsByCard[k]?.length
    );

    // Üzerinde grup olmayan slotlar -> tıklanabilir hedefler.
    // Grup içinde dahili bağlı olan slotlar fiziksel olarak dolu sayılır.
    const occupied = new Set();
    Object.values(slotsByGroup).forEach((s) => {
        if (s.owner) occupied.add(s.owner);
        s.connections.forEach((c) => c && occupied.add(c));
    });
    Object.values(linksByCard).forEach((cardLinks) =>
        cardLinks.forEach((link) => occupied.add(link.switchId))
    );
    const freeSlotsByCard = {};
    keysToRender.forEach((cardKey) => {
        freeSlotsByCard[cardKey] = Object.entries(CARD_CONFIG[cardKey].points)
            .filter(([switchId]) => !occupied.has(switchId) && slotIndex[switchId])
            .map(([switchId, coords]) => ({
                switchId,
                x: coords.x,
                y: coords.y,
                unit: slotIndex[switchId].unit,
            }));
    });

    return (
        <div
            style={{
                minHeight: "100vh",
                boxSizing: "border-box",
                background: "#f1f5f9",
                fontFamily: "var(--sans)",
                padding: "32px 32px 40px 156px", // soldaki sabit navbar için boşluk
            }}
            onClick={() => {
                // boşluğa tıklayınca seçimi bırak
                setSelectedGroup(null);
                setSelectedInput(null);
            }}
        >
            <div style={{ maxWidth: 1180, margin: "0 auto" }}>
                {/* Takas çubuğu: ne yapılacağını söyler ve geri alma imkanı verir */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        minHeight: 34,
                        marginBottom: 8,
                        fontSize: 13,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {isAdmin ? (
                        <span style={{ color: "#475569" }}>
                            {selectedInput
                                ? "Takas için grubun başka bir girişine tıkla."
                                : selectedGroup
                                ? "Taşımak için bir slota tıkla, ya da grubun kendi girişine tıklayıp takas et."
                                : "Taşımak için bir gruba tıkla."}
                        </span>
                    ) : (
                        <span style={{ color: "#94a3b8" }}>Görüntüleme modu</span>
                    )}

                    <label style={{ marginLeft: "auto", color: "#475569" }}>
                        Kart sayısı{" "}
                        <select
                            value={cardCount}
                            onChange={(e) => setCardCount(Number(e.target.value))}
                            style={{
                                padding: "4px 6px",
                                fontSize: 12,
                                border: "1px solid #cbd5e1",
                                borderRadius: 6,
                            }}
                        >
                            {[1, 2, 3, 4].map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                    </label>

                    {isAdmin && (
                        <>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                style={{
                                    padding: "5px 14px",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: "#fff",
                                    background: saving ? "#93c5fd" : "#2563eb",
                                    border: `1px solid ${saving ? "#93c5fd" : "#2563eb"}`,
                                    borderRadius: 6,
                                    cursor: saving ? "default" : "pointer",
                                }}
                            >
                                {saving ? "Kaydediliyor…" : "Kaydet"}
                            </button>

                            <button
                                onClick={handleRemove}
                                disabled={selectedGroup == null}
                                style={{
                                    padding: "5px 12px",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: selectedGroup == null ? "#cbd5e1" : "#b91c1c",
                                    background: "#fff",
                                    border: `1px solid ${selectedGroup == null ? "#e2e8f0" : "#fecaca"}`,
                                    borderRadius: 6,
                                    cursor: selectedGroup == null ? "default" : "pointer",
                                }}
                            >
                                Karttan kaldır
                            </button>

                            <button
                                onClick={resetPlacement}
                                style={{
                                    padding: "5px 12px",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: "#475569",
                                    background: "#fff",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: 6,
                                    cursor: "pointer",
                                }}
                            >
                                Yerleşimi sıfırla
                            </button>
                        </>
                    )}
                </div>

                {/* Bekleme rafı: karttan kaldırılmış gruplar. Tıkla -> seç, sonra
                    karttaki bir slota tıkla -> oradan başlayarak geri koy. */}
                {parkedGroups.length > 0 && (
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 12,
                            padding: "10px 12px",
                            background: "#fff",
                            border: "1px dashed #cbd5e1",
                            borderRadius: 8,
                        }}
                    >
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>
                            Kenarda bekleyenler
                        </span>
                        {parkedGroups.map((groupId) => {
                            const meta = groupMeta[groupId] || {};
                            const isSelected = selectedGroup === groupId;
                            return (
                                <button
                                    key={groupId}
                                    onClick={() =>
                                        isAdmin && setSelectedGroup(isSelected ? null : groupId)
                                    }
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 6,
                                        padding: "4px 10px",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: isSelected ? "#fff" : "#0f172a",
                                        background: isSelected ? meta.color : "#f8fafc",
                                        border: `1px solid ${meta.color || "#cbd5e1"}`,
                                        borderRadius: 999,
                                        cursor: "pointer",
                                    }}
                                >
                                    <span
                                        style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: "50%",
                                            background: isSelected ? "#fff" : meta.color,
                                        }}
                                    />
                                    {meta.primary}
                                    {meta.secondary ? " · " + meta.secondary : ""}
                                    <span style={{ fontWeight: 500, opacity: 0.7 }}>
                                        ({meta.connectionCount})
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {message && (
                    <div
                        style={{
                            marginBottom: 12,
                            padding: "8px 12px",
                            borderRadius: 6,
                            fontSize: 13,
                            color: message.kind === "error" ? "#991b1b" : "#166534",
                            background: message.kind === "error" ? "#fee2e2" : "#dcfce7",
                            border: `1px solid ${message.kind === "error" ? "#fecaca" : "#bbf7d0"}`,
                        }}
                    >
                        {message.text}
                    </div>
                )}

                {/* Yerleştirilemeyen noktalar sessizce düşmesin */}
                {unplaced.length > 0 && (
                    <div
                        style={{
                            marginBottom: 12,
                            padding: "8px 12px",
                            borderRadius: 6,
                            fontSize: 13,
                            color: "#92400e",
                            background: "#fef3c7",
                            border: "1px solid #fde68a",
                        }}
                    >
                        {unplaced.length} nokta yerleştirilemedi — kart kapasitesi doldu ya da
                        CARD_CONFIG'te karşılığı yok.
                    </div>
                )}

                {loading ? (
                    <div style={{ fontSize: 14, color: "#94a3b8" }}>Yükleniyor…</div>
                ) : (
                    keysToRender.map((cardKey) => (
                        <SwitchCard
                            key={cardKey}
                            cardKey={cardKey}
                            cardConfig={CARD_CONFIG[cardKey]}
                            labels={labelsByCard[cardKey]}
                            selectedGroup={selectedGroup}
                            selectedInput={selectedInput}
                            onSelect={handleSelect}
                            freeSlots={freeSlotsByCard[cardKey]}
                            onPlace={handlePlace}
                            links={linksByCard[cardKey]}
                        />
                    ))
                )}
            </div>
        </div>
    );
}