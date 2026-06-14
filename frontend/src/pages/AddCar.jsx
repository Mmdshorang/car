import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";
import JalaliDatePicker from "../components/DatePicker";
import SearchableSelect from "../components/SearchableSelect";

const lookupFields = [
  { name: "vehicle_name_id", label: "نام خودرو", table: "vehicle_names", required: true },
  { name: "model_id", label: "مدل", table: "car_models", required: true },
  { name: "color_id", label: "رنگ", table: "colors", required: true },
  { name: "partner_id", label: "همکار", table: "partners" },
  { name: "iraqi_driver_id", label: "نام راننده عراقی", table: "iraqi_drivers", required: true },
  { name: "iranian_driver_id", label: "نام راننده ایرانی (مالک)", table: "iranian_drivers" },
  { name: "entry_border_id", label: "نام مرز وارد شده", table: "entry_borders" },
  { name: "clearance_agent_id", label: "نام ترخیص کار", table: "clearance_agents" },
  { name: "insurance_company_id", label: "شرکت بیمه گذار", table: "insurance_companies" },
  { name: "duration_id", label: "مدت", table: "durations" },
  { name: "entry_type_id", label: "نوع ورود", table: "entry_types" },
];

const textFields = [
  { name: "iraqi_plate", label: "پلاک عراق" },
  { name: "iranian_plate", label: "پلاک ایران" },
  { name: "entry_date", label: "تاریخ ورود", type: "jalali", placeholder: "مثلا 1405/02/26" },
  { name: "renewal_date", label: "تاریخ تمدید (آینده)", type: "gregorian" },
  { name: "iraq_card_change_date", label: "تاریخ تعویض کارت عراق", type: "gregorian" },
  { name: "exit_booklet_change_date", label: "تاریخ تعویض دفترچه خروج", type: "gregorian" },
  { name: "iraqi_driver_referrer", label: "معرف راننده عراقی" },
  { name: "guarantee_check_number", label: "شماره چک ضمانت" },
  { name: "guarantee_check_date", label: "تاریخ چک ضمانت" },
  { name: "iraq_contact_number", label: "شماره تماس عراق" },
  { name: "owner_contact_number", label: "شماره تماس مالک" },
  { name: "owner_address", label: "آدرس مالک" },
  { name: "notes_attachments", label: "ملاحظات و ضمائم", multiline: true },
];

const initialForm = [...lookupFields, ...textFields].reduce((acc, field) => {
  acc[field.name] = "";
  return acc;
}, {});

const lookupTables = lookupFields.map((field) => field.table);

function AddableSelect({ field, value, options, onChange, onAdd }) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const addItem = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const item = await onAdd(field.table, newName);
      onChange(field.name, item.id);
      setNewName("");
    } finally {
      setAdding(false);
    }
  };

  return (
    <label className="field">
      <span>{field.label}</span>
      <SearchableSelect
        value={value}
        onChange={(selectedValue) => onChange(field.name, selectedValue)}
        options={options.map((item) => ({ value: item.id, label: item.name }))}
        placeholder={`جستجو یا انتخاب ${field.label}`}
      />
      <div className="inline-add">
        <input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder={`افزودن ${field.label}`}
        />
        <button type="button" onClick={addItem} disabled={adding || !newName.trim()}>
          افزودن
        </button>
      </div>
    </label>
  );
}

export default function AddCar() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [lookups, setLookups] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadLookups = useCallback(async () => {
    setLoading(true);
    try {
      const responses = await Promise.all(lookupTables.map((table) => api.get(`/lookup/${table}`)));
      const nextLookups = {};
      lookupTables.forEach((table, index) => {
        nextLookups[table] = responses[index].data;
      });
      setLookups(nextLookups);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  const updateForm = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const addLookupItem = async (table, name) => {
    const res = await api.post(`/lookup/${table}`, { name });
    setLookups((current) => {
      const existing = current[table] || [];
      const exists = existing.some((item) => String(item.id) === String(res.data.id));
      return {
        ...current,
        [table]: exists ? existing : [...existing, res.data].sort((a, b) => a.name.localeCompare(b.name, "fa")),
      };
    });
    return res.data;
  };

  const submitHandler = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const missingRequiredField = lookupFields.find((field) => field.required && !form[field.name]);
      if (missingRequiredField) {
        setMessage(`${missingRequiredField.label} الزامی است`);
        return;
      }

      await api.post("/cars", form);
      setMessage("خودرو با موفقیت ثبت شد");
      setForm(initialForm);
      await loadLookups();
    } catch (err) {
      setMessage(err.response?.data?.message || "خطا در ثبت اطلاعات");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className="page">در حال بارگذاری...</main>;
  }

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1>افزودن خودرو</h1>
          <p>فیلدهای انتخابی را می‌توانید از لیست انتخاب کنید یا همان‌جا مورد جدید بسازید.</p>
        </div>
        <button type="button" className="secondary-button" onClick={() => navigate("/cars")}>
          مشاهده لیست
        </button>
      </div>

      <form className="form-panel" onSubmit={submitHandler}>
        <section>
          <h2>اطلاعات اصلی</h2>
          <div className="form-grid">
            {lookupFields.map((field) => (
              <AddableSelect
                key={field.name}
                field={field}
                value={form[field.name]}
                options={lookups[field.table] || []}
                onChange={updateForm}
                onAdd={addLookupItem}
              />
            ))}
          </div>
        </section>

        <section>
          <h2>جزئیات پرونده</h2>
          <div className="form-grid">
            {textFields.map((field) => (
              <label key={field.name} className={field.multiline ? "field full-width" : "field"}>
                <span>{field.label}</span>
                {field.type === "jalali" ? (
                  <JalaliDatePicker
                    value={form[field.name] || null}
                    onChange={(value) => updateForm(field.name, value || "")}
                    placeholder={field.placeholder || ""}
                    className="date-picker-field"
                  />
                ) : field.multiline ? (
                  <textarea
                    value={form[field.name]}
                    onChange={(event) => updateForm(field.name, event.target.value)}
                    rows="3"
                  />
                ) : (
                  <input
                    type={field.type === "gregorian" ? "date" : "text"}
                    value={form[field.name]}
                    placeholder={field.placeholder || ""}
                    onChange={(event) => updateForm(field.name, event.target.value)}
                  />
                )}
              </label>
            ))}
          </div>
        </section>

        {message && <p className="form-message">{message}</p>}

        <div className="form-actions">
          <button type="submit" disabled={saving}>
            {saving ? "در حال ثبت..." : "ثبت خودرو"}
          </button>
          <button type="button" className="secondary-button" onClick={() => setForm(initialForm)}>
            پاک کردن فرم
          </button>
        </div>
      </form>
    </main>
  );
}
