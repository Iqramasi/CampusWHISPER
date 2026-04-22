

// 'use client';

// export default function ThemedSelect({
//   value,
//   onChange,
//   options,
//   placeholder,
//   disabled = false,
// }) {
//   return (
//     <div className="select-wrap">
//       <select
//         value={value}
//         onChange={(e) => onChange?.(e.target.value)}
//         disabled={disabled}
//         className="themed-select"
//       >
//         {placeholder && (
//           <option value="" disabled hidden>
//             {placeholder}
//           </option>
//         )}

//         {options?.map((option) => (
//           <option key={option.value || option.label} value={option.value}>
//             {option.label}
//           </option>
//         ))}
//       </select>

//       <span className="select-arrow">▾</span>
//     </div>
//   );
// }


'use client';
import { useState } from 'react';

export default function ThemedSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false);

  const selected = options.find(o => o.value === value);

  return (
    <div className="custom-select">
      <div
        className="select-box"
        onClick={() => setOpen(!open)}
      >
        {selected?.label || "What’s this about?"}
        <span>▾</span>
      </div>

      {open && (
        <div className="select-dropdown">
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`select-item ${value === opt.value ? 'active' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}