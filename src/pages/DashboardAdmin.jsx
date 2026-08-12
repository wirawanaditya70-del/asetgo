import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../lib/supabase";

import FormAgunan from "./FormAgunan";
import EditAgunan from "./EditAgunan";


import asetgoLogo from "../assets/asetgo-logo.png";
function DashboardAdmin({
  user,
  onBack,
}) {

  // =====================================================
  // DATA
  // =====================================================

  const [data, setData] =
    useState([]);

  const [loading, setLoading] =
    useState(true);


  const [showForm, setShowForm] =
    useState(false);


  const [editAgunan, setEditAgunan] =
    useState(null);


  // =====================================================
  // FILTER
  // =====================================================

  const [search, setSearch] =
    useState("");

  const [filterJenis, setFilterJenis] =
    useState("Semua");

  const [filterStatus, setFilterStatus] =
    useState("Semua");

  const [filterLokasi, setFilterLokasi] =
    useState("Semua");

  const [hargaMin, setHargaMin] =
    useState("");

  const [hargaMax, setHargaMax] =
    useState("");

  const [sortHarga, setSortHarga] =
    useState("terendah");


  // =====================================================
  // PAGINATION
  // =====================================================

  const ITEMS_PER_PAGE = 10;

  const [currentPage, setCurrentPage] =
    useState(1);


  // =====================================================
  // LOAD DATA
  // =====================================================

  async function loadData() {

    setLoading(true);

    const {
      data: result,
      error,
    } = await supabase
      .from("agunan")
      .select("*")
      .order(
        "id",
        {
          ascending: true,
        }
      );


    if (error) {

      console.error(
        "Gagal mengambil data:",
        error
      );

      setData([]);

      setLoading(false);

      return;
    }


    setData(
      result || []
    );

    setLoading(false);
  }


  // =====================================================
  // LOAD AWAL
  // =====================================================

  useEffect(() => {

    loadData();

  }, []);


  // =====================================================
  // OPTIONS JENIS
  // =====================================================

  const jenisOptions =
    useMemo(() => {

      const values =
        data
          .map(
            (item) =>
              item.jenis_aset
          )
          .filter(Boolean)
          .map(
            (item) =>
              String(item).trim()
          )
          .filter(Boolean);


      return [
        ...new Set(values),
      ].sort(
        (a, b) =>
          a.localeCompare(
            b,
            "id"
          )
      );

    }, [data]);


  // =====================================================
  // OPTIONS LOKASI
  // =====================================================

  const lokasiOptions =
    useMemo(() => {

      const values =
        data
          .map(
            (item) =>
              item.lokasi
          )
          .filter(Boolean)
          .map(
            (item) =>
              String(item).trim()
          )
          .filter(Boolean);


      return [
        ...new Set(values),
      ].sort(
        (a, b) =>
          a.localeCompare(
            b,
            "id"
          )
      );

    }, [data]);


  // =====================================================
  // FILTER DATA
  // =====================================================

  const filteredData =
    useMemo(() => {

      const keyword =
        search
          .trim()
          .toLowerCase();


      const min =
        hargaMin
          ? Number(
              String(hargaMin)
                .replace(
                  /\D/g,
                  ""
                )
            )
          : null;


      const max =
        hargaMax
          ? Number(
              String(hargaMax)
                .replace(
                  /\D/g,
                  ""
                )
            )
          : null;


      const hasil = data.filter(
        (item) => {

          // ---------------------------------------------
          // SEARCH
          // ---------------------------------------------

          const kode =
            String(
              item.kode_aset || ""
            ).toLowerCase();


          const nama =
            String(
              item.nama_aset || ""
            ).toLowerCase();


          const lokasi =
            String(
              item.lokasi || ""
            ).toLowerCase();


          const searchMatch =
            !keyword ||
            kode.includes(
              keyword
            ) ||
            nama.includes(
              keyword
            ) ||
            lokasi.includes(
              keyword
            );


          // ---------------------------------------------
          // JENIS
          // ---------------------------------------------

          const jenisMatch =
            filterJenis ===
              "Semua" ||
            String(
              item.jenis_aset || ""
            ).toLowerCase() ===
              filterJenis.toLowerCase();


          // ---------------------------------------------
          // STATUS
          // ---------------------------------------------

          const statusMatch =
            filterStatus ===
              "Semua" ||
            String(
              item.status || ""
            ).toLowerCase() ===
              filterStatus.toLowerCase();


          // ---------------------------------------------
          // LOKASI
          // ---------------------------------------------

          const lokasiMatch =
            filterLokasi ===
              "Semua" ||
            String(
              item.lokasi || ""
            ).trim() ===
              filterLokasi;


          // ---------------------------------------------
          // HARGA
          // ---------------------------------------------

          const harga =
            Number(
              item.harga || 0
            );


          const minMatch =
            min === null ||
            harga >= min;


          const maxMatch =
            max === null ||
            harga <= max;


          return (
            searchMatch &&
            jenisMatch &&
            statusMatch &&
            lokasiMatch &&
            minMatch &&
            maxMatch
          );
        }
      );


      return [...hasil].sort((a, b) => {
        const hargaA = Number(a.harga || 0);
        const hargaB = Number(b.harga || 0);
        return sortHarga === "tertinggi" ? hargaB - hargaA : hargaA - hargaB;
      });

    }, [
      data,
      search,
      filterJenis,
      filterStatus,
      filterLokasi,
      hargaMin,
      hargaMax,
      sortHarga,
    ]);


  // =====================================================
  // RESET HALAMAN SAAT FILTER BERUBAH
  // =====================================================

  useEffect(() => {

    setCurrentPage(1);

  }, [
    search,
    filterJenis,
    filterStatus,
    filterLokasi,
    hargaMin,
    hargaMax,
    sortHarga,
  ]);


  // =====================================================
  // TOTAL PAGE
  // =====================================================

  const totalPages =
    Math.ceil(
      filteredData.length /
        ITEMS_PER_PAGE
    );


  // =====================================================
  // JAGA CURRENT PAGE
  // =====================================================

  useEffect(() => {

    if (
      totalPages === 0
    ) {

      if (
        currentPage !== 1
      ) {
        setCurrentPage(1);
      }

      return;
    }


    if (
      currentPage >
      totalPages
    ) {

      setCurrentPage(
        totalPages
      );

    }

  }, [
    totalPages,
    currentPage,
  ]);


  // =====================================================
  // DATA YANG DITAMPILKAN
  // =====================================================

  const paginatedData =
    filteredData.slice(
      (currentPage - 1) *
        ITEMS_PER_PAGE,

      currentPage *
        ITEMS_PER_PAGE
    );


  // =====================================================
  // RESET FILTER
  // =====================================================

  function resetFilter() {

    setSearch("");

    setFilterJenis(
      "Semua"
    );

    setFilterStatus(
      "Semua"
    );

    setFilterLokasi(
      "Semua"
    );

    setHargaMin("");

    setHargaMax("");

    setSortHarga("terendah");

    setCurrentPage(1);
  }


  // =====================================================
  // FILTER AKTIF
  // =====================================================

  const filterAktif =
    search.trim() !== "" ||
    filterJenis !== "Semua" ||
    filterStatus !== "Semua" ||
    filterLokasi !== "Semua" ||
    hargaMin !== "" ||
    hargaMax !== "" ||
    sortHarga !== "terendah";


  // =====================================================
  // STATISTIK
  // =====================================================

  const totalAset =
    data.length;


  const tersedia =
    data.filter(
      (item) =>
        String(
          item.status || ""
        ).toLowerCase() ===
        "tersedia"
    ).length;


  const terjual =
    data.filter(
      (item) =>
        String(
          item.status || ""
        ).toLowerCase() ===
        "terjual"
    ).length;


  const totalNilai =
    data.reduce(
      (total, item) =>
        total +
        Number(
          item.harga || 0
        ),
      0
    );


  // =====================================================
  // FORMAT RUPIAH
  // =====================================================

  function formatRupiah(
    value
  ) {

    return new Intl.NumberFormat(
      "id-ID",
      {
        style:
          "currency",

        currency:
          "IDR",

        maximumFractionDigits:
          0,
      }
    ).format(
      Number(
        value || 0
      )
    );
  }


  // =====================================================
  // FORMAT INPUT HARGA
  // =====================================================

  function formatInputHarga(
    value
  ) {

    if (!value) {
      return "";
    }


    const angka =
      String(value)
        .replace(
          /\D/g,
          ""
        );


    if (!angka) {
      return "";
    }


    return new Intl.NumberFormat(
      "id-ID"
    ).format(
      Number(angka)
    );
  }


  // =====================================================
  // DELETE AGUNAN
  // =====================================================

  async function handleDelete(
    item
  ) {

    const yakin =
      window.confirm(
        `Hapus agunan ${
          item.kode_aset
        } - ${
          item.nama_aset
        }?\n\nData agunan dan foto yang tersimpan akan dihapus permanen.`
      );


    if (!yakin) {
      return;
    }


    try {

      // ================================================
      // 1. AMBIL FOTO
      // ================================================

      let images = [];


      if (
        Array.isArray(
          item.foto_urls
        )
      ) {

        images =
          item.foto_urls;

      } else if (
        typeof item.foto_urls ===
        "string"
      ) {

        try {

          const parsed =
            JSON.parse(
              item.foto_urls
            );


          if (
            Array.isArray(
              parsed
            )
          ) {

            images =
              parsed;

          } else if (
            typeof parsed ===
              "string" &&
            parsed.trim()
          ) {

            images = [
              parsed,
            ];

          }

        } catch {

          if (
            item.foto_urls.trim()
          ) {

            images = [
              item.foto_urls,
            ];

          }

        }
      }


      // ================================================
      // 2. HAPUS FOTO STORAGE
      // ================================================

      if (
        images.length > 0
      ) {

        const paths =
          images
            .map(
              (url) => {

                try {

                  const marker =
                    "/storage/v1/object/public/agunan/";


                  const index =
                    url.indexOf(
                      marker
                    );


                  if (
                    index === -1
                  ) {

                    return null;

                  }


                  return decodeURIComponent(
                    url.substring(
                      index +
                        marker.length
                    )
                  );

                } catch {

                  return null;

                }

              }
            )
            .filter(Boolean);


        if (
          paths.length > 0
        ) {

          const {
            error:
              storageError,
          } =
            await supabase
              .storage
              .from(
                "agunan"
              )
              .remove(
                paths
              );


          if (
            storageError
          ) {

            console.error(
              "Gagal menghapus foto:",
              storageError
            );

          }

        }
      }


      // ================================================
      // 3. HAPUS DATA
      // ================================================

      const {
        error:
          deleteError,
      } =
        await supabase
          .from(
            "agunan"
          )
          .delete()
          .eq(
            "id",
            item.id
          );


      if (
        deleteError
      ) {

        throw deleteError;

      }


      // ================================================
      // 4. REFRESH DATA
      // ================================================

      await loadData();


      // ================================================
      // 5. RESET PAGE JIKA DIPERLUKAN
      // ================================================

      if (
        currentPage >
        totalPages
      ) {

        setCurrentPage(
          Math.max(
            1,
            totalPages - 1
          )
        );

      }


      alert(
        "Agunan berhasil dihapus."
      );


    } catch (
      error
    ) {

      console.error(
        "Gagal menghapus agunan:",
        error
      );


      alert(
        "Gagal menghapus agunan.\n\n" +
        error.message
      );
    }
  }


  // =====================================================
  // TAMBAH AGUNAN
  // =====================================================

  if (
    showForm
  ) {

    return (

      <FormAgunan

        onBack={() =>
          setShowForm(
            false
          )
        }

        onSaved={() => {

          setShowForm(
            false
          );

          loadData();

        }}

      />

    );
  }


  // =====================================================
  // EDIT AGUNAN
  // =====================================================

  if (
    editAgunan
  ) {

    return (

      <EditAgunan

        data={
          editAgunan
        }

        onBack={() =>
          setEditAgunan(
            null
          )
        }

        onSaved={() => {

          setEditAgunan(
            null
          );

          loadData();

        }}

      />

    );
  }


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div
      className="admin-dashboard"
    >


      {/* =================================================
          HEADER
      ================================================= */}

      <header
        className="admin-header"
      >

        <div
          className="admin-brand"
        >
          <img
            src={asetgoLogo}
            alt="AsetGo"
            className="admin-brand-image"
          />
        </div>


        <div
          className="admin-header-right"
        >

          <div
            className="admin-account"
          >

            <span>
              Administrator
            </span>

            <small>
              {user?.email}
            </small>

          </div>


          <button
            className="admin-back-button"
            onClick={
              onBack
            }
          >
            ← Website
          </button>

        </div>

      </header>


      {/* =================================================
          CONTENT
      ================================================= */}

      <main
        className="admin-content"
      >


        {/* =================================================
            TITLE
        ================================================= */}

        <div
          className="admin-title-row"
        >

          <div>

            <div
              className="admin-eyebrow"
            >
              ADMINISTRATOR
            </div>


            <h1>
              Dashboard
            </h1>


            <p>
              Kelola informasi aset
              dan agunan bank.
            </p>

          </div>


          <button
            className="add-asset-button"
            onClick={() =>
              setShowForm(
                true
              )
            }
          >
            + Tambah Agunan
          </button>

        </div>


        {/* =================================================
            STATISTICS
        ================================================= */}

        <section
          className="admin-stat-grid"
        >

          <div
            className="admin-stat-card"
          >

            <span>
              TOTAL ASET
            </span>

            <strong>
              {totalAset}
            </strong>

            <small>
              Seluruh data agunan
            </small>

          </div>


          <div
            className="admin-stat-card"
          >

            <span>
              TERSEDIA
            </span>

            <strong>
              {tersedia}
            </strong>

            <small>
              Aset masih tersedia
            </small>

          </div>


          <div
            className="admin-stat-card"
          >

            <span>
              TERJUAL
            </span>

            <strong>
              {terjual}
            </strong>

            <small>
              Aset sudah terjual
            </small>

          </div>


          <div
            className="admin-stat-card"
          >

            <span>
              TOTAL NILAI
            </span>

            <strong
              className="value"
            >
              {formatRupiah(
                totalNilai
              )}
            </strong>

            <small>
              Nilai seluruh aset
            </small>

          </div>

        </section>


        {/* =================================================
            SEARCH & FILTER
        ================================================= */}

        <section
          style={{
            marginTop:
              "24px",

            background:
              "#ffffff",

            border:
              "1px solid #e2e9e7",

            borderRadius:
              "12px",

            padding:
              "20px",

            boxShadow:
              "0 2px 8px rgba(0,0,0,.03)",
          }}
        >

          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "space-between",

              gap:
                "16px",

              marginBottom:
                "16px",

              flexWrap:
                "wrap",
            }}
          >

            <div>

              <div
                style={{
                  fontSize:
                    "15px",

                  fontWeight:
                    "700",

                  color:
                    "#173b38",
                }}
              >
                Cari & Filter
              </div>

              <div
                style={{
                  fontSize:
                    "12px",

                  color:
                    "#71817f",

                  marginTop:
                    "4px",
                }}
              >
                Temukan aset berdasarkan
                kode, nama, lokasi,
                jenis, status, atau harga.
              </div>

            </div>


            {filterAktif && (

              <button
                type="button"
                onClick={
                  resetFilter
                }
                style={{
                  border:
                    "1px solid #d3ddda",

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


          {/* SEARCH */}

          <div
            style={{
              position:
                "relative",

              marginBottom:
                "14px",
            }}
          >

            <span
              style={{
                position:
                  "absolute",

                left:
                  "14px",

                top:
                  "50%",

                transform:
                  "translateY(-50%)",

                fontSize:
                  "17px",

                color:
                  "#7b8a88",
              }}
            >
              🔍
            </span>


            <input
              type="text"
              value={
                search
              }
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Cari kode aset, nama aset, atau lokasi..."
              style={{
                width:
                  "100%",

                boxSizing:
                  "border-box",

                padding:
                  "12px 14px 12px 42px",

                border:
                  "1px solid #d3ddda",

                borderRadius:
                  "8px",

                outline:
                  "none",

                fontSize:
                  "13px",

                background:
                  "#ffffff",
              }}
            />

          </div>


          {/* FILTER GRID */}

          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "repeat(auto-fit, minmax(160px, 1fr))",

              gap:
                "12px",
            }}
          >

            {/* JENIS */}

            <div>

              <label
                style={{
                  display:
                    "block",

                  fontSize:
                    "11px",

                  fontWeight:
                    "700",

                  color:
                    "#657575",

                  marginBottom:
                    "6px",

                  textTransform:
                    "uppercase",
                }}
              >
                Jenis Aset
              </label>


              <select
                value={
                  filterJenis
                }
                onChange={(e) =>
                  setFilterJenis(
                    e.target.value
                  )
                }
                style={{
                  width:
                    "100%",

                  padding:
                    "11px",

                  border:
                    "1px solid #d3ddda",

                  borderRadius:
                    "7px",

                  background:
                    "#fff",

                  fontSize:
                    "13px",

                  boxSizing:
                    "border-box",
                }}
              >

                <option value="Semua">
                  Semua Jenis
                </option>

                {jenisOptions.map(
                  (jenis) => (

                    <option
                      key={
                        jenis
                      }
                      value={
                        jenis
                      }
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
                  display:
                    "block",

                  fontSize:
                    "11px",

                  fontWeight:
                    "700",

                  color:
                    "#657575",

                  marginBottom:
                    "6px",

                  textTransform:
                    "uppercase",
                }}
              >
                Status
              </label>


              <select
                value={
                  filterStatus
                }
                onChange={(e) =>
                  setFilterStatus(
                    e.target.value
                  )
                }
                style={{
                  width:
                    "100%",

                  padding:
                    "11px",

                  border:
                    "1px solid #d3ddda",

                  borderRadius:
                    "7px",

                  background:
                    "#fff",

                  fontSize:
                    "13px",

                  boxSizing:
                    "border-box",
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
                  display:
                    "block",

                  fontSize:
                    "11px",

                  fontWeight:
                    "700",

                  color:
                    "#657575",

                  marginBottom:
                    "6px",

                  textTransform:
                    "uppercase",
                }}
              >
                Lokasi
              </label>


              <select
                value={
                  filterLokasi
                }
                onChange={(e) =>
                  setFilterLokasi(
                    e.target.value
                  )
                }
                style={{
                  width:
                    "100%",

                  padding:
                    "11px",

                  border:
                    "1px solid #d3ddda",

                  borderRadius:
                    "7px",

                  background:
                    "#fff",

                  fontSize:
                    "13px",

                  boxSizing:
                    "border-box",
                }}
              >

                <option value="Semua">
                  Semua Lokasi
                </option>

                {lokasiOptions.map(
                  (lokasi) => (

                    <option
                      key={
                        lokasi
                      }
                      value={
                        lokasi
                      }
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
                  display:
                    "block",

                  fontSize:
                    "11px",

                  fontWeight:
                    "700",

                  color:
                    "#657575",

                  marginBottom:
                    "6px",

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
                  formatInputHarga(
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
                  width:
                    "100%",

                  padding:
                    "11px",

                  border:
                    "1px solid #d3ddda",

                  borderRadius:
                    "7px",

                  background:
                    "#fff",

                  fontSize:
                    "13px",

                  boxSizing:
                    "border-box",
                }}
              />

            </div>


            {/* HARGA MAX */}

            <div>

              <label
                style={{
                  display:
                    "block",

                  fontSize:
                    "11px",

                  fontWeight:
                    "700",

                  color:
                    "#657575",

                  marginBottom:
                    "6px",

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
                  formatInputHarga(
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
                  width:
                    "100%",

                  padding:
                    "11px",

                  border:
                    "1px solid #d3ddda",

                  borderRadius:
                    "7px",

                  background:
                    "#fff",

                  fontSize:
                    "13px",

                  boxSizing:
                    "border-box",
                }}
              />

            </div>

          </div>


          {/* HASIL */}

          <div
            style={{
              marginTop:
                "16px",

              paddingTop:
                "14px",

              borderTop:
                "1px solid #edf1f0",

              display:
                "flex",

              justifyContent:
                "space-between",

              alignItems:
                "center",

              flexWrap:
                "wrap",

              gap:
                "8px",
            }}
          >

            <span
              style={{
                fontSize:
                  "12px",

                color:
                  "#657575",
              }}
            >
              Menampilkan{" "}

              <strong
                style={{
                  color:
                    "#173b38",
                }}
              >
                {
                  filteredData.length
                }
              </strong>

              {" "}dari{" "}

              <strong
                style={{
                  color:
                    "#173b38",
                }}
              >
                {data.length}
              </strong>

              {" "}aset
            </span>


            {filterAktif && (

              <span
                style={{
                  fontSize:
                    "11px",

                  color:
                    "#00695c",

                  background:
                    "#edf8f5",

                  padding:
                    "5px 9px",

                  borderRadius:
                    "20px",

                  fontWeight:
                    "600",
                }}
              >
                Filter aktif
              </span>

            )}

          </div>

        </section>


        {/* =================================================
            TABLE
        ================================================= */}

        <section
          className="admin-table-section"
          style={{
            marginTop:
              "20px",
          }}
        >

          <div
            className="admin-table-header"
          >

            <div>

              <h2>
                Data Agunan
              </h2>

              <p>

                {filterAktif
                  ? `${filteredData.length} hasil dari ${totalAset} aset`
                  : `${totalAset} aset terdaftar`}

              </p>

            </div>


            <button
              className="refresh-button"
              onClick={
                loadData
              }
              disabled={
                loading
              }
            >
              ↻ Refresh
            </button>

          </div>


          {/* =================================================
              LOADING
          ================================================= */}

          {loading ? (

            <div
              className="admin-loading"
            >
              Memuat data...
            </div>


          ) : data.length ===
            0 ? (

            <div
              className="admin-empty"
            >
              Belum ada data agunan.
            </div>


          ) : filteredData.length ===
            0 ? (

            <div
              className="admin-empty"
            >

              <div
                style={{
                  fontSize:
                    "30px",

                  marginBottom:
                    "8px",
                }}
              >
                🔍
              </div>


              <strong>
                Data tidak ditemukan
              </strong>


              <p
                style={{
                  marginTop:
                    "6px",

                  color:
                    "#71817f",

                  fontSize:
                    "13px",
                }}
              >
                Tidak ada agunan yang
                sesuai dengan pencarian
                atau filter.
              </p>


              <button
                type="button"
                onClick={
                  resetFilter
                }
                style={{
                  marginTop:
                    "10px",

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
                Reset Filter
              </button>

            </div>


          ) : (

            <>

              <div
                className="admin-table-wrapper"
              >

                <table
                  className="admin-table"
                >

                  <thead>

                    <tr>

                      <th>
                        KODE
                      </th>

                      <th>
                        NAMA ASET
                      </th>

                      <th>
                        JENIS
                      </th>

                      <th>
                        LOKASI
                      </th>

                      <th>
                        HARGA
                      </th>

                      <th>
                        STATUS
                      </th>

                      <th>
                        AKSI
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {paginatedData.map(
                      (item) => (

                        <tr
                          key={
                            item.id
                          }
                        >

                          <td>

                            <strong>
                              {
                                item.kode_aset
                              }
                            </strong>

                          </td>


                          <td>
                            {
                              item.nama_aset
                            }
                          </td>


                          <td>
                            {
                              item.jenis_aset
                            }
                          </td>


                          <td>
                            {
                              item.lokasi
                            }
                          </td>


                          <td>
                            {formatRupiah(
                              item.harga
                            )}
                          </td>


                          <td>

                            <span
                              className={
                                String(
                                  item.status ||
                                    ""
                                ).toLowerCase() ===
                                "tersedia"
                                  ? "status tersedia"
                                  : "status terjual"
                              }
                            >
                              {
                                item.status
                              }
                            </span>

                          </td>


                          <td>

                            <div
                              className="table-actions"
                            >

                              <button
                                type="button"
                                onClick={() =>
                                  setEditAgunan(
                                    item
                                  )
                                }
                              >
                                Edit
                              </button>


                              <button
                                type="button"
                                className="delete-action"
                                onClick={() =>
                                  handleDelete(
                                    item
                                  )
                                }
                              >
                                Hapus
                              </button>

                            </div>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>


              {/* =================================================
                  PAGINATION
              ================================================= */}

              {totalPages > 1 && (

                <div
                  style={{
                    display:
                      "flex",

                    justifyContent:
                      "center",

                    alignItems:
                      "center",

                    gap:
                      "6px",

                    padding:
                      "20px 10px",

                    flexWrap:
                      "wrap",
                  }}
                >

                  {/* SEBELUMNYA */}

                  <button
                    type="button"
                    disabled={
                      currentPage ===
                      1
                    }
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
                      padding:
                        "9px 14px",

                      border:
                        "1px solid #d3ddda",

                      borderRadius:
                        "7px",

                      background:
                        currentPage ===
                        1
                          ? "#f3f5f4"
                          : "#ffffff",

                      color:
                        currentPage ===
                        1
                          ? "#a0aaa8"
                          : "#00695c",

                      cursor:
                        currentPage ===
                        1
                          ? "not-allowed"
                          : "pointer",

                      fontSize:
                        "12px",

                      fontWeight:
                        "600",
                    }}
                  >
                    ← Sebelumnya
                  </button>


                  {/* NOMOR HALAMAN */}

                  {Array.from(
                    {
                      length:
                        totalPages,
                    },
                    (
                      _,
                      index
                    ) => {

                      const page =
                        index + 1;


                      return (

                        <button
                          key={
                            page
                          }
                          type="button"
                          onClick={() =>
                            setCurrentPage(
                              page
                            )
                          }
                          style={{
                            minWidth:
                              "38px",

                            height:
                              "38px",

                            border:
                              "1px solid #d3ddda",

                            borderRadius:
                              "7px",

                            background:
                              currentPage ===
                              page
                                ? "#00695c"
                                : "#ffffff",

                            color:
                              currentPage ===
                              page
                                ? "#ffffff"
                                : "#42514f",

                            cursor:
                              "pointer",

                            fontSize:
                              "13px",

                            fontWeight:
                              currentPage ===
                              page
                                ? "700"
                                : "500",
                          }}
                        >
                          {page}
                        </button>

                      );

                    }
                  )}


                  {/* BERIKUTNYA */}

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
                      padding:
                        "9px 14px",

                      border:
                        "1px solid #d3ddda",

                      borderRadius:
                        "7px",

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

                      fontSize:
                        "12px",

                      fontWeight:
                        "600",
                    }}
                  >
                    Berikutnya →
                  </button>

                </div>

              )}


              {/* INFO HALAMAN */}

              {filteredData.length >
                0 && (

                <div
                  style={{
                    textAlign:
                      "center",

                    paddingBottom:
                      "18px",

                    color:
                      "#71817f",

                    fontSize:
                      "11px",
                  }}
                >

                  Menampilkan{" "}

                  <strong>
                    {
                      (currentPage -
                        1) *
                        ITEMS_PER_PAGE +
                      1
                    }
                  </strong>

                  {" - "}

                  <strong>
                    {
                      Math.min(
                        currentPage *
                          ITEMS_PER_PAGE,
                        filteredData.length
                      )
                    }
                  </strong>

                  {" dari "}

                  <strong>
                    {
                      filteredData.length
                    }
                  </strong>

                  {" aset"}

                </div>

              )}

            </>

          )}

        </section>

      </main>

    </div>
  );
}


export default DashboardAdmin;