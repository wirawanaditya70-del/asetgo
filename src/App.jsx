import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";
import asetgoLogo from "./assets/asetgo-logo.png";
import "./index.css";
import DetailAgunan from "./pages/DetailAgunan";
import LoginAdmin from "./pages/LoginAdmin";
import DashboardAdmin from "./pages/DashboardAdmin";

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

// =========================================
// KONTAK WHATSAPP PENJUAL
// =========================================

const whatsappContacts = [
  {
    nama: "Admin 1 (Wira)",
    nomor: "6281236807690",
  },
  {
    nama: "Admin 2 (Agus)",
    nomor: "6281236807690",
  },
  {
    nama: "Admin 3 (Riza)",
    nomor: "6281236807690",
  },
];

// =========================================
// FORMAT DATA SUPABASE
// =========================================

function formatAgunan(item) {
  const fotoUrls = Array.isArray(item.foto_urls)
    ? item.foto_urls.filter(
        (url) =>
          typeof url === "string" &&
          url.trim() !== ""
      )
    : [];

  return {
    id: item.id,

    kode: item.kode_aset,

    nama: item.nama_aset,

    jenis: item.jenis_aset,

    harga: item.harga,

    lokasi: item.lokasi,

    luasTanah: item.luas_tanah,

    luasBangunan: item.luas_bangunan || 0,

    sertifikat: item.sertifikat,

    status: item.status,

    deskripsi: item.deskripsi,

    image: fotoUrls[0] || null,

    image2: fotoUrls[1] || null,

    image3: fotoUrls[2] || null,

    image4: fotoUrls[3] || null,

    images: fotoUrls,
  };
}

// =========================================
// APP
// =========================================

