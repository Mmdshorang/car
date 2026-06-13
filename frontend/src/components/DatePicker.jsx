import React, { useState, useEffect, useRef } from "react";
import moment from "jalali-moment";
import { Calendar, X, ChevronLeft, ChevronRight } from "lucide-react";

// تنظیم زبان مومنت روی فارسی
moment.locale("fa", { useGregorianParser: true, dialect: "persian-modern" });

// تعریف تایپ‌ها با استفاده از JSDoc برای سازگاری با JSX
/**
 * @typedef {Object} Props
 * @property {string | null} [value]
 * @property {(jDate: string | null) => void} [onChange]
 * @property {string} [placeholder]
 * @property {string} [className]
 * @property {string} [inputClassName]
 * @property {string} [format]
 * @property {string | null} [min]
 * @property {string | null} [max]
 * @property {boolean} [disabled]
 */

const DEFAULT_FORMAT = "jYYYY/jMM/jDD";

/**
 * تبدیل رشته ورودی به آبجکت مومنت فارسی
 * @param {string | null} [input]
 * @param {string} [format]
 * @returns {moment.Moment | null}
 */
function parseJalali(input, format = DEFAULT_FORMAT) {
  if (!input) return null;
  const m = moment(input, format, "fa");
  return m.isValid() ? m : null;
}

/**
 * تبدیل آبجکت مومنت به رشته فارسی
 * @param {moment.Moment | null} m
 * @param {string} [format]
 * @returns {string | null}
 */
function formatJalali(m, format = DEFAULT_FORMAT) {
  if (!m) return null;
  return m.format(format);
}

/**
 * تولید آرایه روزهای ماه برای رندر در تقویم
 * @param {number} yearJ
 * @param {number} monthJ
 * @returns {Array<number | null>}
 */
