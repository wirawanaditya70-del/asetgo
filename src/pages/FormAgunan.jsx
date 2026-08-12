import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const COMPRESSED_MAX_SIZE = 1.5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

function FormAgunan({ onBack, onSaved }) {
  const [form, setForm] = useState({
    kode_aset: "",
    nama_aset: "",
    jenis_aset: "Rumah",
    harga: "",
    lokasi: "",
    luas_tanah: "",
    luas_bangunan: "",
    sertifikat: "",
    status: "Tersedia",
    deskripsi: "",
  });

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      photos.forEach((photo) => {
        URL.revokeObjectURL(photo.preview);
      });
    };
  }, [photos]);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function formatHarga(value) {
    if (!value) return "";

    const angka = String(value).replace(/\D/g, "");

    if (!angka) return "";

    return new Intl.NumberFormat("id-ID").format(angka);
  }

  function handleHargaChange(e) {
    const angka = e.target.value.replace(/\D/g, "");

    setForm((prev) => ({
      ...prev,
      harga: angka,
    }));
  }

  async function compressImage(file) {
    if (!file.type.startsWith("image/")) {
      throw new Error(`${file.name} bukan file gambar.`);
    }

    const objectUrl = URL.createObjectURL(file);

    try {
      const image = await new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => resolve(img);
        img.onerror = () =>
          reject(
            new Error(`Foto ${file.name} tidak dapat dibaca.`)
          );

        img.src = objectUrl;
      });

      let width = image.naturalWidth;
      let height = image.naturalHeight;

      if (!width || !height) {
        throw new Error(`Ukuran foto ${file.name} tidak valid.`);
      }

      // Batasi dimensi maksimal agar file jauh lebih ringan.
      if (Math.max(width, height) > MAX_IMAGE_DIMENSION) {
        const scale =
          MAX_IMAGE_DIMENSION /
          Math.max(width, height);

        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", {
        alpha: false,
      });

      if (!ctx) {
        throw new Error("Browser tidak mendukung proses kompres foto.");
      }

      canvas.width = width;
      canvas.height = height;

      // Latar putih supaya PNG transparan tidak menjadi hitam
      // ketika dikonversi ke JPG.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      ctx.drawImage(
        image,
        0,
        0,
        width,
        height
      );

      // =====================================================
      // WATERMARK ASETGO
      // Tulisan AsetGo diulang diagonal di seluruh foto.
      // Opacity dibuat ringan agar foto tetap jelas.
      // =====================================================
      ctx.save();

      const watermarkSize = Math.max(28, Math.round(Math.min(width, height) * 0.065));
      const watermarkGapX = watermarkSize * 5.5;
      const watermarkGapY = watermarkSize * 3.2;

      ctx.translate(width / 2, height / 2);
      ctx.rotate((-28 * Math.PI) / 180);
      ctx.font = `700 ${watermarkSize}px Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      const diagonal = Math.ceil(Math.sqrt(width * width + height * height));

      for (let y = -diagonal; y <= diagonal; y += watermarkGapY) {
        for (let x = -diagonal; x <= diagonal; x += watermarkGapX) {
          ctx.fillText("AsetGo", x, y);
        }
      }

      ctx.restore();

      // Mulai dari kualitas tinggi, lalu turunkan sampai
      // ukuran file berada di bawah target.
      let quality = 0.86;
      let blob = await new Promise((resolve) =>
        canvas.toBlob(
          resolve,
          "image/jpeg",
          quality
        )
      );

      while (
        blob &&
        blob.size > COMPRESSED_MAX_SIZE &&
        quality > 0.45
      ) {
        quality -= 0.07;

        blob = await new Promise((resolve) =>
          canvas.toBlob(
            resolve,
            "image/jpeg",
            quality
          )
        );
      }

      // Jika masih terlalu besar, kecilkan dimensi secara bertahap.
      while (
        blob &&
        blob.size > COMPRESSED_MAX_SIZE &&
        Math.max(width, height) > 1000
      ) {
        width = Math.round(width * 0.85);
        height = Math.round(height * 0.85);

        canvas.width = width;
        canvas.height = height;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(
          image,
          0,
          0,
          width,
          height
        );

        quality = 0.78;

        blob = await new Promise((resolve) =>
          canvas.toBlob(
            resolve,
            "image/jpeg",
            quality
          )
        );
      }

      if (!blob) {
        throw new Error(
          `Gagal mengompres foto ${file.name}.`
        );
      }

      const compressedName =
        file.name.replace(
          /\.[^/.]+$/,
          ""
        ) + ".jpg";

      const compressedFile = new File(
        [blob],
        compressedName,
        {
          type: "image/jpeg",
          lastModified: Date.now(),
        }
      );

      return {
        file: compressedFile,
        originalSize: file.size,
        compressedSize: compressedFile.size,
        preview: URL.createObjectURL(
          compressedFile
        ),
      };
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  async function handlePhotoChange(e) {
    const files = Array.from(e.target.files || []);

    setError("");

    if (!files.length) {
      return;
    }

    if (photos.length + files.length > MAX_PHOTOS) {
      setError(
        `Maksimal ${MAX_PHOTOS} foto untuk satu aset.`
      );

      e.target.value = "";
      return;
    }

    const validPhotos = [];

    try {
      setLoading(true);

      for (const file of files) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          throw new Error(
            `${file.name} bukan format foto yang didukung. Gunakan JPG, PNG, atau WebP.`
          );
        }

        // Ukuran ini adalah ukuran FOTO ASLI.
        // Foto akan dikompres setelah lolos pemeriksaan.
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(
            `${file.name} terlalu besar. Maksimal foto asli adalah 15 MB.`
          );
        }

        const compressed =
          await compressImage(file);

        validPhotos.push(compressed);
      }

      setPhotos((prev) => [
        ...prev,
        ...validPhotos,
      ]);
    } catch (err) {
      validPhotos.forEach((photo) => {
        if (photo.preview) {
          URL.revokeObjectURL(photo.preview);
        }
      });

      setError(
        err?.message ||
          "Gagal memproses foto."
      );
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  function removePhoto(index) {
    setPhotos((prev) => {
      const selected = prev[index];

      if (selected?.preview) {
        URL.revokeObjectURL(selected.preview);
      }

      return prev.filter(
        (_, photoIndex) => photoIndex !== index
      );
    });
  }

  function movePhotoToFirst(index) {
    if (index === 0) return;

    setPhotos((prev) => {
      const newPhotos = [...prev];

      const selected = newPhotos.splice(index, 1)[0];

      newPhotos.unshift(selected);

      return newPhotos;
    });
  }

  function sanitizeFileName(fileName) {
    return fileName
      .toLowerCase()
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 50);
  }

  async function uploadPhotos(kodeAset) {
    const uploadedPaths = [];
    const photoUrls = [];

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];

      // Semua foto sudah dikompres menjadi JPG saat dipilih.
      const extension = "jpg";

      const safeName =
        sanitizeFileName(
          photo.file.name
        ) || `foto-${i + 1}`;

      const uniqueName =
        `${Date.now()}-${i}-${safeName}.${extension}`;

      const filePath =
        `${kodeAset}/${uniqueName}`;

      const { error: uploadError } =
        await supabase.storage
          .from("agunan")
          .upload(
            filePath,
            photo.file,
            {
              cacheControl: "3600",
              upsert: false,
              contentType: "image/jpeg",
            }
          );

      if (uploadError) {
        throw new Error(
          `Gagal upload foto ${i + 1}: ${uploadError.message}`
        );
      }

      uploadedPaths.push(filePath);

      const {
        data: publicUrlData,
      } = supabase.storage
        .from("agunan")
        .getPublicUrl(filePath);

      photoUrls.push(
        publicUrlData.publicUrl
      );
    }

    return {
      photoUrls,
      uploadedPaths,
    };
  }

  async function deleteUploadedPhotos(paths) {
    if (!paths.length) {
      return;
    }

    await supabase.storage
      .from("agunan")
      .remove(paths);
  }

  // =====================================================
  // GENERATE KODE ASET OTOMATIS
  // =====================================================
  // Mencari nomor AG terkecil yang belum dipakai.
  // Contoh:
  // AG-0001, AG-0003 -> kode berikutnya AG-0002
  // AG-0001, AG-0002, AG-0003 -> kode berikutnya AG-0004
  async function generateKodeAset() {
    const {
      data: kodeData,
      error: kodeError,
    } = await supabase
      .from("agunan")
      .select("kode_aset");

    if (kodeError) {
      throw new Error(
        `Gagal membuat kode aset otomatis: ${kodeError.message}`
      );
    }

    const nomorTerpakai = new Set();

    (kodeData || []).forEach((item) => {
      const kode = String(
        item.kode_aset || ""
      )
        .trim()
        .toUpperCase();

      const match = kode.match(
        /^AG-(\d+)$/
      );

      if (!match) {
        return;
      }

      const nomor = Number(match[1]);

      if (
        Number.isInteger(nomor) &&
        nomor > 0
      ) {
        nomorTerpakai.add(nomor);
      }
    });

    let nomor = 1;

    while (
      nomorTerpakai.has(nomor)
    ) {
      nomor += 1;
    }

    return `AG-${String(nomor).padStart(4, "0")}`;
  }

  // Buat kode saat halaman Tambah Agunan dibuka.
  useEffect(() => {
    let mounted = true;

    async function prepareKodeAset() {
      try {
        const kodeAset =
          await generateKodeAset();

        if (!mounted) {
          return;
        }

        setForm((prev) => ({
          ...prev,
          kode_aset: kodeAset,
        }));
      } catch (err) {
        console.error(
          "Gagal menyiapkan kode aset:",
          err
        );

        if (mounted) {
          setError(
            err.message ||
              "Gagal membuat kode aset otomatis."
          );
        }
      }
    }

    prepareKodeAset();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");

    if (
      !form.nama_aset.trim() ||
      !form.harga ||
      !form.lokasi.trim()
    ) {
      setError(
        "Nama aset, harga, dan lokasi wajib diisi."
      );

      return;
    }

    if (Number(form.harga) <= 0) {
      setError("Harga aset harus lebih dari 0.");

      return;
    }

    setLoading(true);

    let uploadedPaths = [];

    try {
      // Generate ulang tepat sebelum simpan agar
      // kode yang kosong terbaru selalu dipakai.
      const kodeAset =
        await generateKodeAset();

      // Tampilkan kode final yang akan disimpan.
      setForm((prev) => ({
        ...prev,
        kode_aset: kodeAset,
      }));

      // Upload foto terlebih dahulu
      const {
        photoUrls,
        uploadedPaths: paths,
      } = await uploadPhotos(kodeAset);

      uploadedPaths = paths;

      // Simpan data agunan
      const { error: insertError } =
        await supabase
          .from("agunan")
          .insert({
            kode_aset: kodeAset,
            nama_aset:
              form.nama_aset.trim(),
            jenis_aset:
              form.jenis_aset,
            harga:
              Number(form.harga),
            lokasi:
              form.lokasi.trim(),
            luas_tanah:
              form.luas_tanah
                ? Number(form.luas_tanah)
                : null,
            luas_bangunan:
              form.luas_bangunan
                ? Number(form.luas_bangunan)
                : null,
            sertifikat:
              form.sertifikat.trim() ||
              null,
            status:
              form.status,
            deskripsi:
              form.deskripsi.trim() ||
              null,
            foto_urls:
              photoUrls,
          });

      if (insertError) {
        await deleteUploadedPhotos(
          uploadedPaths
        );

        throw new Error(
          insertError.message
        );
      }

      setLoading(false);

      if (onSaved) {
        onSaved();
      }

    } catch (err) {
      console.error(err);

      if (uploadedPaths.length) {
        await deleteUploadedPhotos(
          uploadedPaths
        );
      }

      setError(
        err.message ||
        "Terjadi kesalahan saat menyimpan data."
      );

      setLoading(false);
    }
  }

  return (
    <div className="form-agunan-page">

      {/* HEADER */}

      <header className="form-agunan-header">

        <div className="admin-brand">

          <div className="admin-brand-logo">
            AB
          </div>

          <div>
            <strong>AGUNAN</strong>
            <span>BANK</span>
          </div>

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

          <h1>
            Tambah Agunan
          </h1>

          <p>
            Masukkan informasi aset agunan yang akan
            ditampilkan pada website.
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

                <label>
                  Kode Aset
                  <span style={{ marginLeft: "4px" }}>*</span>
                </label>

                <input
                  name="kode_aset"
                  value={form.kode_aset}
                  onChange={handleChange}
                  placeholder="Otomatis, contoh: AG-0001"
                  required
                  readOnly
                  disabled={loading}
                />

                <small
                  style={{
                    display: "block",
                    marginTop: "6px",
                    color: "#71817f",
                    fontSize: "11px",
                  }}
                >
                  Kode dibuat otomatis berdasarkan nomor yang masih kosong.
                </small>

              </div>


              <div className="form-field">

                <label>
                  Nama Aset <span>*</span>
                </label>

                <input
                  name="nama_aset"
                  value={form.nama_aset}
                  onChange={handleChange}
                  placeholder="Contoh: Rumah Tinggal"
                  required
                  disabled={loading}
                />

              </div>


              <div className="form-field">

                <label>
                  Jenis Aset <span>*</span>
                </label>

                <select
                  name="jenis_aset"
                  value={form.jenis_aset}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="Rumah">
                    Rumah
                  </option>

                  <option value="Tanah">
                    Tanah
                  </option>

                  <option value="Ruko">
                    Ruko
                  </option>

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

                <label>
                  Status
                </label>

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

                  <span>
                    Rp
                  </span>

                  <input
                    name="harga"
                    value={formatHarga(form.harga)}
                    onChange={handleHargaChange}
                    placeholder="850.000.000"
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

                <label>
                  Luas Tanah
                </label>

                <div className="input-suffix">

                  <input
                    type="number"
                    name="luas_tanah"
                    value={form.luas_tanah}
                    onChange={handleChange}
                    placeholder="120"
                    min="0"
                    disabled={loading}
                  />

                  <span>
                    m²
                  </span>

                </div>

              </div>


              <div className="form-field">

                <label>
                  Luas Bangunan
                </label>

                <div className="input-suffix">

                  <input
                    type="number"
                    name="luas_bangunan"
                    value={form.luas_bangunan}
                    onChange={handleChange}
                    placeholder="90"
                    min="0"
                    disabled={loading}
                  />

                  <span>
                    m²
                  </span>

                </div>

              </div>


              <div className="form-field form-field-full">

                <label>
                  Sertifikat
                </label>

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


          {/* FOTO */}

          <section className="form-section">

            <div className="form-section-title">
              Foto Aset
            </div>

            <div className="photo-upload-info">
              Upload maksimal 5 foto. Format JPG,
              PNG, atau WebP. Foto otomatis dikompres
              maksimal 1600 px dan sekitar ≤ 1,5 MB.
            </div>


            {photos.length > 0 && (

              <div className="photo-preview-grid">

                {photos.map((photo, index) => (

                  <div
                    className={
                      index === 0
                        ? "photo-preview-item main-photo"
                        : "photo-preview-item"
                    }
                    key={`${photo.file.name}-${index}`}
                  >

                    <img
                      src={photo.preview}
                      alt={`Preview ${index + 1}`}
                    />


                    {index === 0 && (
                      <div className="main-photo-label">
                        FOTO UTAMA
                      </div>
                    )}


                    <button
                      type="button"
                      className="photo-remove-button"
                      onClick={() =>
                        removePhoto(index)
                      }
                      disabled={loading}
                      title="Hapus foto"
                    >
                      ×
                    </button>


                    {index !== 0 && (

                      <button
                        type="button"
                        className="photo-main-button"
                        onClick={() =>
                          movePhotoToFirst(index)
                        }
                        disabled={loading}
                      >
                        Jadikan Utama
                      </button>

                    )}

                  </div>

                ))}

              </div>

            )}


            {photos.length < MAX_PHOTOS && (

              <label
                className="photo-upload-button"
              >

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handlePhotoChange}
                  disabled={loading}
                />

                <div className="photo-upload-icon">
                  +
                </div>

                <strong>
                  Tambah Foto
                </strong>

                <span>
                  {photos.length} / {MAX_PHOTOS} foto
                </span>

              </label>

            )}

          </section>


          {/* DESKRIPSI */}

          <section className="form-section">

            <div className="form-section-title">
              Deskripsi
            </div>

            <div className="form-field">

              <label>
                Deskripsi Aset
              </label>

              <textarea
                name="deskripsi"
                value={form.deskripsi}
                onChange={handleChange}
                placeholder="Tuliskan informasi tambahan mengenai aset..."
                rows="5"
                disabled={loading}
              />

            </div>

          </section>


          {/* ERROR */}

          {error && (

            <div className="form-error">
              {error}
            </div>

          )}


          {/* ACTION */}

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
                ? "Menyimpan & Upload..."
                : "Simpan Agunan"}
            </button>

          </div>

        </form>

      </main>

    </div>
  );
}

export default FormAgunan;