function App() {
  const [agunanData, setAgunanData] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [selectedAgunan, setSelectedAgunan] =
    useState(null);

  const [showLogin, setShowLogin] =
    useState(false);

  const [adminUser, setAdminUser] =
    useState(null);

  const [showDashboard, setShowDashboard] =
    useState(false);

  const [showWhatsappModal, setShowWhatsappModal] =
    useState(false);

  const [search, setSearch] = useState("");

  const [kategori, setKategori] =
    useState("Semua");

  const [statusFilter, setStatusFilter] =
    useState("Semua");

  const [lokasiFilter, setLokasiFilter] =
    useState("Semua");

  const [hargaMin, setHargaMin] =
    useState("");

  const [hargaMax, setHargaMax] =
    useState("");

  const [sortHarga, setSortHarga] =
    useState("terendah");

  const [currentPage, setCurrentPage] =
  useState(1);

  const ITEMS_PER_PAGE = 10;

  // =========================================
  // AUTH SESSION
  // =========================================

  useEffect(() => {
    async function getSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setAdminUser(session?.user ?? null);
    }

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setAdminUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Tutup modal WhatsApp dengan tombol Escape
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setShowWhatsappModal(false);
      }
    }

    if (showWhatsappModal) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showWhatsappModal]);

  // =========================================
  // DATA AGUNAN + REALTIME
  // =========================================

  useEffect(() => {
    let mounted = true;

    // -----------------------------------------
    // LOAD DATA
    // -----------------------------------------

    async function loadAgunan() {
      try {
        setLoading(true);
        setError("");

        const {
          data,
          error: fetchError,
        } = await supabase
          .from("agunan")
          .select("*")
          .order("id", {
            ascending: true,
          });

        if (fetchError) {
          console.error(
            "Gagal mengambil data agunan:",
            fetchError
          );

          if (mounted) {
            setError(fetchError.message);
            setLoading(false);
          }

          return;
        }

        if (!mounted) return;

        const formattedData = (data || []).map(
          formatAgunan
        );

        setAgunanData(formattedData);

        setLoading(false);
      } catch (err) {
        console.error(
          "Error load agunan:",
          err
        );

        if (mounted) {
          setError(
            err?.message ||
              "Gagal mengambil data agunan."
          );

          setLoading(false);
        }
      }
    }

    // -----------------------------------------
    // LOAD DATA PERTAMA KALI
    // -----------------------------------------

    loadAgunan();

    // -----------------------------------------
    // SUPABASE REALTIME
    // -----------------------------------------

    const channel = supabase
      .channel("agunan-public-realtime")

      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "agunan",
        },
        (payload) => {
          console.log(
            "REALTIME INSERT:",
            payload
          );

          const newItem =
            formatAgunan(payload.new);

          setAgunanData((current) => {
            // Hindari data dobel
            const sudahAda = current.some(
              (item) =>
                item.id === newItem.id
            );

            if (sudahAda) {
              return current;
            }

            return [...current, newItem].sort(
              (a, b) => a.id - b.id
            );
          });
        }
      )

      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "agunan",
        },
        (payload) => {
          console.log(
            "REALTIME UPDATE:",
            payload
          );

          const updatedItem =
            formatAgunan(payload.new);

          setAgunanData((current) =>
            current
              .map((item) =>
                item.id === updatedItem.id
                  ? updatedItem
                  : item
              )
              .sort(
                (a, b) => a.id - b.id
              )
          );

          // Kalau sedang membuka detail aset
          // yang diedit, ikut update detailnya
          setSelectedAgunan((current) => {
            if (
              current &&
              current.id === updatedItem.id
            ) {
              return updatedItem;
            }

            return current;
          });
        }
      )

      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "agunan",
        },
        (payload) => {
          console.log(
            "REALTIME DELETE:",
            payload
          );

          const deletedId =
            payload.old?.id;

          if (deletedId == null) {
            console.warn(
              "DELETE realtime tidak memiliki id:",
              payload
            );

            // Fallback: ambil ulang data
            loadAgunan();

            return;
          }

          // Hapus langsung dari state
          setAgunanData((current) =>
            current.filter(
              (item) =>
                item.id !== deletedId
            )
          );

          // Kalau detail aset yang sedang dibuka
          // adalah aset yang dihapus,
          // kembali ke daftar
          setSelectedAgunan((current) => {
            if (
              current &&
              current.id === deletedId
            ) {
              return null;
            }

            return current;
          });
        }
      )

      .subscribe((status) => {
        console.log(
          "STATUS REALTIME AGUNAN:",
          status
        );

        if (status === "SUBSCRIBED") {
          console.log(
            "✅ Realtime agunan berhasil terhubung."
          );
        }

        if (status === "CHANNEL_ERROR") {
          console.error(
            "❌ Realtime agunan mengalami CHANNEL_ERROR."
          );
        }

        if (status === "TIMED_OUT") {
          console.error(
            "❌ Realtime agunan TIMED_OUT."
          );
        }

        if (status === "CLOSED") {
          console.warn(
            "⚠️ Channel realtime agunan ditutup."
          );
        }
      });

    // -----------------------------------------
    // CLEANUP
    // -----------------------------------------

    return () => {
      mounted = false;

      console.log(
        "Menutup realtime agunan..."
      );

      supabase.removeChannel(channel);
    };
  }, []);

// =========================================
// FILTER & SEARCH
// =========================================

const jenisOptions = useMemo(() => {

  return [
    ...new Set(
      agunanData
        .map((item) => item.jenis)
        .filter(Boolean)
        .map((item) =>
          String(item).trim()
        )
    ),
  ].sort((a, b) =>
    a.localeCompare(b, "id")
  );

}, [agunanData]);


const lokasiOptions = useMemo(() => {

  return [
    ...new Set(
      agunanData
        .map((item) => item.lokasi)
        .filter(Boolean)
        .map((item) =>
          String(item).trim()
        )
        .filter(Boolean)
    ),
  ].sort((a, b) =>
    a.localeCompare(b, "id")
  );

}, [agunanData]);


