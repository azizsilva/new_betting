export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="size-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
    </div>
  );
}
