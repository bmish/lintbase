import Header from '@/components/Header';

export default function index() {
  return (
    <div className="bg-gray-100">
      <Header />

      <main className="flex-grow overflow-y-auto bg-gray-100 py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-semibold mb-4">Welcome to My Website</h1>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec
            auctor eros augue, a pellentesque arcu consectetur ac. Nulla
            facilisi. Vestibulum vel fringilla tortor. Duis rhoncus nulla id
            aliquet ultricies. Quisque semper elit vel nisi ultricies, id
            feugiat nunc tristique. Phasellus at ullamcorper neque, sed ultrices
            ligula. Sed vel orci leo. Integer commodo consectetur leo, ac
            posuere tortor facilisis id. Morbi consequat hendrerit turpis in
            porttitor. Sed luctus, nisl et semper scelerisque, turpis felis
            vehicula velit, a pellentesque odio arcu a nisl. Curabitur eu
            gravida nisl. Nulla facilisi.
          </p>
        </div>
      </main>
    </div>
  );
}
