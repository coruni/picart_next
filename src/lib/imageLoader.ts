export default function imageLoader({ src }: { src: string }) {
  // Return the image URL as-is, bypassing Next.js optimization
  return src;
}