const filteredData = useMemo(() => {

  const keyword =
    search
      .toLowerCase()
      .trim();


  const min =
    hargaMin
      ? Number(
          String(hargaMin)
            .replace(/\D/g, "")
        )
      : null;


  const max =
    hargaMax
      ? Number(
          String(hargaMax)
            .replace(/\D/g, "")
        )
      : null;


  const hasil = agunanData.filter(
    (item) => {

      // ============================
      // SEARCH
      // ============================

      const cocokSearch =
        !keyword ||
        String(item.nama || "")
          .toLowerCase()
          .includes(keyword) ||

        String(item.kode || "")
          .toLowerCase()
          .includes(keyword) ||

        String(item.lokasi || "")
          .toLowerCase()
          .includes(keyword);


      // ============================
      // JENIS
      // ============================

      const cocokJenis =
        kategori === "Semua" ||
        String(item.jenis || "")
          .toLowerCase() ===
          kategori.toLowerCase();


      // ============================
      // STATUS
      // ============================

      const cocokStatus =
        statusFilter === "Semua" ||
        String(item.status || "")
          .toLowerCase() ===
          statusFilter.toLowerCase();


      // ============================
      // LOKASI
      // ============================

      const cocokLokasi =
        lokasiFilter === "Semua" ||
        String(item.lokasi || "")
          .trim() ===
          lokasiFilter;


      // ============================
      // HARGA
      // ============================

      const harga =
        Number(item.harga || 0);


      const cocokHargaMin =
        min === null ||
        harga >= min;


      const cocokHargaMax =
        max === null ||
        harga <= max;


      return (
        cocokSearch &&
        cocokJenis &&
        cocokStatus &&
        cocokLokasi &&
        cocokHargaMin &&
        cocokHargaMax
      );
    }
  );


  return [...hasil].sort((a, b) => {
    const hargaA = Number(a.harga || 0);
    const hargaB = Number(b.harga || 0);
    return sortHarga === "tertinggi" ? hargaB - hargaA : hargaA - hargaB;
  });

}, [
  agunanData,
  search,
  kategori,
  statusFilter,
  lokasiFilter,
  hargaMin,
  hargaMax,
  sortHarga,
]);


function formatFilterHarga(value) {

  if (!value) {
    return "";
  }

  const angka =
    String(value)
      .replace(/\D/g, "");

  if (!angka) {
    return "";
  }

  return new Intl.NumberFormat(
    "id-ID"
  ).format(
    Number(angka)
  );
}


function resetPublicFilter() {

  setSearch("");

  setKategori(
    "Semua"
  );

  setStatusFilter(
    "Semua"
  );

  setLokasiFilter(
    "Semua"
  );

  setHargaMin("");

  setHargaMax("");
  setSortHarga("terendah");
  setCurrentPage(1);
}


const filterAktif =
  search.trim() !== "" ||
  kategori !== "Semua" ||
  statusFilter !== "Semua" ||
  lokasiFilter !== "Semua" ||
  hargaMin !== "" ||
  hargaMax !== "" ||
  sortHarga !== "terendah";

  // =========================================
// PAGINATION PUBLIK
// =========================================

const totalPages =
  Math.ceil(
    filteredData.length /
      ITEMS_PER_PAGE
  );


const paginatedData =
  filteredData.slice(
    (currentPage - 1) *
      ITEMS_PER_PAGE,

    currentPage *
      ITEMS_PER_PAGE
  );


// Kalau filter membuat halaman
// yang sedang dibuka tidak tersedia
useEffect(() => {

  if (
    currentPage >
      totalPages &&
    totalPages > 0
  ) {
    setCurrentPage(
      totalPages
    );
  }

}, [
  currentPage,
  totalPages,
]);