function generateMonthGrid(yearJ, monthJ) {
  const ref = moment().jYear(yearJ).jMonth(monthJ).jDate(1);
  const start = ref.clone().startOf("jMonth");
  const end = ref.clone().endOf("jMonth");
  const firstWeekday = start.day();
  const daysInMonth = end.jDate();
  const grid = [];
  for (let i = 0; i < firstWeekday; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(d);
  while (grid.length < 42) grid.push(null);
  return grid;
}

/**
 * کامپوننت اصلی انتخابگر تاریخ شمسی
 * @param {Props} props
 */
export default function JalaliDatePicker({
  value = null,
  onChange,
  placeholder = "تاریخ را انتخاب کنید...",
  className = "",
  inputClassName = "",
  format = DEFAULT_FORMAT,
  min = null,
  max = null,
  disabled = false,
}) {
  const [input, setInput] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  
  // مقدار اولیه تقویم بر اساس مقدار ورودی یا تاریخ امروز
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const initial = value ? parseJalali(value, format) : moment();
    return initial ?? moment();
  });

  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const popupRef = useRef(null);
  const today = moment();
  
  // تعیین موقعیت پاپ‌آپ (بالا یا پایین)
  const [placement, setPlacement] = useState("bottom");
  const [popupStyle, setPopupStyle] = useState({});

  // همگام‌سازی اینپوت با مقدار value خارجی
  useEffect(() => {
    setInput(value ?? "");
    if (value) {
      const parsed = parseJalali(value, format);
      if (parsed) setCalendarMonth(parsed);
    }
  }, [value, format]);

  // بستن پاپ‌آپ با کلیک بیرون
  useEffect(() => {
    function handleClickOutside(e) {
      if (!rootRef.current?.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // محاسبه موقعیت پاپ‌آپ برای جلوگیری از خروج از صفحه
  const computePlacement = () => {
    const root = rootRef.current;
    const popup = popupRef.current;
    if (!root || !popup) return;

    const rect = root.getBoundingClientRect();
    const popupHeight = popup.offsetHeight || 260;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let chosen = "bottom";
    if (spaceBelow < popupHeight && spaceAbove > spaceBelow) {
      chosen = "top";
    }
    setPlacement(chosen);

    const offset = (root.offsetHeight ?? rect.height) + 8;
    if (chosen === "bottom") {
      setPopupStyle({ top: offset, bottom: undefined, right: 0 });
    } else {
      setPopupStyle({ bottom: offset, top: undefined, right: 0 });
    }
  };

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => computePlacement());
    }
  }, [open, calendarMonth]);

  useEffect(() => {
    const handler = () => {
      if (open) computePlacement();
    };
    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, true);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler, true);
    };
  }, [open]);

  const commitInput = (raw) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setInput("");
      if (onChange) onChange(null);
      return;
    }
    const m = parseJalali(trimmed, format);
    if (m) {
      const minDate = min ? parseJalali(min, format) : null;
      const maxDate = max ? parseJalali(max, format) : null;
      
      // بررسی محدودیت‌های حداقل و حداکثر
      if ((minDate && m.isBefore(minDate)) || (maxDate && m.isAfter(maxDate))) return;

      const formatted = formatJalali(m, format);
      setInput(formatted);
      if (onChange) onChange(formatted);
      setCalendarMonth(m);
    }
  };

  const selectDate = (day) => {
    const m = calendarMonth.clone().jDate(day);
    const formatted = formatJalali(m, format);
    setInput(formatted);
    if (onChange) onChange(formatted);
    setOpen(false);
  };

  const grid = generateMonthGrid(calendarMonth.jYear(), calendarMonth.jMonth());

  return (
    <div ref={rootRef} className={`jalali-date-picker ${className}`}>
      {/* Input & Buttons */}
      <div className="jalali-date-picker__control">
        <div className="jalali-date-picker__input-wrap">
          <input
            ref={inputRef}
            disabled={disabled}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onBlur={() => commitInput(input)}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className={`jalali-date-picker__input ${inputClassName}`}
          />
          <div
            className="jalali-date-picker__icon"
            onClick={() => {
              if (!open) {
                const p = parseJalali(input, format);
                if (p) setCalendarMonth(p);
              }
              setOpen((o) => !o);
              if (inputRef.current) inputRef.current.focus();
            }}
            aria-hidden="true"
          >
            <Calendar className="w-5 h-5" />
          </div>
        </div>
        {input && (
          <button
            type="button"
            onClick={() => {
              setInput("");
              if (onChange) onChange(null);
            }}
            className="jalali-date-picker__clear"
            aria-label="پاک کردن"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>

      {/* Calendar Popup */}
      {open && (
        <div
          ref={popupRef}
          className="jalali-date-picker__popup"
          style={{
            position: "absolute",
            right: 0,
            ...popupStyle,
            transformOrigin: placement === "bottom" ? "top right" : "bottom right",
            transform: "translateY(0)",
          }}
        >
          {/* Header */}
          <div className="jalali-date-picker__header">
            <button
              type="button"
              onClick={() => setCalendarMonth((c) => c.clone().subtract(1, "jMonth"))}
              className="jalali-date-picker__nav"
              aria-label="ماه قبلی"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="jalali-date-picker__title">
              {calendarMonth.format("jMMMM jYYYY")}
            </div>
            <button
              type="button"
              onClick={() => setCalendarMonth((c) => c.clone().add(1, "jMonth"))}
              className="jalali-date-picker__nav"
              aria-label="ماه بعدی"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Weekdays */}
          <div className="jalali-date-picker__weekdays">
            {["ش", "ی", "د", "س", "چ", "پ", "ج"].map((w) => (
              <div key={w}>
                {w}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="jalali-date-picker__days">
            {grid.map((d, idx) => {
              const dayMoment = d ? calendarMonth.clone().jDate(d) : null;
              const isToday = dayMoment?.isSame(today, "day");
              const isSelected = input === formatJalali(dayMoment, format);
              
              const minDate = min ? parseJalali(min, format) : null;
              const maxDate = max ? parseJalali(max, format) : null;
              
              const isDisabled =
                (minDate && dayMoment?.isBefore(minDate)) ||
                (maxDate && dayMoment?.isAfter(maxDate));

              return (
                <button
                  type="button"
                  key={idx}
                  disabled={!!isDisabled || !d}
                  onClick={() => d && selectDate(d)}
                  className={[
                    "jalali-date-picker__day",
                    !d ? "is-empty" : "",
                    isDisabled ? "is-disabled" : "",
                    isToday ? "is-today" : "",
                    isSelected ? "is-selected" : "",
                  ].join(" ")}
                  aria-label={d ? `روز ${d}` : undefined}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* Today Button */}
          <div className="jalali-date-picker__footer">
            <button
              type="button"
              onClick={() => {
                const m = today.clone();
                const formatted = formatJalali(m, format);
                setInput(formatted);
                if (onChange) onChange(formatted);
                setCalendarMonth(m);
                setOpen(false);
              }}
              className="jalali-date-picker__today"
            >
              امروز
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
