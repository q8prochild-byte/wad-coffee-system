import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';

interface DecimalInputProps {
  value: number;
  onChange: (v: number) => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  style?: CSSProperties;
}

export default function DecimalInput({
  value,
  onChange,
  className = 'form-control',
  placeholder,
  autoFocus,
  style,
}: DecimalInputProps) {
  const [text, setText] = useState<string>(value ? String(value) : '');

  // إعادة مزامنة النص إذا تغيّرت القيمة من مصدر خارجي (مثل اختيار منتج آخر)
  // فقط عندما لا يكون الفرق ناتجًا عن كتابة داخل الحقل نفسه
  useEffect(() => {
    const current = text === '' ? 0 : parseFloat(text);
    if (isNaN(current) || current !== value) {
      setText(value ? String(value) : '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      type="text"
      inputMode="decimal"
      className={className}
      style={style}
      placeholder={placeholder}
      autoFocus={autoFocus}
      value={text}
      onChange={(e) => {
        const raw = e.target.value;
        // يسمح فقط بأرقام ونقطة عشرية واحدة (يدعم كتابة 0.050 بدون مسح تلقائي)
        if (!/^\d*\.?\d*$/.test(raw)) return;
        setText(raw);
        if (raw === '' || raw === '.') {
          onChange(0);
        } else {
          const num = parseFloat(raw);
          if (!isNaN(num)) onChange(num);
        }
      }}
      onBlur={() => {
        setText(value ? String(value) : '');
      }}
    />
  );
}