useEffect(() => {

  setCurrentPage(1);

}, [
  search,
  kategori,
  statusFilter,
  lokasiFilter,
  hargaMin,
  hargaMax,
  sortHarga,
]);

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "12px",
          fontFamily:
            "Arial, sans-serif",
          color: "#00695c",
        }}
      >
        <div
          style={{
            fontSize: "40px",
          }}
        >
          🏦
        </div>

        <h2
          style={{
            margin: 0,
          }}
        >
          Memuat Data Agunan
        </h2>

        <p
          style={{
            margin: 0,
            color: "#777",
          }}
        >
          Menghubungkan ke database...
        </p>
      </div>
    );
  }

  // =========================================
  // ERROR
  // =========================================

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "10px",
          padding: "30px",
          textAlign: "center",
          fontFamily:
            "Arial, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: "45px",
          }}
        >
          ⚠️
        </div>

        <h2
          style={{
            margin: 0,
          }}
        >
          Gagal Memuat Data
        </h2>

        <p
          style={{
            color: "#777",
            maxWidth: "600px",
          }}
        >
          {error}
        </p>

        <button
          onClick={() =>
            window.location.reload()
          }
          style={{
            padding: "12px 22px",
            border: "none",
            borderRadius: "6px",
            background: "#00695c",
            color: "white",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  // =========================================
  // DASHBOARD ADMIN
  // =========================================

  if (
    showDashboard &&
    adminUser
  ) {
    return (
      <DashboardAdmin
        user={adminUser}
        onBack={() =>
          setShowDashboard(false)
        }
      />
    );
  }

  // =========================================
  // LOGIN ADMIN
  // =========================================

  if (showLogin) {
    return (
      <LoginAdmin
        onBack={() =>
          setShowLogin(false)
        }
        onLogin={(user) => {
          setAdminUser(user);
          setShowLogin(false);
          setShowDashboard(true);
        }}
      />
    );
  }

  // =========================================
  // HALAMAN DETAIL
  // =========================================

  if (selectedAgunan) {
    return (
      <DetailAgunan
        data={selectedAgunan}
        onBack={() =>
          setSelectedAgunan(null)
        }
      />
    );
  }

  // =========================================
  // STATISTIK
  // =========================================

  const totalAset =
    agunanData.length;

  const asetTersedia =
    agunanData.filter(
      (item) =>
        String(item.status)
          .toLowerCase() ===
        "tersedia"
    ).length;

  const asetTerjual =
    agunanData.filter(
      (item) =>
        String(item.status)
          .toLowerCase() ===
        "terjual"
    ).length;

  const jumlahLokasi =
    new Set(
      agunanData.map(
        (item) => item.lokasi
      )
    ).size;

  // =========================================
  // WEBSITE PUBLIK
  // =========================================

  return (
    <div className="app">

      {/* ================= NAVBAR ================= */}

      <header className="navbar">

        <div className="container navbar-content">

          <div className="brand">
        <img
          src={asetgoLogo}
          alt="AsetGo"
          className="brand-image"
        />
          </div>

          <nav className="navigation">

            <a href="#beranda">
              Beranda
            </a>

            <a href="#agunan">
              Daftar Agunan
            </a>

            <a href="#tentang">
              Tentang
            </a>

          </nav>

          {adminUser ? (
            <div className="admin-menu">

              <button className="admin-user-button">
                👤 Admin
              </button>

              <div className="admin-dropdown">

                <div className="admin-email">
                  {adminUser.email}
                </div>

                <button
                  onClick={() => {
                    setShowDashboard(true);
                  }}
                >
                  Dashboard Admin
                </button>

                <button
                  onClick={async () => {
                    await supabase.auth.signOut();

                    setAdminUser(null);

                    setShowDashboard(false);
                  }}
                >
                  Logout
                </button>

              </div>

            </div>
          ) : (
            <button
              className="login-button"
              onClick={() =>
                setShowLogin(true)
              }
            >
              Login Admin
            </button>
          )}

        </div>

      </header>

      {/* ================= HERO ================= */}

      <section
        className="hero"
        id="beranda"
      >

        <div className="hero-background"></div>

        <div className="container hero-content">

          <div className="hero-label">
            INFORMASI ASET & AGUNAN BANK
          </div>

          <h1>
            Temukan Aset
            <br />
            Pilihan Anda
          </h1>

          <p>
            Platform informasi aset dan agunan bank
            yang tersedia untuk dijual secara transparan,
            mudah dan terpercaya.
          </p>

          {/* SEARCH */}

          <div className="search-container">

            <span className="search-icon">
              🔍
            </span>

            <input
              type="text"
              placeholder="Cari nama aset, lokasi, atau kode aset..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            <button>
              Cari Aset
            </button>

          </div>

        </div>

      </section>

      {/* ================= STATISTIK ================= */}

      <section className="statistics">

        <div className="container statistics-grid">

          <div className="stat-item">

            <div className="stat-number">
              {totalAset}
            </div>

            <div className="stat-label">
              Total Aset
            </div>

          </div>

          <div className="stat-item">

            <div className="stat-number">
              {asetTersedia}
            </div>

            <div className="stat-label">
              Aset Tersedia
            </div>

          </div>

          <div className="stat-item">

            <div className="stat-number">
              {asetTerjual}
            </div>

            <div className="stat-label">
              Aset Terjual
            </div>

          </div>

          <div className="stat-item">

            <div className="stat-number">
              {jumlahLokasi}
            </div>

            <div className="stat-label">
              Lokasi
            </div>

          </div>

        </div>

      </section>

      {/* ================= DAFTAR AGUNAN ================= */}

      <main
        className="container main-content"
        id="agunan"
      >

        <div className="section-heading">

          <div>

            <span className="section-label">
              DAFTAR ASET
            </span>

            <h2>
              Agunan Tersedia
            </h2>

            <p>
              Jelajahi aset dan agunan yang saat ini tersedia.
            </p>

          </div>

          <div className="result-count">
            {filteredData.length} aset ditemukan
          </div>

        </div>

        {/* ================= FILTER PUBLIK ================= */}

<div
  style={{
    background: "#ffffff",
    border: "1px solid #e2e9e7",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "28px",
    boxShadow:
      "0 2px 8px rgba(0,0,0,.03)",
  }}
>

  {/* SEARCH */}

  <div
    style={{
      position: "relative",
      marginBottom: "16px",
    }}
  >

    <span
      style={{
        position: "absolute",
        left: "15px",
        top: "50%",
        transform:
          "translateY(-50%)",
        fontSize: "17px",
        color: "#71817f",
      }}
    >
      🔍
    </span>

    <input
      type="text"
      value={search}
      onChange={(e) =>
        setSearch(
          e.target.value
        )
      }
      placeholder="Cari nama aset, lokasi, atau kode aset..."
      style={{
        width: "100%",
        boxSizing: "border-box",
        padding:
          "13px 15px 13px 43px",
        border:
          "1px solid #d3ddda",
        borderRadius: "8px",
        outline: "none",
        fontSize: "14px",
        background: "#fff",
      }}
    />

  </div>


  {/* FILTER GRID */}

  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit, minmax(170px, 1fr))",
      gap: "12px",
    }}
  >

    {/* JENIS */}

    <div>

      <label
        style={{
          display: "block",
          fontSize: "11px",
          fontWeight: "700",
          color: "#657575",
          marginBottom: "6px",
          textTransform:
            "uppercase",
        }}
      >
        Jenis Aset
      </label>

      <select
        value={kategori}
        onChange={(e) =>
          setKategori(
            e.target.value
          )
        }
        style={{
          width: "100%",
          padding: "11px",
          border:
            "1px solid #d3ddda",
          borderRadius: "7px",
          background: "#fff",
          fontSize: "13px",
          boxSizing: "border-box",
        }}
      >

        <option value="Semua">
          Semua Jenis
        </option>

        {jenisOptions.map(
          (jenis) => (

            <option
              key={jenis}
              value={jenis}
            >
              {jenis}
            </option>

          )
        )}

      </select>

    </div>


    {/* STATUS */}

    <div>

      <label
        style={{
          display: "block",
          fontSize: "11px",
          fontWeight: "700",
          color: "#657575",
          marginBottom: "6px",
          textTransform:
            "uppercase",
        }}
      >
        Status
      </label>

      <select
        value={statusFilter}
        onChange={(e) =>
          setStatusFilter(
            e.target.value
          )
        }
        style={{
          width: "100%",
          padding: "11px",
          border:
            "1px solid #d3ddda",
          borderRadius: "7px",
          background: "#fff",
          fontSize: "13px",
          boxSizing: "border-box",
        }}
      >

        <option value="Semua">
          Semua Status
        </option>

        <option value="Tersedia">
          Tersedia
        </option>

        <option value="Terjual">
          Terjual
        </option>

      </select>

    </div>


    {/* LOKASI */}

    <div>

      <label
        style={{
          display: "block",
          fontSize: "11px",
          fontWeight: "700",
          color: "#657575",
          marginBottom: "6px",
          textTransform:
            "uppercase",
        }}
      >
        Lokasi
      </label>

      <select
        value={lokasiFilter}
        onChange={(e) =>
          setLokasiFilter(
            e.target.value
          )
        }
        style={{
          width: "100%",
          padding: "11px",
          border:
            "1px solid #d3ddda",
          borderRadius: "7px",
          background: "#fff",
          fontSize: "13px",
          boxSizing: "border-box",
        }}
      >

        <option value="Semua">
          Semua Lokasi
        </option>

        {lokasiOptions.map(
          (lokasi) => (

            <option
              key={lokasi}
              value={lokasi}
            >
              {lokasi}
            </option>

          )
        )}

      </select>

    </div>


    {/* URUTKAN HARGA */}

    <div>
      <label style={{display:"block",fontSize:"11px",fontWeight:"700",color:"#657575",marginBottom:"6px",textTransform:"uppercase"}}>
        Urutkan Harga
      </label>
      <select value={sortHarga} onChange={(e)=>{setSortHarga(e.target.value);setCurrentPage(1);}} style={{width:"100%",padding:"11px",border:"1px solid #d3ddda",borderRadius:"7px",background:"#fff",fontSize:"13px",boxSizing:"border-box"}}>
        <option value="terendah">Harga Terendah → Tertinggi</option>
        <option value="tertinggi">Harga Tertinggi → Terendah</option>
      </select>
    </div>

    {/* HARGA MIN */}

    <div>

      <label
        style={{
          display: "block",
          fontSize: "11px",
          fontWeight: "700",
          color: "#657575",
          marginBottom: "6px",
          textTransform:
            "uppercase",
        }}
      >
        Harga Minimum
      </label>

      <input
        type="text"
        inputMode="numeric"
        value={
          formatFilterHarga(
            hargaMin
          )
        }
        onChange={(e) =>
          setHargaMin(
            e.target.value
              .replace(
                /\D/g,
                ""
              )
          )
        }
        placeholder="Rp 0"
        style={{
          width: "100%",
          padding: "11px",
          border:
            "1px solid #d3ddda",
          borderRadius: "7px",
          background: "#fff",
          fontSize: "13px",
          boxSizing: "border-box",
        }}
      />

    </div>


    {/* HARGA MAX */}

    <div>

      <label
        style={{
          display: "block",
          fontSize: "11px",
          fontWeight: "700",
          color: "#657575",
          marginBottom: "6px",
          textTransform:
            "uppercase",
        }}
      >
        Harga Maksimum
      </label>

      <input
        type="text"
        inputMode="numeric"
        value={
          formatFilterHarga(
            hargaMax
          )
        }
        onChange={(e) =>
          setHargaMax(
            e.target.value
              .replace(
                /\D/g,
                ""
              )
          )
        }
        placeholder="Rp 0"
        style={{
          width: "100%",
          padding: "11px",
          border:
            "1px solid #d3ddda",
          borderRadius: "7px",
          background: "#fff",
          fontSize: "13px",
          boxSizing: "border-box",
        }}
      />

    </div>

  </div>


  {/* BOTTOM */}

  <div
    style={{
      marginTop: "16px",
      paddingTop: "14px",
      borderTop:
        "1px solid #edf1f0",
      display: "flex",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: "10px",
      flexWrap: "wrap",
    }}
  >

    <div
      style={{
        fontSize: "13px",
        color: "#657575",
      }}
    >
      Menampilkan{" "}

      <strong
        style={{
          color: "#173b38",
        }}
      >
        {filteredData.length}
      </strong>

      {" "}aset
    </div>


    {filterAktif && (

      <button
        type="button"
        onClick={
          resetPublicFilter
        }
        style={{
          border:
            "1px solid #00695c",
          background:
            "#ffffff",
          color:
            "#00695c",
          padding:
            "8px 14px",
          borderRadius:
            "7px",
          cursor:
            "pointer",
          fontSize:
            "12px",
          fontWeight:
            "600",
        }}
      >
        ↻ Reset Filter
      </button>

    )}

  </div>

