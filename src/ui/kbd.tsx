import React from "react";

const Kbd = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={`border  text-xs border-gray-300 rounded-md px-2 py-1 bg-sunken ${className ?? ""}`}
    >
      {children}
    </div>
  );
};

export default Kbd;
