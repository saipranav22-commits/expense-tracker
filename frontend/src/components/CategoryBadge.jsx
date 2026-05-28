import React from 'react';

function CategoryBadge({ name, color }) {
  const safeColor = color || '#6c63ff';

  // Convert hex to rgba for background
  const hexToRgba = (hex, alpha) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(108, 99, 255, ${alpha})`;
    return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`;
  };

  return (
    <span
      className="badge"
      style={{
        backgroundColor: hexToRgba(safeColor, 0.18),
        color: safeColor,
        border: `1px solid ${hexToRgba(safeColor, 0.3)}`,
      }}
    >
      <span
        style={{
          display: 'inline-block',
          width: 7,
          height: 7,
          borderRadius: '50%',
          backgroundColor: safeColor,
          flexShrink: 0,
          boxShadow: `0 0 6px ${safeColor}`,
        }}
      />
      {name}
    </span>
  );
}

export default CategoryBadge;
