import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/api";

export const carColumns = [
  { key: "vehicle_name", label: "نام خودرو" },
  { key: "model", label: "مدل" },
  { key: "color", label: "رنگ" },
  { key: "partner", label: "همکار" },
  { key: "iraqi_driver_name", label: "نام راننده عراقی" },
  { key: "iranian_driver_name", label: "نام راننده ایرانی (مالک)" },
  { key: "iraqi_plate", label: "پلاک عراق" },
  { key: "iranian_plate", label: "پلاک ایران" },
  { key: "entry_date", label: "تاریخ ورود" },
  { key: "renewal_date", label: "تاریخ تمدید (آینده)" },
  { key: "iraq_card_change_date", label: "تاریخ تعویض کارت عراق" },
  { key: "exit_booklet_change_date", label: "تاریخ تعویض دفترچه خروج" },
  { key: "iraqi_driver_referrer", label: "معرف راننده عراقی" },
  { key: "entry_border_name", label: "نام مرز وارد شده" },
  { key: "clearance_agent_name", label: "نام ترخیص کار" },
  { key: "insurance_company", label: "شرکت بیمه گذار" },
  { key: "guarantee_check_number", label: "شماره چک ضمانت" },
  { key: "guarantee_check_date", label: "تاریخ چک ضمانت" },
  { key: "iraq_contact_number", label: "شماره تماس عراق" },
  { key: "owner_contact_number", label: "شماره تماس مالک" },
  { key: "owner_address", label: "آدرس مالک" },
  { key: "duration", label: "مدت" },
  { key: "entry_type", label: "نوع ورود" },
  { key: "notes_attachments", label: "ملاحظات و ضمائم" },
];

export default function Cars() {
  const [cars, setCars] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/cars");
      setCars(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "خطا در دریافت لیست خودروها");
    } finally {
      setLoading(false);
    }
  };

  const filteredCars = cars.filter((car) => {
    const haystack = carColumns.map((column) => car[column.key] || "").join(" ");
    return haystack.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1>لیست خودروها</h1>
          <p>{filteredCars.length} خودرو نمایش داده می‌شود</p>
        </div>
        <Link className="primary-link" to="/cars/add">
          افزودن خودرو
        </Link>
      </div>

      <div className="toolbar">
        <input
          type="text"
          placeholder="جستجو در نام خودرو، راننده، پلاک و سایر فیلدها..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button type="button" className="secondary-button" onClick={fetchCars}>
          بروزرسانی
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading && <p>در حال بارگذاری...</p>}

      {!loading && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {carColumns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCars.map((car) => (
                <tr key={car.id}>
                  {carColumns.map((column) => (
                    <td key={column.key}>{car[column.key] || "-"}</td>
                  ))}
                </tr>
              ))}
              {!filteredCars.length && (
                <tr>
                  <td colSpan={carColumns.length}>رکوردی پیدا نشد</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
