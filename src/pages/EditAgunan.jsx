import { useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import asetgoLogo from "../assets/asetgo-logo.png";

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID").format(value || 0);
}

/*
========================================================
NORMALISASI FOTO
- Mendukung data.images
- Mendukung data.foto_urls
- Mendukung image, image2, image3, image4
========================================================
*/
function getInitialImages(data) {
  if (Array.isArray(data?.images)) {
    return data.images.filter(
      (url) => typeof url === "string" && url.trim()
    );
  }

  if (Array.isArray(data?.foto_urls)) {
    return data.foto_urls.filter(
      (url) => typeof url === "string" && url.trim()
    );
  }

  return [
    data?.image,
    data?.image2,
    data?.image3,
    data?.image4,
  ].filter(
    (url) => typeof url === "string" && url.trim()
  );
}

/*
========================================================
AMBIL PATH STORAGE DARI PUBLIC URL
Bucket: agunan
========================================================
*/
function getStoragePath(url) {
  if (!url || typeof url !== "string") {
    return null;
  }

  try {
    const parsed = new URL(url);
    const marker = "/storage/v1/object/public/agunan/";
    const index = parsed.pathname.indexOf(marker);

    if (index === -1) {
      return null;
    }

    return decodeURIComponent(
      parsed.pathname.substring(index + marker.length)
    );
  } catch {
    return null;
  }
}

/*
========================================================
EXTENSION FILE
========================================================
*/
function getFileExtension(file) {
  const original = file?.name || "";
  const fromName = original.includes(".")
    ? original.split(".").pop().toLowerCase()
    : "";

  if (fromName) {
    return fromName.replace(/[^a-z0-9]/g, "") || "jpg";
  }

  if (file?.type === "image/png") return "png";
  if (file?.type === "image/webp") return "webp";
  if (file?.type === "image/jpeg") return "jpg";

  return "jpg";
}

