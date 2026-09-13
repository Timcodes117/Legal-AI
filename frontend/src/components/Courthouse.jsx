export default function Courthouse() {
  return (
    <svg className="courthouse" viewBox="0 0 720 480" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <clipPath id="court-photo-clip">
          <path d="M72 28c-28 8-48 36-52 92 0 78 8 168 28 228 22 68 86 118 188 122 210 8 444-12 460-168C712 148 640 20 430 16 280 12 132 12 72 28Z" />
        </clipPath>
      </defs>
      <path
        className="court-blob"
        d="M40 8C-16 56-20 188 18 300c36 108 140 188 318 176 210-14 424-70 392-250C700 48 500-24 300 8 186 28 86-28 40 8Z"
      />
      <image
        href="/High-Court-abuja.jpg"
        x="0"
        y="0"
        width="720"
        height="480"
        preserveAspectRatio="xMidYMid slice"
        clipPath="url(#court-photo-clip)"
      />
    </svg>
  );
}
