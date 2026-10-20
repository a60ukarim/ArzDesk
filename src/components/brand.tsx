import Image from "next/image";
export function Brand() {
  return (
    <span className="brand">
      <Image
        className="brand-logo"
        src="/arzdesk-logo-v1.png"
        alt="ArzDesk logo"
        width={44}
        height={44}
        sizes="44px"
        priority
      />
      <span className="brand-copy">
        <strong>ArzDesk</strong>
        <small>by ArzCore</small>
      </span>
    </span>
  );
}