/*
========================================================
EDIT AGUNAN
========================================================
*/
function EditAgunan({ data, onBack, onSaved }) {
  const initialImages = useMemo(
    () => getInitialImages(data),
    [data]
  );

  const [form, setForm] = useState({
    kode_aset: data.kode_aset || data.kode || "",
    nama_aset: data.nama_aset || data.nama || "",
    jenis_aset: data.jenis_aset || data.jenis || "Rumah",
    harga: String(data.harga || ""),
    lokasi: data.lokasi || "",
    luas_tanah: String(
      data.luas_tanah ?? data.luasTanah ?? ""
    ),
    luas_bangunan: String(
      data.luas_bangunan ?? data.luasBangunan ?? ""
    ),
    sertifikat: data.sertifikat || "",
    status: data.status || "Tersedia",
    deskripsi: data.deskripsi || "",
  });

  /*
  ======================================================
  FOTO
  ======================================================
  */
  const [images, setImages] = useState(initialImages);

  // Foto yang dipilih tetapi belum diupload ke Storage.
  const [newPhotos, setNewPhotos] = useState([]);

  // Preview URL untuk foto baru.
  const [newPhotoPreviews, setNewPhotoPreviews] = useState([]);

  // Jika true, foto baru pertama akan dijadikan foto utama.
  const [newPhotoIsMain, setNewPhotoIsMain] = useState(false);

  // Foto lama yang akan benar-benar dihapus dari Storage
  // setelah database berhasil disimpan.
  const [removedImages, setRemovedImages] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
  ======================================================
  FORM
  ======================================================
  */
  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleHargaChange(e) {
    const angka = e.target.value.replace(/\D/g, "");

    setForm((prev) => ({
      ...prev,
      harga: angka,
    }));
  }

  /*
  ======================================================
  TAMBAH FOTO
  ======================================================
  */
  function handlePhotoSelect(e) {
    const selectedFiles = Array.from(e.target.files || []);

    if (!selectedFiles.length) {
      return;
    }

    setError("");
    setSuccess("");

    const validFiles = selectedFiles.filter((file) => {
      if (!file.type.startsWith("image/")) {
        return false;
      }

      if (file.size > 10 * 1024 * 1024) {
        return false;
      }

      return true;
    });

    if (validFiles.length !== selectedFiles.length) {
      setError(
        "Sebagian foto tidak ditambahkan. Pastikan file berupa gambar dan ukuran maksimal 10 MB per foto."
      );
    }

    if (!validFiles.length) {
      e.target.value = "";
      return;
    }

    const previews = validFiles.map((file) =>
      URL.createObjectURL(file)
    );

    setNewPhotos((prev) => [
      ...prev,
      ...validFiles,
    ]);

    setNewPhotoPreviews((prev) => [
      ...prev,
      ...previews,
    ]);

    // Foto baru pertama tidak otomatis menjadi utama.
    // Foto utama tetap foto yang sudah ada sampai user memilihnya.

    // Supaya file yang sama bisa dipilih lagi.
    e.target.value = "";
  }

  /*
  ======================================================
  HAPUS FOTO BARU
  Belum ada di Storage, jadi cukup hapus dari state.
  ======================================================
  */
  function handleRemoveNewPhoto(index) {
    const preview = newPhotoPreviews[index];

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setNewPhotos((prev) =>
      prev.filter((_, i) => i !== index)
    );

    setNewPhotoPreviews((prev) =>
      prev.filter((_, i) => i !== index)
    );

    if (index === 0) {
      setNewPhotoIsMain(false);
    }
  }

  /*
  ======================================================
  JADIKAN FOTO BARU SEBAGAI FOTO UTAMA
  Foto baru akan diupload lebih dulu dan ditempatkan
  sebelum foto lama pada foto_urls.
  ======================================================
  */
  function handleSetNewMainPhoto(index) {
    if (loading || !newPhotos[index]) {
      return;
    }

    const selectedFile = newPhotos[index];
    const selectedPreview = newPhotoPreviews[index];

    setNewPhotos((prev) => [
      selectedFile,
      ...prev.filter((_, i) => i !== index),
    ]);

    setNewPhotoPreviews((prev) => [
      selectedPreview,
      ...prev.filter((_, i) => i !== index),
    ]);

    setNewPhotoIsMain(true);
    setSuccess(
      "Foto baru dipilih sebagai foto utama. Klik Simpan Perubahan untuk menyimpan."
    );
    setError("");
  }

  /*
  ======================================================
  HAPUS FOTO LAMA
  Tidak langsung menghapus Storage.
  Foto ditandai untuk dihapus dan baru dihapus
  setelah Simpan Perubahan berhasil.
  ======================================================
  */
  function handleDeletePhoto(image) {
    if (loading) return;

    const yakin = window.confirm(
      "Hapus foto ini dari aset?\n\nFoto akan dihapus setelah Anda menekan Simpan Perubahan."
    );

    if (!yakin) {
      return;
    }

    setImages((prev) =>
      prev.filter((item) => item !== image)
    );

    setRemovedImages((prev) => {
      if (prev.includes(image)) {
        return prev;
      }

      return [...prev, image];
    });

    setError("");
    setSuccess("Foto ditandai untuk dihapus.");
  }

  /*
  ======================================================
  JADIKAN FOTO UTAMA
  Foto utama = index 0.
  ======================================================
  */
  function handleSetMainPhoto(index) {
    if (loading || index === 0) {
      return;
    }

    setImages((prev) => {
      if (!prev[index]) {
        return prev;
      }

      const selected = prev[index];

      return [
        selected,
        ...prev.filter((_, i) => i !== index),
      ];
    });

    setSuccess("Foto utama diubah. Klik Simpan Perubahan untuk menyimpan.");
    setError("");
  }

  /*
  ======================================================
  UPLOAD FOTO BARU
  ======================================================
  */
  async function uploadNewPhotos() {
    if (!newPhotos.length) {
      return [];
    }

    const uploadedUrls = [];

    for (let index = 0; index < newPhotos.length; index++) {
      const file = newPhotos[index];
      const extension = getFileExtension(file);

      const safeCode =
        String(form.kode_aset || data.id || "aset")
          .replace(/[^a-zA-Z0-9_-]/g, "_");

      const fileName =
        `${safeCode}/${Date.now()}-${index}-${Math.random()
          .toString(36)
          .slice(2, 10)}.${extension}`;

      const { error: uploadError } =
        await supabase.storage
          .from("agunan")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || "image/jpeg",
          });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: publicData,
      } = supabase.storage
        .from("agunan")
        .getPublicUrl(fileName);

      const publicUrl =
        publicData?.publicUrl || "";

      if (!publicUrl) {
        throw new Error(
          "URL foto berhasil diupload tetapi URL publik tidak ditemukan."
        );
      }

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  }

  /*
  ======================================================
  HAPUS FILE STORAGE
  ======================================================
  */
  async function removeStorageImages(urls) {
    const paths = urls
      .map(getStoragePath)
      .filter(Boolean);

    if (!paths.length) {
      return;
    }

    const { error: storageError } =
      await supabase.storage
        .from("agunan")
        .remove(paths);

    if (storageError) {
      throw storageError;
    }
  }

  /*
  ======================================================
  SIMPAN PERUBAHAN
  ======================================================
  */
  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.nama_aset.trim()) {
      setError("Nama aset wajib diisi.");
      return;
    }

    if (!form.harga) {
      setError("Harga wajib diisi.");
      return;
    }

    if (Number(form.harga) <= 0) {
      setError("Harga aset harus lebih dari 0.");
      return;
    }

    if (!form.lokasi.trim()) {
      setError("Lokasi wajib diisi.");
      return;
    }

    if (!data?.id) {
      setError("ID aset tidak ditemukan.");
      return;
    }

    setLoading(true);

    let uploadedUrls = [];

    try {
      /*
      ==================================================
      1. UPLOAD FOTO BARU
      ==================================================
      */
      if (newPhotos.length > 0) {
        setSuccess(
          `Mengupload ${newPhotos.length} foto baru...`
        );

        uploadedUrls =
          await uploadNewPhotos();
      }

      /*
      ==================================================
      2. GABUNG FOTO LAMA YANG MASIH ADA + FOTO BARU
      ==================================================

      FOTO UTAMA selalu images[0].
      Foto baru ditambahkan di bagian belakang.
      */
      const finalImages = newPhotoIsMain
        ? [
            ...uploadedUrls,
            ...images,
          ].filter(Boolean)
        : [
            ...images,
            ...uploadedUrls,
          ].filter(Boolean);

      /*
      ==================================================
      3. UPDATE DATABASE
      ==================================================
      */
      setSuccess("Menyimpan perubahan...");

      const { error: updateError } =
        await supabase
          .from("agunan")
          .update({
            nama_aset: form.nama_aset.trim(),
            jenis_aset: form.jenis_aset,
            harga: Number(form.harga),
            lokasi: form.lokasi.trim(),

            luas_tanah: form.luas_tanah
              ? Number(form.luas_tanah)
              : null,

            luas_bangunan: form.luas_bangunan
              ? Number(form.luas_bangunan)
              : null,

            sertifikat:
              form.sertifikat.trim() || null,

            status: form.status,

            deskripsi:
              form.deskripsi.trim() || null,

            foto_urls: finalImages,
          })
          .eq("id", data.id);

      /*
      ==================================================
      DATABASE GAGAL
      Hapus foto baru yang sudah terupload agar tidak
      meninggalkan file yatim di Storage.
      ==================================================
      */
      if (updateError) {
        if (uploadedUrls.length) {
          try {
            await removeStorageImages(uploadedUrls);
          } catch (cleanupError) {
            console.error(
              "Gagal cleanup foto baru:",
              cleanupError
            );
          }
        }

        throw updateError;
      }

      /*
      ==================================================
      4. DATABASE SUKSES
      Baru hapus foto lama yang ditandai untuk dihapus.
      ==================================================
      */
      if (removedImages.length) {
        try {
          await removeStorageImages(
            removedImages
          );
        } catch (storageDeleteError) {
          /*
          Database sudah benar.
          Kalau Storage gagal dihapus, jangan batalkan
          perubahan database.
          */
          console.error(
            "Foto berhasil dilepas dari aset tetapi gagal dihapus dari Storage:",
            storageDeleteError
          );
        }
      }

      /*
      ==================================================
      5. BERSIHKAN OBJECT URL
      ==================================================
      */
      newPhotoPreviews.forEach((preview) => {
        URL.revokeObjectURL(preview);
      });

      setSuccess("Perubahan berhasil disimpan.");

      if (onSaved) {
        setTimeout(() => {
          onSaved();
        }, 500);
      }
    } catch (err) {
      console.error(
        "Gagal menyimpan perubahan:",
        err
      );

      setError(
        err?.message ||
          "Gagal menyimpan perubahan."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
  ======================================================
  RENDER
  ======================================================
  */
  return (
    <div className="form-agunan-page">
      {/* HEADER */}
      <header className="form-agunan-header">
        <div className="admin-brand">
          <img
            src={asetgoLogo}
            alt="AsetGo"
            className="admin-brand-image"
          />
        </div>

        <button
          className="admin-back-button"
          onClick={onBack}
          type="button"
          disabled={loading}
        >
          ← Kembali
        </button>
      </header>

      {/* CONTENT */}
      <main className="form-agunan-content">
        <div className="form-agunan-title">
          <div className="admin-eyebrow">
            DATA ASET
          </div>

          <h1>Edit Agunan</h1>

          <p>
            Perbarui informasi aset dan kelola foto
            agunan.
          </p>
        </div>

        <form
          className="agunan-form"
          onSubmit={handleSubmit}
        >
          {/* INFORMASI UTAMA */}
          <section className="form-section">
            <div className="form-section-title">
              Informasi Utama
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label>Kode Aset</label>

                <input
                  value={form.kode_aset}
                  disabled
                />
              </div>

              <div className="form-field">
                <label>
                  Nama Aset <span>*</span>
                </label>

                <input
                  name="nama_aset"
                  value={form.nama_aset}
                  onChange={handleChange}
                  placeholder="Nama aset"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-field">
                <label>Jenis Aset</label>

                <select
                  name="jenis_aset"
                  value={form.jenis_aset}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="Rumah">Rumah</option>
                  <option value="Tanah">Tanah</option>
                  <option value="Ruko">Ruko</option>
                  <option value="Apartemen">
                    Apartemen
                  </option>
                  <option value="Kendaraan">
                    Kendaraan
                  </option>
                  <option value="Lainnya">
                    Lainnya
                  </option>
                </select>
              </div>

              <div className="form-field">
                <label>Status</label>

                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="Tersedia">
                    Tersedia
                  </option>
                  <option value="Terjual">
                    Terjual
                  </option>
                </select>
              </div>
            </div>
          </section>

          {/* NILAI & LOKASI */}
          <section className="form-section">
            <div className="form-section-title">
              Nilai & Lokasi
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label>
                  Harga <span>*</span>
                </label>

                <div className="input-prefix">
                  <span>Rp</span>

                  <input
                    name="harga"
                    value={formatRupiah(form.harga)}
                    onChange={handleHargaChange}
                    inputMode="numeric"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-field">
                <label>
                  Lokasi <span>*</span>
                </label>

                <input
                  name="lokasi"
                  value={form.lokasi}
                  onChange={handleChange}
                  placeholder="Contoh: Denpasar, Bali"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-field">
                <label>Luas Tanah</label>

                <div className="input-suffix">
                  <input
                    type="number"
                    name="luas_tanah"
                    value={form.luas_tanah}
                    onChange={handleChange}
                    min="0"
                    disabled={loading}
                  />

                  <span>m²</span>
                </div>
              </div>

              <div className="form-field">
                <label>Luas Bangunan</label>

                <div className="input-suffix">
                  <input
                    type="number"
                    name="luas_bangunan"
                    value={form.luas_bangunan}
                    onChange={handleChange}
                    min="0"
                    disabled={loading}
                  />

                  <span>m²</span>
                </div>
              </div>

              <div className="form-field form-field-full">
                <label>Sertifikat</label>

                <input
                  name="sertifikat"
                  value={form.sertifikat}
                  onChange={handleChange}
                  placeholder="Contoh: SHM No. 12345"
                  disabled={loading}
                />
              </div>
            </div>
          </section>

          {/* FOTO ASET */}
          <section className="form-section">
            <div className="form-section-title">
              Foto Aset
            </div>

            <div className="photo-upload-info">
              Kelola foto aset di sini. Foto pertama
              adalah <strong>FOTO UTAMA</strong>.
              Anda dapat menambah, menghapus, atau
              mengganti foto utama.
            </div>

            {/* FOTO LAMA */}
            {images.length > 0 ? (
              <div className="photo-preview-grid">
                {images.map((image, index) => (
                  <div
                    className={
                      index === 0
                        ? "photo-preview-item main-photo"
                        : "photo-preview-item"
                    }
                    key={`${image}-${index}`}
                  >
                    <img
                      src={image}
                      alt={`Foto ${index + 1}`}
                      onError={(e) => {
                        e.currentTarget.style.opacity =
                          "0.35";
                      }}
                    />

                    {index === 0 && (
                      <div
                        className="main-photo-label"
                        style={{
                          position: "absolute",
                          top: 8,
                          left: 8,
                          right: "auto",
                          background: "#075e54",
                          color: "#fff",
                          padding: "6px 9px",
                          borderRadius: 5,
                          fontSize: 9,
                          fontWeight: 800,
                          letterSpacing: ".5px",
                          zIndex: 2,
                        }}
                      >
                        ★ FOTO UTAMA
                      </div>
                    )}

                    <div
                      style={{
                        position: "absolute",
                        left: 8,
                        right: 8,
                        bottom: 8,
                        display: "flex",
                        gap: 6,
                        zIndex: 3,
                      }}
                    >
                      {index !== 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            handleSetMainPhoto(index)
                          }
                          disabled={loading}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            border: "none",
                            borderRadius: 5,
                            padding: "8px 6px",
                            background:
                              "rgba(255,255,255,.96)",
                            color: "#075e54",
                            fontSize: 9,
                            fontWeight: 800,
                            cursor: loading
                              ? "not-allowed"
                              : "pointer",
                          }}
                        >
                          ★ Utama
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          handleDeletePhoto(image)
                        }
                        disabled={loading}
                        style={{
                          flex:
                            index === 0
                              ? 1
                              : "0 0 auto",
                          border: "none",
                          borderRadius: 5,
                          padding: "8px 8px",
                          background:
                            "rgba(180,35,24,.94)",
                          color: "#fff",
                          fontSize: 9,
                          fontWeight: 800,
                          cursor: loading
                            ? "not-allowed"
                            : "pointer",
                        }}
                        title="Hapus foto"
                      >
                        🗑
                        {index === 0
                          ? " Hapus"
                          : ""}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="admin-empty"
                style={{
                  border: "1px dashed #cfdad7",
                  borderRadius: 10,
                  padding: 35,
                  marginBottom: 18,
                  background: "#fafcfb",
                }}
              >
                Belum ada foto untuk aset ini.
              </div>
            )}

            {/* FOTO BARU */}
            {newPhotos.length > 0 && (
              <div
                style={{
                  marginTop: 10,
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <strong
                    style={{
                      color: "#18312d",
                      fontSize: 12,
                    }}
                  >
                    Foto Baru
                  </strong>

                  <span
                    style={{
                      color: "#7b8783",
                      fontSize: 10,
                    }}
                  >
                    {newPhotos.length} foto siap
                    diupload
                  </span>
                </div>

                <div className="photo-preview-grid">
                  {newPhotos.map((file, index) => (
                    <div
                      className="photo-preview-item"
                      key={`${file.name}-${file.size}-${index}`}
                    >
                      <img
                        src={newPhotoPreviews[index]}
                        alt={`Foto baru ${index + 1}`}
                      />

                      <div
                        style={{
                          position: "absolute",
                          top: 8,
                          left: 8,
                          background:
                            "rgba(255,255,255,.96)",
                          color: "#075e54",
                          padding: "5px 7px",
                          borderRadius: 5,
                          fontSize: 8,
                          fontWeight: 800,
                          zIndex: 2,
                        }}
                      >
                        FOTO BARU
                      </div>

                      <div
                        style={{
                          position: "absolute",
                          left: 8,
                          right: 8,
                          bottom: 8,
                          display: "flex",
                          gap: 6,
                          zIndex: 3,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            handleSetNewMainPhoto(index)
                          }
                          disabled={loading}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            border: "none",
                            borderRadius: 5,
                            padding: "8px 5px",
                            background:
                              newPhotoIsMain && index === 0
                                ? "#075e54"
                                : "rgba(255,255,255,.96)",
                            color:
                              newPhotoIsMain && index === 0
                                ? "#fff"
                                : "#075e54",
                            fontSize: 8,
                            fontWeight: 800,
                            cursor: loading
                              ? "not-allowed"
                              : "pointer",
                          }}
                        >
                          ★ {newPhotoIsMain && index === 0
                            ? "Utama"
                            : "Jadikan Utama"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveNewPhoto(index)
                          }
                          disabled={loading}
                          style={{
                            flex: "0 0 auto",
                            border: "none",
                            borderRadius: 5,
                            padding: "8px 8px",
                            background:
                              "rgba(180,35,24,.94)",
                            color: "#fff",
                            fontSize: 9,
                            fontWeight: 800,
                            cursor: loading
                              ? "not-allowed"
                              : "pointer",
                          }}
                          title="Hapus foto baru"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAMBAH FOTO */}
            <label
              className="photo-upload-button"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                minHeight: 48,
                border: "1px dashed #9db5b0",
                borderRadius: 8,
                background: "#f7faf9",
                color: "#075e54",
                fontSize: 12,
                fontWeight: 800,
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoSelect}
                disabled={loading}
                style={{ display: "none" }}
              />

              ＋ Tambah Foto
            </label>

            <div
              style={{
                marginTop: 9,
                color: "#7b8783",
                fontSize: 10,
                lineHeight: 1.6,
              }}
            >
              JPG, JPEG, PNG atau WEBP • maksimal
              10 MB per foto.
            </div>
          </section>

          {/* DESKRIPSI */}
          <section className="form-section">
            <div className="form-section-title">
              Deskripsi
            </div>

            <div className="form-field">
              <label>Deskripsi Aset</label>

              <textarea
                name="deskripsi"
                value={form.deskripsi}
                onChange={handleChange}
                placeholder="Informasi tambahan mengenai aset..."
                rows="5"
                disabled={loading}
              />
            </div>
          </section>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                margin: "0 28px 18px",
                padding: "11px 13px",
                border: "1px solid #b9ded7",
                borderRadius: 6,
                background: "#effaf7",
                color: "#075e54",
                fontSize: 11,
                lineHeight: 1.5,
              }}
            >
              {success}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="form-cancel"
              onClick={onBack}
              disabled={loading}
            >
              Batal
            </button>

            <button
              type="submit"
              className="form-save"
              disabled={loading}
            >
              {loading
                ? "Menyimpan..."
                : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default EditAgunan;