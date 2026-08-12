import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function normalizeImages(value) {
  if (Array.isArray(value)) {
    return value.filter(
      (url) =>
        typeof url === "string" &&
        url.trim()
    );
  }

  if (
    typeof value === "string" &&
    value.trim()
  ) {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.filter(
          (url) =>
            typeof url === "string" &&
            url.trim()
        );
      }

      if (
        typeof parsed === "string" &&
        parsed.trim()
      ) {
        return [parsed.trim()];
      }
    } catch {
      return [value.trim()];
    }
  }

  return [];
}


/*
========================================================
AMBIL PATH FILE STORAGE DARI URL
========================================================
*/

function getStoragePath(url) {
  if (
    !url ||
    typeof url !== "string"
  ) {
    return null;
  }

  try {
    const parsed =
      new URL(url);

    const marker =
      "/storage/v1/object/public/agunan/";

    const index =
      parsed.pathname.indexOf(marker);

    if (index === -1) {
      return null;
    }

    return decodeURIComponent(
      parsed.pathname.substring(
        index + marker.length
      )
    );

  } catch {
    return null;
  }
}


/*
========================================================
FORMAT RUPIAH
========================================================
*/

function formatRupiah(value) {
  const angka =
    String(value || "")
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


/*
========================================================
EDIT AGUNAN
========================================================
*/

function EditAgunan({
  data,
  onBack,
  onSaved,
}) {

  const [assetData, setAssetData] =
    useState(data || {});


  /*
  ======================================================
  FORM
  ======================================================
  */

  const [form, setForm] =
    useState({
      kode_aset:
        data?.kode_aset || "",

      nama_aset:
        data?.nama_aset || "",

      jenis_aset:
        data?.jenis_aset ||
        "Rumah",

      harga:
        String(
          data?.harga || ""
        ),

      lokasi:
        data?.lokasi || "",

      luas_tanah:
        String(
          data?.luas_tanah ?? ""
        ),

      luas_bangunan:
        String(
          data?.luas_bangunan ?? ""
        ),

      sertifikat:
        data?.sertifikat || "",

      status:
        data?.status ||
        "Tersedia",

      deskripsi:
        data?.deskripsi || "",
    });


  /*
  ======================================================
  FOTO LAMA
  ======================================================
  */

  const [images, setImages] =
    useState(
      normalizeImages(
        data?.foto_urls
      )
    );


  /*
  ======================================================
  FOTO YANG DIHAPUS
  ======================================================
  */

  const [
    deletedImages,
    setDeletedImages,
  ] = useState([]);


  /*
  ======================================================
  FOTO BARU
  ======================================================
  */

  const [
    newPhotos,
    setNewPhotos,
  ] = useState([]);


  /*
  ======================================================
  LOADING
  ======================================================
  */

  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    loadingData,
    setLoadingData,
  ] = useState(true);


  /*
  ======================================================
  PESAN
  ======================================================
  */

  const [
    error,
    setError,
  ] = useState("");


  const [
    success,
    setSuccess,
  ] = useState("");


  /*
  ======================================================
  LOAD DATA TERBARU
  ======================================================
  */

  useEffect(() => {

    let mounted = true;

    async function loadData() {

      if (!data?.id) {
        setLoadingData(false);
        return;
      }

      try {

        setLoadingData(true);

        const {
          data: result,
          error: fetchError,
        } = await supabase
          .from("agunan")
          .select("*")
          .eq(
            "id",
            data.id
          )
          .single();


        if (fetchError) {

          console.error(
            "Gagal mengambil data:",
            fetchError
          );

          if (mounted) {

            setImages(
              normalizeImages(
                data?.foto_urls
              )
            );

            setLoadingData(false);
          }

          return;
        }


        if (!mounted) {
          return;
        }


        console.log(
          "DATA EDIT:",
          result
        );

        console.log(
          "FOTO EDIT:",
          result?.foto_urls
        );


        const foto =
          normalizeImages(
            result?.foto_urls
          );


        setAssetData(
          result
        );


        setImages(
          foto
        );


        setDeletedImages(
          []
        );


        setNewPhotos(
          []
        );


        setForm({

          kode_aset:
            result?.kode_aset ||
            "",

          nama_aset:
            result?.nama_aset ||
            "",

          jenis_aset:
            result?.jenis_aset ||
            "Rumah",

          harga:
            String(
              result?.harga || ""
            ),

          lokasi:
            result?.lokasi ||
            "",

          luas_tanah:
            String(
              result?.luas_tanah ??
              ""
            ),

          luas_bangunan:
            String(
              result?.luas_bangunan ??
              ""
            ),

          sertifikat:
            result?.sertifikat ||
            "",

          status:
            result?.status ||
            "Tersedia",

          deskripsi:
            result?.deskripsi ||
            "",
        });

      } catch (err) {

        console.error(err);

        if (mounted) {

          setError(
            "Gagal memuat data aset."
          );

        }

      } finally {

        if (mounted) {
          setLoadingData(false);
        }

      }
    }


    loadData();


    return () => {
      mounted = false;
    };

  }, [data]);


  /*
  ======================================================
  INPUT FORM
  ======================================================
  */

  function handleChange(e) {

    const {
      name,
      value,
    } = e.target;


    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

  }


  /*
  ======================================================
  INPUT HARGA
  ======================================================
  */

  function handleHargaChange(e) {

    const value =
      e.target.value.replace(
        /\D/g,
        ""
      );


    setForm((prev) => ({
      ...prev,
      harga: value,
    }));

  }


  /*
  ======================================================
  HAPUS FOTO LAMA
  ======================================================
  */

  function handleDeletePhoto(
    image
  ) {

    if (loading) {
      return;
    }


    const yakin =
      window.confirm(
        "Hapus foto ini?\n\n" +
        "Foto akan benar-benar dihapus " +
        "setelah Anda menekan " +
        "Simpan Perubahan."
      );


    if (!yakin) {
      return;
    }


    /*
    Hilangkan dari tampilan
    */

    setImages((prev) =>
      prev.filter(
        (item) =>
          item !== image
      )
    );


    /*
    Masukkan daftar penghapusan
    */

    setDeletedImages(
      (prev) => {

        if (
          prev.includes(image)
        ) {
          return prev;
        }

        return [
          ...prev,
          image,
        ];

      }
    );


    setSuccess(
      "Foto ditandai untuk dihapus. Klik Simpan Perubahan."
    );

  }


  /*
  ======================================================
  TAMBAH FOTO BARU
  ======================================================
  */

  async function handleAddPhotos(e) {

    const files = Array.from(e.target.files || []);

    e.target.value = "";

    if (files.length === 0) {
      return;
    }

    const validFiles = files.filter((file) =>
      file.type.startsWith("image/")
    );

    if (validFiles.length !== files.length) {
      setError("Hanya file gambar yang dapat ditambahkan.");
    }

    const sizeValidFiles = validFiles.filter(
      (file) => file.size <= 10 * 1024 * 1024
    );

    if (sizeValidFiles.length !== validFiles.length) {
      setError("Ukuran setiap foto maksimal 10 MB.");
    }

    if (sizeValidFiles.length === 0) {
      return;
    }

    try {
      setLoading(true);

      const prepared = [];

      for (const file of sizeValidFiles) {
        const watermarkedFile = await addAsetGoWatermark(file);

        prepared.push({
          id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
          file: watermarkedFile,
          preview: URL.createObjectURL(watermarkedFile),
        });
      }

      setNewPhotos((prev) => [
        ...prev,
        ...prepared,
      ]);

      setError("");
      setSuccess(
        `${prepared.length} foto baru ditambahkan dengan watermark AsetGo. Klik Simpan Perubahan untuk mengupload.`
      );
    } catch (error) {
      console.error("Gagal menambahkan watermark:", error);
      setError(error?.message || "Gagal memproses watermark foto.");
    } finally {
      setLoading(false);
    }
  }


  /*
  ======================================================
  WATERMARK ASETGO
  ======================================================
  */

  async function addAsetGoWatermark(file) {
    const objectUrl = URL.createObjectURL(file);

    try {
      const image = await new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => resolve(img);
        img.onerror = () =>
          reject(new Error(`Foto ${file.name} tidak dapat dibaca.`));

        img.src = objectUrl;
      });

      let width = image.naturalWidth;
      let height = image.naturalHeight;

      if (!width || !height) {
        throw new Error(`Ukuran foto ${file.name} tidak valid.`);
      }

      const MAX_WATERMARK_DIMENSION = 1600;

      if (Math.max(width, height) > MAX_WATERMARK_DIMENSION) {
        const scale =
          MAX_WATERMARK_DIMENSION / Math.max(width, height);

        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Browser tidak mendukung proses watermark foto.");
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(image, 0, 0, width, height);

      ctx.save();

      const watermarkSize = Math.max(
        28,
        Math.round(Math.min(width, height) * 0.065)
      );
      const watermarkGapX = watermarkSize * 5.5;
      const watermarkGapY = watermarkSize * 3.2;
      const diagonal = Math.ceil(
        Math.sqrt(width * width + height * height)
      );

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

      for (let y = -diagonal; y <= diagonal; y += watermarkGapY) {
        for (let x = -diagonal; x <= diagonal; x += watermarkGapX) {
          ctx.fillText("AsetGo", x, y);
        }
      }

      ctx.restore();

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.88)
      );

      if (!blob) {
        throw new Error(`Gagal membuat watermark foto ${file.name}.`);
      }

      const name = file.name.replace(/\.[^/.]+$/, "") + ".jpg";

      return new File([blob], name, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }



  /*
  ======================================================
  HAPUS FOTO BARU SEBELUM UPLOAD
  ======================================================
  */

  function handleRemoveNewPhoto(
    id
  ) {

    if (loading) {
      return;
    }


    setNewPhotos(
      (prev) => {

        const target =
          prev.find(
            (item) =>
              item.id === id
          );


        if (target?.preview) {

          URL.revokeObjectURL(
            target.preview
          );

        }


        return prev.filter(
          (item) =>
            item.id !== id
        );

      }
    );

  }


  /*
  ======================================================
  UPLOAD FOTO BARU
  ======================================================
  */

  async function uploadNewPhotos() {

    if (
      newPhotos.length === 0
    ) {

      return [];

    }


    const uploadedUrls = [];


    for (
      const item of newPhotos
    ) {

      const file =
        item.file;


      /*
      Nama file dibuat unik
      */

      const extension =
        file.name.includes(".")
          ? file.name
              .split(".")
              .pop()
              .toLowerCase()
          : "jpg";


      const safeName =
        file.name
          .replace(
            /\.[^/.]+$/,
            ""
          )
          .replace(
            /[^a-zA-Z0-9-_]/g,
            "-"
          )
          .substring(
            0,
            50
          );


      const fileName =
        `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 8)}-${safeName}.${extension}`;


      /*
      Folder berdasarkan ID aset
      */

      const filePath =
        `${assetData.id}/${fileName}`;


      console.log(
        "Upload foto:",
        filePath
      );


      /*
      UPLOAD
      */

      const {
        error: uploadError,
      } = await supabase
        .storage
        .from("agunan")
        .upload(
          filePath,
          file,
          {
            cacheControl:
              "3600",

            upsert:
              false,

            contentType:
              file.type,
          }
        );


      if (uploadError) {

        console.error(
          "Upload gagal:",
          uploadError
        );

        throw uploadError;

      }


      /*
      AMBIL PUBLIC URL
      */

      const {
        data:
          publicUrlData,
      } =
        supabase
          .storage
          .from("agunan")
          .getPublicUrl(
            filePath
          );


      const publicUrl =
        publicUrlData?.publicUrl;


      if (!publicUrl) {

        throw new Error(
          "Public URL foto tidak berhasil dibuat."
        );

      }


      uploadedUrls.push(
        publicUrl
      );

    }


    return uploadedUrls;

  }


  /*
  ======================================================
  HAPUS FILE STORAGE
  ======================================================
  */

  async function deleteStorageFiles(
    urls
  ) {

    if (
      !Array.isArray(urls) ||
      urls.length === 0
    ) {
      return;
    }


    const paths =
      urls
        .map(
          getStoragePath
        )
        .filter(Boolean);


    if (
      paths.length === 0
    ) {

      console.warn(
        "Tidak ada Storage path yang ditemukan."
      );

      return;

    }


    console.log(
      "Hapus file Storage:",
      paths
    );


    const {
      error: storageError,
    } =
      await supabase
        .storage
        .from("agunan")
        .remove(
          paths
        );


    if (storageError) {

      console.error(
        "Gagal menghapus Storage:",
        storageError
      );

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


    /*
    VALIDASI
    */

    if (
      !form.nama_aset.trim()
    ) {

      setError(
        "Nama aset wajib diisi."
      );

      return;

    }


    if (!form.harga) {

      setError(
        "Harga wajib diisi."
      );

      return;

    }


    if (
      !form.lokasi.trim()
    ) {

      setError(
        "Lokasi wajib diisi."
      );

      return;

    }


    if (!assetData?.id) {

      setError(
        "ID aset tidak ditemukan."
      );

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

      if (
        newPhotos.length > 0
      ) {

        setSuccess(
          "Mengupload foto baru..."
        );


        uploadedUrls =
          await uploadNewPhotos();


        console.log(
          "FOTO BARU:",
          uploadedUrls
        );

      }


      /*
      ==================================================
      2. GABUNG FOTO LAMA + FOTO BARU
      ==================================================
      */

      const finalImages = [
        ...images,
        ...uploadedUrls,
      ].filter(Boolean);


      console.log(
        "FOTO FINAL:",
        finalImages
      );


      /*
      ==================================================
      3. UPDATE DATABASE
      ==================================================
      */

      setSuccess(
        "Menyimpan perubahan..."
      );


      const {
        error: updateError,
      } =
        await supabase
          .from("agunan")
          .update({

            nama_aset:
              form.nama_aset.trim(),

            jenis_aset:
              form.jenis_aset,

            harga:
              Number(
                form.harga
              ),

            lokasi:
              form.lokasi.trim(),

            luas_tanah:
              form.luas_tanah
                ? Number(
                    form.luas_tanah
                  )
                : null,

            luas_bangunan:
              form.luas_bangunan
                ? Number(
                    form.luas_bangunan
                  )
                : null,

            sertifikat:
              form.sertifikat
                .trim() ||
              null,

            status:
              form.status,

            deskripsi:
              form.deskripsi
                .trim() ||
              null,

            /*
            FOTO FINAL
            */
            foto_urls:
              finalImages,

          })
          .eq(
            "id",
            assetData.id
          );


      /*
      DATABASE GAGAL
      */

      if (updateError) {

        /*
        Kalau foto baru sudah terupload
        tetapi database gagal,
        hapus kembali foto baru dari Storage
        */

        if (
          uploadedUrls.length >
          0
        ) {

          try {

            await deleteStorageFiles(
              uploadedUrls
            );

          } catch (
            cleanupError
          ) {

            console.error(
              "Cleanup upload gagal:",
              cleanupError
            );

          }

        }


        throw updateError;

      }


      /*
      ==================================================
      4. HAPUS FOTO LAMA YANG DITANDAI
      ==================================================
      */

      if (
        deletedImages.length >
        0
      ) {

        try {

          await deleteStorageFiles(
            deletedImages
          );

        } catch (
          storageError
        ) {

          /*
          Database sudah benar.
          File Storage gagal dihapus.
          */

          console.error(
            "Database berhasil diperbarui tetapi Storage gagal:",
            storageError
          );

        }

      }


      /*
      ==================================================
      5. UPDATE STATE
      ==================================================
      */

      setImages(
        finalImages
      );


      setDeletedImages(
        []
      );


      /*
      Hapus preview object URL
      */

      newPhotos.forEach(
        (item) => {

          if (
            item.preview
          ) {

            URL.revokeObjectURL(
              item.preview
            );

          }

        }
      );


      setNewPhotos(
        []
      );


      setAssetData(
        (prev) => ({

          ...prev,

          ...form,

          harga:
            Number(
              form.harga
            ),

          foto_urls:
            finalImages,

        })
      );


      /*
      ==================================================
      BERHASIL
      ==================================================
      */

      setSuccess(
        "Perubahan berhasil disimpan."
      );


      /*
      Kembali setelah sebentar
      */

      setTimeout(() => {

        if (onSaved) {
          onSaved();
        }

      }, 800);


    } catch (err) {

      console.error(
        "Gagal menyimpan:",
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

    <div
      className="form-agunan-page"
      style={{
        minHeight:
          "100vh",

        background:
          "#f5f8f7",
      }}
    >


      {/* =================================================
          HEADER
      ================================================= */}

      <header
        className="form-agunan-header"
      >

        <div
          className="admin-brand"
        >

          <div
            className="admin-brand-logo"
          >
            AB
          </div>

          <div>

            <strong>
              AGUNAN
            </strong>

            <span>
              BANK
            </span>

          </div>

        </div>


        <button
          type="button"
          className="admin-back-button"
          onClick={onBack}
          disabled={loading}
        >
          ← Kembali
        </button>

      </header>


      {/* =================================================
          CONTENT
      ================================================= */}

      <main
        className="form-agunan-content"
      >

        <div
          className="form-agunan-title"
        >

          <div
            className="admin-eyebrow"
          >
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
          onSubmit={
            handleSubmit
          }
        >


          {/* =================================================
              INFORMASI UTAMA
          ================================================= */}

          <section
            className="form-section"
          >

            <div
              className="form-section-title"
            >
              Informasi Utama
            </div>


            <div
              className="form-grid"
            >

              <div
                className="form-field"
              >

                <label>
                  Kode Aset
                </label>

                <input
                  value={
                    form.kode_aset
                  }
                  disabled
                />

              </div>


              <div
                className="form-field"
              >

                <label>
                  Nama Aset{" "}
                  <span>*</span>
                </label>

                <input
                  name="nama_aset"
                  value={
                    form.nama_aset
                  }
                  onChange={
                    handleChange
                  }
                  required
                  disabled={loading}
                />

              </div>


              <div
                className="form-field"
              >

                <label>
                  Jenis Aset
                </label>

                <select
                  name="jenis_aset"
                  value={
                    form.jenis_aset
                  }
                  onChange={
                    handleChange
                  }
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


              <div
                className="form-field"
              >

                <label>
                  Status
                </label>

                <select
                  name="status"
                  value={
                    form.status
                  }
                  onChange={
                    handleChange
                  }
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


          {/* =================================================
              NILAI & LOKASI
          ================================================= */}

          <section
            className="form-section"
          >

            <div
              className="form-section-title"
            >
              Nilai & Lokasi
            </div>


            <div
              className="form-grid"
            >

              <div
                className="form-field"
              >

                <label>
                  Harga{" "}
                  <span>*</span>
                </label>


                <div
                  className="input-prefix"
                >

                  <span>
                    Rp
                  </span>

                  <input
                    name="harga"
                    value={
                      formatRupiah(
                        form.harga
                      )
                    }
                    onChange={
                      handleHargaChange
                    }
                    inputMode="numeric"
                    required
                    disabled={loading}
                  />

                </div>

              </div>


              <div
                className="form-field"
              >

                <label>
                  Lokasi{" "}
                  <span>*</span>
                </label>

                <input
                  name="lokasi"
                  value={
                    form.lokasi
                  }
                  onChange={
                    handleChange
                  }
                  required
                  disabled={loading}
                />

              </div>


              <div
                className="form-field"
              >

                <label>
                  Luas Tanah
                </label>

                <input
                  type="number"
                  name="luas_tanah"
                  value={
                    form.luas_tanah
                  }
                  onChange={
                    handleChange
                  }
                  disabled={loading}
                />

              </div>


              <div
                className="form-field"
              >

                <label>
                  Luas Bangunan
                </label>

                <input
                  type="number"
                  name="luas_bangunan"
                  value={
                    form.luas_bangunan
                  }
                  onChange={
                    handleChange
                  }
                  disabled={loading}
                />

              </div>


              <div
                className="form-field form-field-full"
              >

                <label>
                  Sertifikat
                </label>

                <input
                  name="sertifikat"
                  value={
                    form.sertifikat
                  }
                  onChange={
                    handleChange
                  }
                  disabled={loading}
                />

              </div>

            </div>

          </section>


          {/* =================================================
              FOTO ASET
          ================================================= */}

          <section
            className="form-section"
          >

            <div
              className="form-section-title"
            >
              Foto Aset
            </div>


            <p
              style={{
                fontSize:
                  "13px",

                color:
                  "#657575",

                marginBottom:
                  "16px",
              }}
            >
              Tambahkan foto baru atau
              hapus foto lama secara
              individual.
            </p>


            {/* =================================================
                FOTO LAMA
            ================================================= */}

            <div
              style={{
                fontWeight:
                  "700",

                fontSize:
                  "14px",

                marginBottom:
                  "10px",

                color:
                  "#173b38",
              }}
            >
              Foto Tersimpan
            </div>


            {loadingData ? (

              <div
                style={{
                  padding:
                    "30px",

                  textAlign:
                    "center",

                  color:
                    "#657575",
                }}
              >
                Memuat foto...
              </div>

            ) : images.length === 0 ? (

              <div
                style={{
                  padding:
                    "30px",

                  textAlign:
                    "center",

                  border:
                    "1px dashed #ccd8d5",

                  borderRadius:
                    "10px",

                  background:
                    "#fafcfc",

                  marginBottom:
                    "20px",
                }}
              >

                📷

                <div
                  style={{
                    marginTop:
                      "8px",
                  }}
                >
                  Belum ada foto tersimpan.
                </div>

              </div>

            ) : (

              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(180px, 1fr))",

                  gap:
                    "16px",

                  marginBottom:
                    "20px",
                }}
              >

                {images.map(
                  (
                    image,
                    index
                  ) => (

                    <div
                      key={`${image}-${index}`}
                      style={{
                        position:
                          "relative",

                        background:
                          "#fff",

                        border:
                          "1px solid #d9e2e0",

                        borderRadius:
                          "10px",

                        padding:
                          "8px",

                        boxShadow:
                          "0 2px 8px rgba(0,0,0,.04)",
                      }}
                    >

                      <div
                        style={{
                          position:
                            "relative",
                        }}
                      >

                        <img
                          src={image}
                          alt={`Foto ${
                            index + 1
                          }`}
                          style={{
                            width:
                              "100%",

                            height:
                              "150px",

                            objectFit:
                              "cover",

                            display:
                              "block",

                            borderRadius:
                              "7px",
                          }}
                        />


                        {index === 0 && (

                          <div
                            style={{
                              position:
                                "absolute",

                              top:
                                "8px",

                              left:
                                "8px",

                              background:
                                "#00695c",

                              color:
                                "#fff",

                              padding:
                                "5px 8px",

                              borderRadius:
                                "5px",

                              fontSize:
                                "9px",

                              fontWeight:
                                "700",
                            }}
                          >
                            FOTO UTAMA
                          </div>

                        )}

                      </div>


                      <button
                        type="button"
                        onClick={() =>
                          handleDeletePhoto(
                            image
                          )
                        }
                        disabled={
                          loading
                        }
                        style={{
                          width:
                            "100%",

                          marginTop:
                            "8px",

                          padding:
                            "9px 10px",

                          border:
                            "1px solid #dc3545",

                          borderRadius:
                            "6px",

                          background:
                            "#fff",

                          color:
                            "#dc3545",

                          fontSize:
                            "13px",

                          fontWeight:
                            "600",

                          cursor:
                            loading
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        🗑️ Hapus Foto
                      </button>

                    </div>

                  )
                )}

              </div>

            )}


            {/* =================================================
                TAMBAH FOTO
            ================================================= */}

            <div
              style={{
                border:
                  "1px dashed #b8c9c5",

                borderRadius:
                  "10px",

                padding:
                  "18px",

                background:
                  "#fafcfc",

                marginTop:
                  "10px",
              }}
            >

              <label
                htmlFor="edit-photo-upload"
                style={{
                  display:
                    "inline-flex",

                  alignItems:
                    "center",

                  gap:
                    "8px",

                  padding:
                    "10px 16px",

                  borderRadius:
                    "7px",

                  background:
                    "#00695c",

                  color:
                    "#fff",

                  fontSize:
                    "13px",

                  fontWeight:
                    "600",

                  cursor:
                    loading
                      ? "not-allowed"
                      : "pointer",

                  opacity:
                    loading
                      ? 0.6
                      : 1,
                }}
              >

                📷 + Tambah Foto

              </label>


              <input
                id="edit-photo-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={
                  handleAddPhotos
                }
                disabled={
                  loading
                }
                style={{
                  display:
                    "none",
                }}
              />


              <div
                style={{
                  marginTop:
                    "8px",

                  fontSize:
                    "12px",

                  color:
                    "#71817f",
                }}
              >
                Bisa memilih beberapa foto
                sekaligus. Maksimal 10 MB
                per foto.
              </div>

            </div>


            {/* =================================================
                PREVIEW FOTO BARU
            ================================================= */}

            {newPhotos.length >
              0 && (

              <div
                style={{
                  marginTop:
                    "22px",
                }}
              >

                <div
                  style={{
                    fontWeight:
                      "700",

                    fontSize:
                      "14px",

                    color:
                      "#173b38",

                    marginBottom:
                      "10px",
                  }}
                >
                  Foto Baru
                </div>


                <div
                  style={{
                    display:
                      "grid",

                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(180px, 1fr))",

                    gap:
                      "16px",
                  }}
                >

                  {newPhotos.map(
                    (
                      item,
                      index
                    ) => (

                      <div
                        key={
                          item.id
                        }
                        style={{
                          background:
                            "#fff",

                          border:
                            "1px solid #d9e2e0",

                          borderRadius:
                            "10px",

                          padding:
                            "8px",

                          position:
                            "relative",
                        }}
                      >

                        <div
                          style={{
                            position:
                              "relative",
                          }}
                        >

                          <img
                            src={
                              item.preview
                            }
                            alt={`Foto baru ${
                              index + 1
                            }`}
                            style={{
                              width:
                                "100%",

                              height:
                                "150px",

                              objectFit:
                                "cover",

                              display:
                                "block",

                              borderRadius:
                                "7px",
                            }}
                          />


                          <div
                            style={{
                              position:
                                "absolute",

                              top:
                                "8px",

                              left:
                                "8px",

                              background:
                                "#d9a441",

                              color:
                                "#fff",

                              padding:
                                "5px 8px",

                              borderRadius:
                                "5px",

                              fontSize:
                                "9px",

                              fontWeight:
                                "700",
                            }}
                          >
                            FOTO BARU
                          </div>

                        </div>


                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveNewPhoto(
                              item.id
                            )
                          }
                          disabled={
                            loading
                          }
                          style={{
                            width:
                              "100%",

                            marginTop:
                              "8px",

                            padding:
                              "9px 10px",

                            border:
                              "1px solid #dc3545",

                            borderRadius:
                              "6px",

                            background:
                              "#fff",

                            color:
                              "#dc3545",

                            fontSize:
                              "13px",

                            fontWeight:
                              "600",

                            cursor:
                              "pointer",
                          }}
                        >
                          ✕ Batalkan Foto
                        </button>

                      </div>

                    )
                  )}

                </div>

              </div>

            )}


            {/* FOTO YANG DIHAPUS */}

            {deletedImages.length >
              0 && (

              <div
                style={{
                  marginTop:
                    "16px",

                  padding:
                    "12px 15px",

                  background:
                    "#fff8e8",

                  border:
                    "1px solid #f0c36d",

                  borderRadius:
                    "8px",

                  color:
                    "#8a5a00",

                  fontSize:
                    "13px",
                }}
              >

                ⚠️{" "}

                {deletedImages.length}{" "}
                foto akan dihapus
                saat Anda menekan{" "}

                <strong>
                  Simpan Perubahan
                </strong>.

              </div>

            )}

          </section>


          {/* =================================================
              DESKRIPSI
          ================================================= */}

          <section
            className="form-section"
          >

            <div
              className="form-section-title"
            >
              Deskripsi
            </div>


            <div
              className="form-field"
            >

              <label>
                Deskripsi Aset
              </label>

              <textarea
                name="deskripsi"
                value={
                  form.deskripsi
                }
                onChange={
                  handleChange
                }
                rows="5"
                disabled={
                  loading
                }
                placeholder="Informasi tambahan mengenai aset..."
              />

            </div>

          </section>


          {/* =================================================
              ERROR
          ================================================= */}

          {error && (

            <div
              style={{
                marginBottom:
                  "16px",

                padding:
                  "12px 15px",

                background:
                  "#fff0f0",

                border:
                  "1px solid #f0b5b5",

                borderRadius:
                  "8px",

                color:
                  "#b42318",

                fontSize:
                  "13px",
              }}
            >
              ❌ {error}
            </div>

          )}


          {/* =================================================
              SUCCESS
          ================================================= */}

          {success && (

            <div
              style={{
                marginBottom:
                  "16px",

                padding:
                  "12px 15px",

                background:
                  "#edf9f2",

                border:
                  "1px solid #b7dfc8",

                borderRadius:
                  "8px",

                color:
                  "#126b3a",

                fontSize:
                  "13px",
              }}
            >
              ✓ {success}
            </div>

          )}


          {/* =================================================
              BUTTON
          ================================================= */}

          <div
            className="form-actions"
          >

            <button
              type="button"
              className="form-cancel"
              onClick={
                onBack
              }
              disabled={
                loading
              }
            >
              Batal
            </button>


            <button
              type="submit"
              className="form-save"
              disabled={
                loading ||
                loadingData
              }
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