</div>

        {/* CARDS */}

        <div className="property-grid">

          {paginatedData.map(
              (item) => (

              <article
                className="property-card"
                key={item.id}
              >

                <div className="property-photo">

                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.nama}
                      className="property-image"
                      loading="lazy"
                    />
                  ) : (
                    <div className="photo-placeholder">

                      <span>
                        🏠
                      </span>

                      <small>
                        FOTO ASET
                      </small>

                    </div>
                  )}

                  <span className="available-badge">
                    {item.status ||
                      "TERSEDIA"}
                  </span>

                </div>

                <div className="property-content">

                  <div className="property-code">
                    {item.kode}
                  </div>

                  <h3>
                    {item.nama}
                  </h3>

                  <div className="property-location">
                    📍 {item.lokasi}
                  </div>

                  <div className="property-price">
                    {formatRupiah(
                      item.harga
                    )}
                  </div>

                  <div className="property-details">

                    <div>

                      <span>
                        Luas Tanah
                      </span>

                      <strong>
                        {item.luasTanah ||
                          0}{" "}
                        m²
                      </strong>

                    </div>

                    {item.luasBangunan >
                      0 && (
                      <div>

                        <span>
                          Luas Bangunan
                        </span>

                        <strong>
                          {
                            item.luasBangunan
                          }{" "}
                          m²
                        </strong>

                      </div>
                    )}

                  </div>

                  <button
                    className="detail-button"
                    onClick={() =>
                      setSelectedAgunan(
                        item
                      )
                    }
                  >
                    Lihat Detail
                  </button>

                </div>

              </article>

            )
          )}

        </div>

        {/* ================= PAGINATION ================= */}

