import Image from "next/image";
import Link from "next/link";

const whatsappNumber = "919840905577";
const instagramUsername = "chennai_adams_collections";
const mapUrl = "https://maps.app.goo.gl/6G5CEWtytgBi2hiR8";

export default function Footer() {
  return (
    <footer
      id="contact"
      className="border-t border-[#B87333]/15 bg-[#FFFAF3] px-6 py-16 text-stone-950 md:px-12"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-[1.3fr_0.8fr_1.2fr] md:items-start">
          <div>
            <h2 className="font-heading bg-gradient-to-r from-[#7A3E1D] via-[#D08A45] to-[#7A3E1D] bg-clip-text text-4xl font-semibold tracking-wide text-transparent">
              Adams Elite
            </h2>

            <p className="mt-5 max-w-md text-sm leading-7 text-stone-600">
              Luxury fashion jewellery, bridal collections, rentals, perfumes,
              handbags and footwear crafted for every occasion.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-black">
              Quick Links
            </h3>

            <ul className="mt-5 space-y-3 text-sm text-stone-600">
              <li>
                <Link href="/" className="hover:text-[#B87333]">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-[#B87333]">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-[#B87333]">
                  Admin
                </Link>
              </li>
              <li>
                <Link href="/admin/orders" className="hover:text-[#B87333]">
                  Orders
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-black">
              Contact
            </h3>

            <ul className="mt-5 space-y-3 text-sm text-stone-600">
              <li>
                WhatsApp:{" "}
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-stone-950 underline decoration-[#B87333]/40 underline-offset-4 hover:text-[#B87333]"
                >
                  +{whatsappNumber}
                </a>
              </li>

              <li>
                Instagram:{" "}
                <a
                  href={`https://instagram.com/${instagramUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-stone-950 underline decoration-[#B87333]/40 underline-offset-4 hover:text-[#B87333]"
                >
                  @{instagramUsername}
                </a>
              </li>

              <li>
                Location:{" "}
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-stone-950 underline decoration-[#B87333]/40 underline-offset-4 hover:text-[#B87333]"
                >
                  View on Google Maps
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-[#B87333]/15 pt-8 md:flex-row md:items-end md:justify-between">
          <div className="text-sm text-stone-500">
            © 2026 Adams Elite. All rights reserved.
          </div>

          <div className="md:text-right">
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-black">
              Instagram QR
            </h3>

            <div className="mt-4 inline-block rounded-3xl border border-[#B87333]/20 bg-white/75 p-4 shadow-sm">
              <Image
                src="/images/instagram-qr.png"
                alt="Adams Elite Instagram QR"
                width={145}
                height={145}
                className="rounded-2xl"
              />
            </div>

            <p className="mt-3 text-sm text-stone-600">
              Scan to follow Adams Elite on Instagram.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}