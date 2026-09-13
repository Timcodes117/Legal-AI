import { ClipLoader, PulseLoader } from "react-spinners";

const GREEN = "#1a4d3e";

export function StatusSpinner() {
  return <PulseLoader color={GREEN} size={7} speedMultiplier={0.85} />;
}

export function ButtonSpinner({ light = false, size = 22 }) {
  return <ClipLoader color={light ? "#fff" : GREEN} size={size} />;
}

export function PageBusy({ label }) {
  return (
    <div className="page-busy">
      <ClipLoader color={GREEN} size={28} />
      {label ? <p>{label}</p> : null}
    </div>
  );
}
