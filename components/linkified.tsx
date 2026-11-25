export function Linkified({ text }: { text: string }) {
  if (!text.trim()) {
    return <p className="description">No description was included in the channel feed.</p>;
  }
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return (
    <p className="description">
      {parts.map((part, index) => {
        if (!part.startsWith("http")) return <span key={index}>{part}</span>;
        const href = part.replace(/[),.;]+$/g, "");
        const trailing = part.slice(href.length);
        return (
          <span key={index}>
            <a href={href} target="_blank" rel="noreferrer noopener">
              {href}
            </a>
            {trailing}
          </span>
        );
      })}
    </p>
  );
}
