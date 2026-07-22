import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import swIMG from './../assest/switch.png';
import {getDesign} from './../services/DesignService';


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

// switch_id'nin son 2 bitini okuyup hangi karta ait olduğunu bulur
function getCardKeyFromSwitchId(switchId) {
    if (!switchId || switchId.length < 2) return null;
    return switchId.slice(-2);
}

/*
  enrichedData: bizim enrich_connections_with_labels fonksiyonunun döndürdüğü obje.
  Bu fonksiyon, enrichedData içindeki her noktayı (hem owner hem connections)
  dolaşıp, switch_id'lerine göre hangi karta, hangi koordinata ve
  hangi label'a karşılık geldiğini çıkarır.
*/
function buildLabelsByCard(enrichedData) {
    const labelsByCard = {}; // { "00": [{switch_id, x, y, text}], "01": [...] }

    // enrichedData'nın her üst seviye anahtarı (h-...) bir gruptur: bir owner (çıkış)
    // ve ona bağlı connections. Aynı grubun tüm noktaları aynı rengi alır; böylece
    // hangi çıkışın hangi bağlantılara gittiği renkten anlaşılır.
    Object.entries(enrichedData || {}).forEach(([pointId, pointData], groupIndex) => {
        const color = GROUP_PALETTE[groupIndex % GROUP_PALETTE.length];

        // 1. Üst seviye noktanın (çıkışın) kendi switch_id'si
        const ownerSwitchId = pointData.swicth_id;
        const ownerCardKey = getCardKeyFromSwitchId(ownerSwitchId);
        if (ownerCardKey && CARD_CONFIG[ownerCardKey]) {
            const coords = CARD_CONFIG[ownerCardKey].points[ownerSwitchId];
            if (coords) {
                if (!labelsByCard[ownerCardKey]) labelsByCard[ownerCardKey] = [];
                labelsByCard[ownerCardKey].push({
                    switch_id: ownerSwitchId,
                    x: coords.x,
                    y: coords.y,
                    kind: "owner",
                    color,
                    primary: pointData.owner_node_label ?? "",
                    secondary: pointData.handle_label ?? "",
                });
            }
        }

        // 2. Bu noktanın bağlı olduğu her connection'ın kendi switch_id'si
        (pointData.connections || []).forEach((conn) => {
            const connCardKey = getCardKeyFromSwitchId(conn.swicth_id);
            if (connCardKey && CARD_CONFIG[connCardKey]) {
                const coords = CARD_CONFIG[connCardKey].points[conn.swicth_id];
                if (coords) {
                    if (!labelsByCard[connCardKey]) labelsByCard[connCardKey] = [];
                    labelsByCard[connCardKey].push({
                        switch_id: conn.swicth_id,
                        x: coords.x,
                        y: coords.y,
                        kind: "connection",
                        color,
                        primary: conn.connected_node_label ?? "",
                        secondary: conn.connected_handle_label ?? "",
                    });
                }
            }
        });
    });

    return labelsByCard;
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
function Marker({ item }) {
    const isTop = item.y < 50;
    const color = item.color || "#2563eb";

    const dot = (
        <div
            style={{
                width: 11,
                height: 11,
                borderRadius: "50%",
                background: color,
                border: "2px solid #fff",
                boxShadow: `0 0 0 1.5px ${color}`,
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
                background: "#fff",
                border: `1px solid ${color}`,
                borderRadius: 7,
                padding: "6px 4px",
                boxShadow: "0 3px 8px rgba(15,23,42,0.14)",
                whiteSpace: "nowrap",
                lineHeight: 1.2,
                letterSpacing: 0,
            }}
        >
            <span style={{ fontSize: 11, fontWeight: 700, color: "#0f172a" }}>{item.primary}</span>
            {item.secondary && (
                <span style={{ fontSize: 10, fontWeight: 500, color: "#64748b" }}>
                    {" · " + item.secondary}
                </span>
            )}
        </div>
    );

    return (
        <div
            style={{
                position: "absolute",
                left: item.x + "%",
                top: item.y + "%",
                transform: isTop ? "translate(-50%, -100%)" : "translate(-50%, 0)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                pointerEvents: "none",
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

function SwitchCard({ cardKey, cardConfig, labels }) {
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
                    {(labels || []).map((item, i) => (
                        <Marker key={cardKey + "-" + item.switch_id + "-" + i} item={item} />
                    ))}
                </div>
            </div>
        </div>
    );
}



export default function SwitchCardBoard() {
    const { id } = useParams();
    const [enrichedData, setEnrichedData] = useState({});
    const [loading, setLoading] = useState(true);

    // activeCardKeys backend'de henüz yok -> şimdilik statik "00".
    // Sonra bu değeri de API'den nereden çekeceğimize bakacağız.
    const activeCardKeys = ["00","01"];

    // Sayfa açılınca URL'deki design id ile getDesign'a istek at.
    // Dönen kayıttaki "switch" verisi (bazen string) bizim enrichedData'mız.
    useEffect(() => {
        if (!id) return;
        setLoading(true);
        getDesign({ id })
            .then((res) => {
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
                console.error("design yüklenemedi:", e);
                setEnrichedData({});
            })
            .finally(() => setLoading(false));
    }, [id]);

    const labelsByCard = buildLabelsByCard(enrichedData);

    // Backend hangi kartların kullanıldığını söylüyorsa (activeCardKeys = ["00","01"] gibi)
    // sadece onları göster. Verilmezse, elimizde label'ı olan tüm kartları göster.
    const keysToRender =
        activeCardKeys && activeCardKeys.length > 0
            ? activeCardKeys
            : Object.keys(labelsByCard);

    return (
        <div
            style={{
                minHeight: "100vh",
                boxSizing: "border-box",
                background: "#f1f5f9",
                fontFamily: "var(--sans)",
                padding: "32px 32px 40px 156px", // soldaki sabit navbar için boşluk
            }}
        >
            <div style={{ maxWidth: 1180, margin: "0 auto" }}>
                {loading ? (
                    <div style={{ fontSize: 14, color: "#94a3b8" }}>Yükleniyor…</div>
                ) : (
                    keysToRender.map((cardKey) => {
                        const cardConfig = CARD_CONFIG[cardKey];
                        if (!cardConfig) return null;
                        return (
                            <SwitchCard
                                key={cardKey}
                                cardKey={cardKey}
                                cardConfig={cardConfig}
                                labels={labelsByCard[cardKey]}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
}