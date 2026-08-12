import { useState } from "react";
import { supabase } from "../lib/supabase";
import asetgoLogo from "../assets/asetgo-logo.png";

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID").format(value || 0);
}

function EditAgunan({ data, onBack, onSaved }) {
  const [form, setForm] = useState({
    kode_aset: data.kode_aset || data.kode || "",
    nama_aset: data.nama_aset || data.nama || "",
    jenis_aset: data.jenis_aset || data.jenis || "Rumah",
    harga: String(data.harga || ""),
    lokasi: data.lokasi || "",
    luas_tanah: String(data.luas_tanah ?? data.luasTanah ?? ""),
    luas_bangunan: String(
      data.luas_bangunan ?? data.luasBangunan ?? ""
    ),
    sertifikat: data.sertifikat || "",
    status: data.status || "Tersedia",
    deskripsi: data.deskripsi || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

    const { error: updateError } = await supabase
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
      })
      .eq("id", data.id);

    if (updateError) {
      console.error(updateError);

      setError(updateError.message);
      setLoading(false);

      return;
    }

    setLoading(false);

    if (onSaved) {
      onSaved();
    }
  }

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

          <h1>
            Edit Agunan
          </h1>

          <p>
            Perbarui informasi aset agunan.
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
                </label>

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

                <label>
                  Jenis Aset
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

                <label>
                  Luas Tanah
                </label>

                <div className="input-suffix">

                  <input
                    type="number"
                    name="luas_tanah"
                    value={form.luas_tanah}
                    onChange={handleChange}
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


          {/* FOTO SAAT INI */}

          <section className="form-section">

            <div className="form-section-title">
              Foto Aset
            </div>

            <div className="photo-upload-info">
              Foto saat ini tetap dipertahankan.
              Pengelolaan penggantian foto kita buat
              pada tahap berikutnya agar foto lama tidak
              terhapus secara tidak sengaja.
            </div>

            {data.images?.length > 0 ? (

              <div className="photo-preview-grid">

                {data.images.map((image, index) => (

                  <div
                    className={
                      index === 0
                        ? "photo-preview-item main-photo"
                        : "photo-preview-item"
                    }
                    key={image}
                  >

                    <img
                      src={image}
                      alt={`Foto ${index + 1}`}
                    />

                    {index === 0 && (
                      <div className="main-photo-label">
                        FOTO UTAMA
                      </div>
                    )}

                  </div>

                ))}

              </div>

            ) : (

              <div className="admin-empty">
                Belum ada foto untuk aset ini.
              </div>

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