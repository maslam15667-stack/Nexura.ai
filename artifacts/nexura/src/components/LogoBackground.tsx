import nexuraLogo from "@assets/ChatGPT_Image_Jun_11,_2026,_09_45_11_AM_1781152668994.png";

export function LogoBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center"
      aria-hidden="true"
    >
      <img
        src={nexuraLogo}
        alt=""
        className="w-[55vw] max-w-sm opacity-[0.04] select-none"
        style={{ filter: "grayscale(1) brightness(2)" }}
      />
    </div>
  );
}
