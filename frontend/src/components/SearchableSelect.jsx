import React from "react";
import Select, { components } from "react-select";
import { Search } from "lucide-react";

function DropdownIndicator(props) {
  return (
    <components.DropdownIndicator {...props}>
      <Search size={18} strokeWidth={2.4} />
    </components.DropdownIndicator>
  );
}

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "جستجو کنید یا انتخاب کنید",
  isClearable = true,
  isDisabled = false,
  noOptionsMessage = "نتیجه ای یافت نشد",
}) {
  return (
    <Select
      value={options.find((opt) => String(opt.value) === String(value)) || null}
      onChange={(selected) => onChange(selected ? selected.value : "")}
      options={options}
      placeholder={placeholder}
      isClearable={isClearable}
      isSearchable
      isRtl
      isDisabled={isDisabled}
      openMenuOnFocus
      components={{ DropdownIndicator }}
      noOptionsMessage={() => noOptionsMessage}
      classNamePrefix="rs"
      styles={{
        control: (base, state) => ({
          ...base,
          minHeight: 42,
          borderRadius: 12,
          borderColor: state.isFocused ? "#0f766e" : "#cbd5e1",
          boxShadow: state.isFocused ? "0 0 0 2px #ccfbf1" : "none",
          '&:hover': { borderColor: "#0f766e" },
          direction: "rtl",
        }),
        input: (base) => ({
          ...base,
          color: "#0f172a",
        }),
        dropdownIndicator: (base, state) => ({
          ...base,
          color: state.isFocused ? "#0f766e" : "#64748b",
          paddingInline: 10,
        }),
        clearIndicator: (base) => ({ ...base, color: "#64748b" }),
        menu: (base) => ({ ...base, zIndex: 40, direction: "rtl" }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        placeholder: (base) => ({ ...base, color: "#94a3b8" }),
        singleValue: (base) => ({ ...base, color: "#0f172a" }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isSelected ? "#0f766e" : state.isFocused ? "#f1f5f9" : "white",
          color: state.isSelected ? "white" : "#0f172a",
          cursor: "pointer",
        }),
      }}
      menuPortalTarget={document.body}
    />
  );
}
