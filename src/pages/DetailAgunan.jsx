import { useEffect, useState } from "react";

import asetgoLogo from "../assets/asetgo-logo.png";
function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function DetailAgunan({ data, onBack }) {
  const images = Array.isArray(data?.images)
    ? data.images.filter(Boolean)
    : [data?.image, data?.image2, data?.image3, data?.image4].filter(Boolean);

  const [activeImage, setActiveImage] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showWhatsAppContacts, setShowWhatsAppContacts] = useState(false);

  // =========================================
  // REFERRAL WHATSAPP
  // Contoh: https://asetgo.vercel.app/?ref=gani
  // Referral disimpan selama sesi browser.
  // Tidak mengubah struktur/database agunan.
  // =========================================
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = String(params.get("ref") || "").trim().toLowerCase();

      if (ref) {
        sessionStorage.setItem("asetgo_referral", ref);
      }
    } catch (error) {
      console.warn("Referral tidak dapat disimpan:", error);
    }
  }, []);

  useEffect(() => {
    setActiveImage(0);
    setLightbox(false);
  }, [data?.id]);

  useEffect(() => {
    if (!lightbox) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") setLightbox(false);
      if (event.key === "ArrowLeft" && images.length > 1) {
        setActiveImage((current) =>
          current === 0 ? images.length - 1 : current - 1
        );
      }
      if (event.key === "ArrowRight" && images.length > 1) {
        setActiveImage((current) =>
          current === images.length - 1 ? 0 : current + 1
        );
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightbox, images.length]);

  function previousImage() {
    if (images.length < 2) return;
    setActiveImage((current) =>
      current === 0 ? images.length - 1 : current - 1
    );
  }

  function nextImage() {
    if (images.length < 2) return;
    setActiveImage((current) =>
      current === images.length - 1 ? 0 : current + 1
    );
  }

  // =====================================================
  // KONTAK WHATSAPP PENJUAL
  // Tambahkan / ubah kontak di daftar ini.
  // Nomor gunakan format internasional tanpa tanda +.
  // Contoh Indonesia: 0812xxxx -> 62812xxxx
  // =====================================================
  const whatsappContacts = [
    {
      nama: "Wira",
      nomor: "6281236807690",
    },
    {
      nama: "Sari",
      nomor: "6287785537442",
    },
    {
      nama: "Riza",
      nomor: "6281916706455",
    },
    {
      nama: "Gani",
      nomor: "6287760331388",
    },
    {
      nama: "Gita",
      nomor: "628814649572",
    },
    {
      nama: "Puspa",
      nomor: "6287784793547",
    },
    {
      nama: "Lia",
      nomor: "6281236002393",
    },
  ];

  function getReferralContact() {
    try {
      const ref = String(
        sessionStorage.getItem("asetgo_referral") || ""
      )
        .trim()
        .toLowerCase();

      if (!ref) return null;

      // Referral mengikuti nama yang dipakai pada URL.
      // Contoh: ?ref=gani -> Admin 4 (Gani).
      return (
        whatsappContacts.find((contact) => {
          const nama = String(contact.nama || "").toLowerCase();
          return (
            nama.includes(`(${ref})`) ||
            nama.includes(ref)
          );
        }) || null
      );
    } catch (error) {
      console.warn("Gagal membaca referral:", error);
      return null;
    }
  }

  function openWhatsApp() {
    const params = new URLSearchParams(window.location.search);
    const referral = String(
      params.get("ref") || ""
    ).trim().toLowerCase();

    // Jika ada referral yang valid, langsung ke orang tersebut.
    // Jika tidak ada referral, default ke Wira.
    const contact =
      whatsappContacts.find(
        (item) =>
          item.nama.toLowerCase() === referral
      ) || whatsappContacts[0];

    openWhatsAppContact(contact);
  }

  function openWhatsAppContact(contact) {
    const pesan =
      `Halo, saya tertarik dengan agunan ${data?.kode || ""} - ${data?.nama || ""}. ` +
      `Harga: ${formatRupiah(data?.harga)}. Saya ingin mendapatkan informasi lebih lanjut mengenai aset tersebut.`;

    const nomor = String(contact.nomor || "")
      .replace(/\D/g, "");

    if (!nomor) return;

    window.open(
      `https://wa.me/${nomor}?text=${encodeURIComponent(pesan)}`,
      "_blank",
      "noopener,noreferrer"
    );

    setShowWhatsAppContacts(false);
  }

  async function copyKode() {
    if (!data?.kode) return;

    try {
      await navigator.clipboard.writeText(String(data.kode));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("Gagal menyalin kode:", error);
    }
  }

  async function shareAsset() {
    const shareData = {
      title: data?.nama || "Agunan Bank",
      text: `${data?.nama || "Agunan"} - ${formatRupiah(data?.harga)}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link aset berhasil disalin.");
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error("Gagal membagikan aset:", error);
      }
    }
  }

  if (!data) return null;

  return (
    <div className="detail-page">
      <header className="detail-header">
        <div className="container detail-header-inner">
          <button
            type="button"
            className="detail-brand"
            onClick={onBack}
            aria-label="Kembali ke daftar agunan"
          >
            <img
              src={asetgoLogo}
              alt="AsetGo"
              className="detail-brand-logo"
            />
          </button>

          <nav className="detail-header-nav" aria-label="Navigasi">
            <button type="button" onClick={onBack}>
              Daftar Agunan
            </button>
          </nav>

          <button type="button" className="back-button" onClick={onBack}>
            ← Kembali
          </button>
        </div>
      </header>

      <main className="container detail-main">
        <div className="detail-breadcrumb">
          <span>Daftar Agunan</span>
          <span>›</span>
          <strong>{data.kode}</strong>
        </div>

        <div className="detail-grid">
          {/* ================= GALERI ================= */}
          <div className="gallery">
            <div
              className="main-photo"
              style={{ position: "relative", cursor: images.length ? "zoom-in" : "default" }}
              onClick={() => images.length && setLightbox(true)}
            >
              {images.length > 0 ? (
                <img
                  src={images[activeImage]}
                  alt={data.nama || "Foto aset"}
                  className="detail-main-image"
                />
              ) : (
                <div className="main-photo-placeholder">
                  <span>🏠</span>
                  <small>FOTO ASET</small>
                </div>
              )}

              <div className="photo-badge">
                {data.status || "TERSEDIA"}
              </div>

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Foto sebelumnya"
                    onClick={(event) => {
                      event.stopPropagation();
                      previousImage();
                    }}
                    style={navButtonStyle("left")}
                  >
                    ‹
                  </button>

                  <button
                    type="button"
                    aria-label="Foto berikutnya"
                    onClick={(event) => {
                      event.stopPropagation();
                      nextImage();
                    }}
                    style={navButtonStyle("right")}
                  >
                    ›
                  </button>

                  <div style={counterStyle}>
                    {activeImage + 1} / {images.length}
                  </div>
                </>
              )}
            </div>

            {images.length > 0 && (
              <div className="thumbnail-list">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    className={
                      activeImage === index ? "thumbnail active" : "thumbnail"
                    }
                    onClick={() => setActiveImage(index)}
                  >
                    <img
                      src={image}
                      alt={`${data.nama || "Aset"} ${index + 1}`}
                      className="thumbnail-image"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ================= INFORMASI UTAMA ================= */}
          <div className="detail-info">
            <div className="detail-code-row">
              <div className="detail-code">{data.kode || "-"}</div>
              <button type="button" onClick={copyKode} className="copy-code-button">
                {copied ? "✓ Tersalin" : "Salin Kode"}
              </button>
            </div>

            <h1>{data.nama || "-"}</h1>

            <div className="detail-location">📍 {data.lokasi || "-"}</div>

            <div className="detail-price">{formatRupiah(data.harga)}</div>

            <div className="price-note">
              Harga dapat berubah sesuai ketentuan penjualan aset.
            </div>

            <div className="quick-info">
              <div>
                <span>Jenis Aset</span>
                <strong>{data.jenis || "-"}</strong>
              </div>

              <div>
                <span>Luas Tanah</span>
                <strong>{data.luasTanah ? `${data.luasTanah} m²` : "-"}</strong>
              </div>

              <div>
                <span>Luas Bangunan</span>
                <strong>
                  {Number(data.luasBangunan || 0) > 0
                    ? `${data.luasBangunan} m²`
                    : "-"}
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong className="status-text">{data.status || "-"}</strong>
              </div>
            </div>

            <div className="contact-box">
              <div>
                <span>Tertarik dengan aset ini?</span>
                <strong>Hubungi kami melalui WhatsApp untuk informasi lebih lanjut.</strong>
              </div>

              <div className="contact-buttons">
                <button type="button" className="whatsapp-button" onClick={openWhatsApp}>
                  💬 WhatsApp
                </button>

                <button type="button" className="contact-button" onClick={shareAsset}>
                  ↗ Bagikan
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================= SPESIFIKASI ================= */}
        <section className="detail-section">
          <div className="detail-section-title">
            <span>INFORMASI ASET</span>
            <h2>Spesifikasi Agunan</h2>
          </div>

          <div className="specification-grid">
            <div className="spec-item">
              <span>Kode Aset</span>
              <strong>{data.kode || "-"}</strong>
            </div>
            <div className="spec-item">
              <span>Nama Aset</span>
              <strong>{data.nama || "-"}</strong>
            </div>
            <div className="spec-item">
              <span>Jenis Aset</span>
              <strong>{data.jenis || "-"}</strong>
            </div>
            <div className="spec-item">
              <span>Lokasi</span>
              <strong>{data.lokasi || "-"}</strong>
            </div>
            <div className="spec-item">
              <span>Luas Tanah</span>
              <strong>{data.luasTanah ? `${data.luasTanah} m²` : "-"}</strong>
            </div>
            <div className="spec-item">
              <span>Luas Bangunan</span>
              <strong>
                {Number(data.luasBangunan || 0) > 0
                  ? `${data.luasBangunan} m²`
                  : "-"}
              </strong>
            </div>
            <div className="spec-item">
              <span>Harga</span>
              <strong>{formatRupiah(data.harga)}</strong>
            </div>
            <div className="spec-item">
              <span>Status</span>
              <strong>{data.status || "-"}</strong>
            </div>
          </div>
        </section>

        {/* ================= DOKUMEN ================= */}
        <section className="detail-section">
          <div className="detail-section-title">
            <span>DOKUMEN</span>
            <h2>Status Dokumen</h2>
          </div>

          <div className="legal-grid">
            <div className="legal-item">
              <div className="legal-icon">✓</div>
              <div>
                <span>Jenis Sertifikat</span>
                <strong>{data.sertifikat || "-"}</strong>
              </div>
            </div>
          </div>

          <p style={{ marginTop: 16, color: "#71817f", fontSize: 13 }}>
            Untuk pemeriksaan dokumen dan informasi lengkap, silakan hubungi melalui WhatsApp.
          </p>
        </section>

        {/* ================= DESKRIPSI ================= */}
        <section className="detail-section">
          <div className="detail-section-title">
            <span>KETERANGAN</span>
            <h2>Deskripsi Aset</h2>
          </div>

          <div className="description">
            <p>{data.deskripsi || "Belum ada deskripsi untuk aset ini."}</p>
          </div>
        </section>

        <section className="important-note">
          <div className="important-icon">!</div>
          <div>
            <strong>Catatan Penting</strong>
            <p>
              Informasi yang ditampilkan pada website ini merupakan informasi mengenai aset yang tersedia untuk dijual. Harga, status, dan informasi lainnya dapat berubah sewaktu-waktu sesuai dengan ketentuan pihak bank.
            </p>
          </div>
        </section>
      </main>

      <footer>
        <div className="container footer-grid">
          <div>
            <div className="brand footer-brand">
              <img
                src={asetgoLogo}
                alt="AsetGo"
                className="footer-brand-image"
              />
            </div>
            <p>Portal informasi aset dan agunan bank yang tersedia untuk dijual.</p>
          </div>

          <div>
            <h4>Navigasi</h4>
            <button type="button" onClick={onBack}>Daftar Agunan</button>
          </div>

          <div>
            <h4>Hubungi Kami</h4>
            <button
              type="button"
              onClick={openWhatsApp}
              style={footerWhatsAppButtonStyle}
              aria-label="Hubungi kami melalui WhatsApp"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M20.52 3.48A11.82 11.82 0 0 0 12.1 0C5.55 0 .22 5.32.22 11.88c0 2.1.55 4.15 1.59 5.95L.12 24l6.32-1.66a11.84 11.84 0 0 0 5.66 1.44h.01c6.55 0 11.88-5.33 11.88-11.88 0-3.18-1.24-6.17-3.47-8.42Z"
                  fill="#25D366"
                />
                <path
                  d="M17.53 14.1c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.09 4.49.71.31 1.27.5 1.71.64.72.23 1.38.2 1.9.12.58-.09 1.76-.72 2.01-1.41.25-.69.25-1.28.17-1.41-.07-.12-.27-.2-.57-.35Z"
                  fill="#fff"
                />
              </svg>
              <span>WhatsApp</span>
            </button>
          </div>
        </div>

        <div className="copyright">© 2026 AsetGo. Seluruh hak cipta dilindungi.</div>
      </footer>

      {/* ================= PILIH KONTAK WHATSAPP ================= */}
      {showWhatsAppContacts && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pilih kontak WhatsApp"
          onClick={() => setShowWhatsAppContacts(false)}
          style={whatsappOverlayStyle}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={whatsappModalStyle}
          >
            <div style={whatsappModalHeaderStyle}>
              <div>
                <div style={whatsappEyebrowStyle}>
                  HUBUNGI PENJUAL
                </div>
                <h3 style={whatsappTitleStyle}>
                  Pilih Kontak WhatsApp
                </h3>
                <p style={whatsappSubtitleStyle}>
                  Pilih salah satu kontak untuk menanyakan aset ini.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowWhatsAppContacts(false)}
                aria-label="Tutup pilihan kontak"
                style={whatsappCloseStyle}
              >
                ×
              </button>
            </div>

            <div style={whatsappContactListStyle}>
              {whatsappContacts.map((contact, index) => (
                <button
                  key={`${contact.nomor}-${index}`}
                  type="button"
                  onClick={() => openWhatsAppContact(contact)}
                  style={whatsappContactItemStyle}
                >
                  <span style={whatsappAvatarStyle}>
                    <svg
                      viewBox="0 0 24 24"
                      width="22"
                      height="22"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        cx="12"
                        cy="7"
                        r="4"
                        fill="currentColor"
                      />
                      <path
                        d="M4.5 21c.7-4.1 3.1-6.5 7.5-6.5s6.8 2.4 7.5 6.5"
                        fill="currentColor"
                      />
                    </svg>
                  </span>

                  <span style={whatsappContactInfoStyle}>
                    <strong>{contact.nama}</strong>
                    <small>{contact.nomor}</small>
                  </span>

                  <span style={whatsappContactActionStyle}>
                    WhatsApp
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowWhatsAppContacts(false)}
              style={whatsappCancelStyle}
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* ================= LIGHTBOX ================= */}
      {lightbox && images.length > 0 && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(false)}
          style={lightboxStyle}
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            aria-label="Tutup"
            style={closeButtonStyle}
          >
            ×
          </button>

          {images.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                previousImage();
              }}
              style={lightboxNavStyle("left")}
              aria-label="Foto sebelumnya"
            >
              ‹
            </button>
          )}

          <img
            src={images[activeImage]}
            alt={data.nama || "Foto aset"}
            onClick={(event) => event.stopPropagation()}
            style={lightboxImageStyle}
          />

          {images.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                nextImage();
              }}
              style={lightboxNavStyle("right")}
              aria-label="Foto berikutnya"
            >
              ›
            </button>
          )}

          <div style={lightboxCounterStyle}>
            {activeImage + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}

const navButtonStyle = (side) => ({
  position: "absolute",
  [side]: 12,
  top: "50%",
  transform: "translateY(-50%)",
  width: 40,
  height: 40,
  border: "none",
  borderRadius: "50%",
  background: "rgba(0,0,0,.48)",
  color: "#fff",
  fontSize: 30,
  lineHeight: 1,
  cursor: "pointer",
  zIndex: 3,
});

const counterStyle = {
  position: "absolute",
  right: 12,
  bottom: 12,
  padding: "5px 9px",
  borderRadius: 20,
  background: "rgba(0,0,0,.55)",
  color: "#fff",
  fontSize: 12,
  zIndex: 3,
};

const lightboxStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  background: "rgba(0,0,0,.92)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
};

const lightboxImageStyle = {
  maxWidth: "92vw",
  maxHeight: "88vh",
  objectFit: "contain",
  borderRadius: 8,
  userSelect: "none",
};

const closeButtonStyle = {
  position: "absolute",
  top: 18,
  right: 22,
  width: 42,
  height: 42,
  border: "none",
  borderRadius: "50%",
  background: "rgba(255,255,255,.12)",
  color: "#fff",
  fontSize: 30,
  cursor: "pointer",
  zIndex: 4,
};

const lightboxNavStyle = (side) => ({
  position: "absolute",
  [side]: 20,
  top: "50%",
  transform: "translateY(-50%)",
  width: 48,
  height: 48,
  border: "none",
  borderRadius: "50%",
  background: "rgba(255,255,255,.14)",
  color: "#fff",
  fontSize: 38,
  cursor: "pointer",
  zIndex: 4,
});

const lightboxCounterStyle = {
  position: "absolute",
  bottom: 18,
  left: "50%",
  transform: "translateX(-50%)",
  color: "#fff",
  fontSize: 13,
  padding: "6px 12px",
  borderRadius: 20,
  background: "rgba(0,0,0,.5)",
};

const whatsappOverlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 10000,
  background: "rgba(8, 24, 21, .58)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  backdropFilter: "blur(3px)",
};

const whatsappModalStyle = {
  width: "min(460px, 100%)",
  maxHeight: "calc(100vh - 40px)",
  overflowY: "auto",
  background: "#fff",
  borderRadius: 18,
  boxShadow: "0 24px 70px rgba(0,0,0,.22)",
  padding: 24,
  boxSizing: "border-box",
};

const whatsappModalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 18,
  marginBottom: 20,
};

const whatsappEyebrowStyle = {
  color: "#087568",
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: "1.2px",
  marginBottom: 5,
};

const whatsappTitleStyle = {
  margin: 0,
  color: "#17302c",
  fontSize: 22,
  lineHeight: 1.2,
};

const whatsappSubtitleStyle = {
  margin: "7px 0 0",
  color: "#71817f",
  fontSize: 12,
  lineHeight: 1.5,
};

const whatsappCloseStyle = {
  width: 34,
  height: 34,
  border: "none",
  borderRadius: "50%",
  background: "#f1f5f3",
  color: "#52635f",
  fontSize: 24,
  lineHeight: 1,
  cursor: "pointer",
  flexShrink: 0,
};

const whatsappContactListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const whatsappContactItemStyle = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: 13,
  border: "1px solid #dfe8e5",
  borderRadius: 12,
  background: "#fff",
  cursor: "pointer",
  textAlign: "left",
  transition: "all .18s ease",
};

const whatsappAvatarStyle = {
  width: 42,
  height: 42,
  borderRadius: "50%",
  background: "#e5f4ef",
  color: "#087568",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 16,
  fontWeight: 800,
  flexShrink: 0,
};

const whatsappContactInfoStyle = {
  minWidth: 0,
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const whatsappContactActionStyle = {
  padding: "7px 10px",
  borderRadius: 7,
  background: "#087568",
  color: "#fff",
  fontSize: 10,
  fontWeight: 800,
  flexShrink: 0,
};

const whatsappCancelStyle = {
  width: "100%",
  marginTop: 14,
  padding: "11px 14px",
  border: "1px solid #dfe8e5",
  borderRadius: 9,
  background: "#f8faf9",
  color: "#52635f",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const footerWhatsAppButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  border: 0,
  padding: 0,
  background: "transparent",
  color: "#fff",
  cursor: "pointer",
  font: "inherit",
  textAlign: "left",
};

const footerLinkStyle = {
  border: 0,
  padding: 0,
  background: "transparent",
  cursor: "pointer",
  font: "inherit",
  textAlign: "left",
};

export default DetailAgunan;