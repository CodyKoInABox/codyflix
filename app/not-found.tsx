import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page empty-state">
      <h1>That page is not on Codyflix</h1>
      <p>The catalog only includes recent uploads from the channels in this browser.</p>
      <Link className="btn" href="/">
        Back home
      </Link>
    </div>
  );
}
