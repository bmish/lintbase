export default function Footer() {
  return (
    <section>
      <div className="container mx-auto py-10 max-w-3xl text-center">
        © {new Date().getFullYear()} Lintbase
      </div>
    </section>
  );
}