{totalPages > 1 && (

  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "6px",
      marginTop: "30px",
      flexWrap: "wrap",
    }}
  >

    <button
      type="button"
      disabled={currentPage === 1}
      onClick={() =>
        setCurrentPage(
          (page) =>
            Math.max(
              1,
              page - 1
            )
        )
      }
      style={{
        padding: "9px 14px",
        border:
          "1px solid #d3ddda",
        borderRadius: "7px",
        background:
          currentPage === 1
            ? "#f3f5f4"
            : "#ffffff",
        color:
          currentPage === 1
            ? "#a0aaa8"
            : "#00695c",
        cursor:
          currentPage === 1
            ? "not-allowed"
            : "pointer",
        fontSize: "13px",
      }}
    >
      ← Sebelumnya
    </button>


    {Array.from(
      {
        length: totalPages,
      },
      (_, index) => {

        const page =
          index + 1;

        return (

          <button
            key={page}
            type="button"
            onClick={() =>
              setCurrentPage(
                page
              )
            }
            style={{
              minWidth: "38px",
              height: "38px",
              border:
                "1px solid #d3ddda",
              borderRadius: "7px",
              background:
                currentPage === page
                  ? "#00695c"
                  : "#ffffff",
              color:
                currentPage === page
                  ? "#ffffff"
                  : "#42514f",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight:
                currentPage === page
                  ? "700"
                  : "500",
            }}
          >
            {page}
          </button>

        );
      }
    )}


    <button
      type="button"
      disabled={
        currentPage ===
        totalPages
      }
      onClick={() =>
        setCurrentPage(
          (page) =>
            Math.min(
              totalPages,
              page + 1
            )
        )
      }
      style={{
        padding: "9px 14px",
        border:
          "1px solid #d3ddda",
        borderRadius: "7px",
        background:
          currentPage ===
          totalPages
            ? "#f3f5f4"
            : "#ffffff",
        color:
          currentPage ===
          totalPages
            ? "#a0aaa8"
            : "#00695c",
        cursor:
          currentPage ===
          totalPages
            ? "not-allowed"
            : "pointer",
        fontSize: "13px",
      }}
    >
      Berikutnya →
    </button>

  </div>

)}

        {/* EMPTY STATE */}

        {filteredData.length ===
          0 && (

          <div className="empty-state">

            <div>
              🔎
            </div>

            <h3>
              Agunan tidak ditemukan
            </h3>

            <p>
              Belum ada data agunan yang sesuai
              dengan pencarian atau kategori yang dipilih.
            </p>

          </div>

        )}

      </main>

      {/* ================= TENTANG ================= */}

      <section
        className="about"
        id="tentang"
      >

        <div className="container about-content">

          <div>

            <span className="section-label">
              TENTANG PLATFORM
            </span>

            <h2>
              Informasi Agunan
              <br />
              Dalam Satu Platform
            </h2>

          </div>

          <p>
            Website ini menyediakan informasi aset dan
            agunan yang tersedia untuk dijual. Masyarakat
            dapat melihat informasi aset, lokasi, harga,
            spesifikasi dan status aset dengan mudah.
          </p>

        </div>

      </section>

      {/* ================= FOOTER ================= */}

      <footer id="kontak">

        <div className="container footer-grid">

          <div>

            <div className="brand footer-brand">
              <img
                src={asetgoLogo}
                alt="AsetGo"
                className="footer-brand-image"
              />
            </div>

            <p>
              Portal informasi aset dan agunan
              bank yang tersedia untuk dijual.
            </p>

          </div>

          <div>

            <h4>
              Navigasi
            </h4>

            <a href="#beranda">
              Beranda
            </a>

            <a href="#agunan">
              Daftar Agunan
            </a>

            <a href="#tentang">
              Tentang
            </a>

          </div>

        </div>


        {/* ================= MODAL KONTAK WHATSAPP ================= */}

        {showWhatsappModal && (
          <div
            onClick={() => setShowWhatsappModal(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "rgba(7, 31, 28, 0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              backdropFilter: "blur(3px)",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "470px",
                background: "#ffffff",
                borderRadius: "16px",
                boxShadow: "0 20px 60px rgba(0,0,0,.22)",
                overflow: "hidden",
                animation: "fadeIn .18s ease-out",
              }}
            >
              <div
                style={{
                  padding: "22px 22px 16px",
                  borderBottom: "1px solid #edf1f0",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: "800",
                    letterSpacing: "1.2px",
                    color: "#087f70",
                    textTransform: "uppercase",
                    marginBottom: "5px",
                  }}
                >
                  HUBUNGI PENJUAL
                </div>

                <h3
                  style={{
                    margin: 0,
                    color: "#173b38",
                    fontSize: "23px",
                    lineHeight: 1.2,
                  }}
                >
                  Pilih Kontak WhatsApp
                </h3>

                <p
                  style={{
                    margin: "7px 0 0",
                    color: "#71817f",
                    fontSize: "13px",
                  }}
                >
                  Pilih salah satu kontak untuk menanyakan aset.
                </p>

                <button
                  type="button"
                  onClick={() => setShowWhatsappModal(false)}
                  aria-label="Tutup"
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    width: "34px",
                    height: "34px",
                    border: "none",
                    borderRadius: "50%",
                    background: "#eef3f1",
                    color: "#647370",
                    fontSize: "21px",
                    lineHeight: 1,
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>

              <div
                style={{
                  padding: "16px 14px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "9px",
                }}
              >
                {whatsappContacts.map((contact) => (
                  <button
                    key={contact.nama}
                    type="button"
                    onClick={() => {
                      const pesan = encodeURIComponent(
                        "Halo, saya ingin menanyakan informasi aset/agunan."
                      );

                      window.open(
                        `https://wa.me/${contact.nomor}?text=${pesan}`,
                        "_blank",
                        "noopener,noreferrer"
                      );

                      setShowWhatsappModal(false);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px",
                      border: "1px solid #dbe6e3",
                      borderRadius: "12px",
                      background: "#ffffff",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        width: "40px",
                        height: "40px",
                        flexShrink: 0,
                        borderRadius: "50%",
                        background: "#e6f4f1",
                        color: "#087f70",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="21"
                        height="21"
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

                    <span
                      style={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <strong
                        style={{
                          display: "block",
                          color: "#172523",
                          fontSize: "13px",
                          marginBottom: "3px",
                        }}
                      >
                        {contact.nama}
                      </strong>

                      <small
                        style={{
                          display: "block",
                          color: "#52615f",
                          fontSize: "12px",
                        }}
                      >
                        {contact.nomor}
                      </small>
                    </span>

                    <span
                      style={{
                        flexShrink: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: "68px",
                        height: "32px",
                        padding: "0 10px",
                        borderRadius: "7px",
                        background: "#087f70",
                        color: "#ffffff",
                        fontSize: "11px",
                        fontWeight: "700",
                      }}
                    >
                      WhatsApp
                    </span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setShowWhatsappModal(false)}
                  style={{
                    width: "100%",
                    height: "38px",
                    marginTop: "2px",
                    border: "1px solid #dbe6e3",
                    borderRadius: "8px",
                    background: "#f8faf9",
                    color: "#52615f",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

                <div className="copyright">

          © 2026 AsetGo.
          Seluruh hak cipta dilindungi.

        </div>

      </footer>

    </div>
  );
}

export default App;